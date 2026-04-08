import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/openf1';
import type { DriverWithData, Lap } from '../types/openf1';

export interface ReplayPoint {
  /** Seconds since session replay origin (`replayT0`). */
  t: number;
  x: number;
  y: number;
}

export interface DriverReplayData {
  driver: DriverWithData;
  /** First timed lap included in this replay window. */
  firstLap: Lap;
  /** Last timed lap included in this replay window. */
  lastLap: Lap;
  /** ISO instant for scrubber `t = 0` (earliest first-lap start among loaded drivers). */
  replayT0: string;
  points: ReplayPoint[];
  /** Official classification position vs replay time (`t` seconds since `replayT0`). */
  positionHistory: { t: number; position: number }[];
}

export type ReplaySpeed = 0.25 | 0.5 | 1 | 2 | 4 | 8;

/** Axis-aligned bounds of all loaded lap GPS (stable during playback). */
export type ReplayTelemetryBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export interface LapReplayState {
  // Data loading
  isLoading: boolean;
  progress: number; // 0–1 loading progress
  loadingLabel: string;
  error: string | null;
  driverData: DriverReplayData[];

  // Playback
  currentTime: number;
  maxDuration: number;
  isPlaying: boolean;
  speed: ReplaySpeed;

  // Controls
  load: () => Promise<void>;
  play: () => void;
  pause: () => void;
  reset: () => void;
  seek: (t: number) => void;
  setSpeed: (s: ReplaySpeed) => void;

  // Current positions and trails derived from currentTime
  positions: Map<number, { x: number; y: number }>;
  trails: Map<number, ReplayPoint[]>;
  replayTelemetryBounds: ReplayTelemetryBounds | null;
}

function timedLapsForDriver(laps: Lap[], driverNumber: number): Lap[] {
  return laps
    .filter((l) => l.driver_number === driverNumber && l.lap_duration != null)
    .sort((a, b) => a.lap_number - b.lap_number);
}

// Linear interpolation between two replay points at time t
function interpolate(points: ReplayPoint[], t: number): { x: number; y: number } | null {
  if (points.length === 0) return null;
  if (t <= points[0].t) return { x: points[0].x, y: points[0].y };
  const last = points[points.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y };

  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (points[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const p0 = points[lo];
  const p1 = points[hi];
  const frac = (t - p0.t) / (p1.t - p0.t);
  return { x: p0.x + (p1.x - p0.x) * frac, y: p0.y + (p1.y - p0.y) * frac };
}

// Slice all points up to time t for the trail, limited to last TRAIL_SECS seconds
const TRAIL_SECS = 20;
function trailPoints(points: ReplayPoint[], t: number): ReplayPoint[] {
  const end = points.findIndex((p) => p.t > t);
  const slice = end === -1 ? points : points.slice(0, end);
  if (slice.length === 0) return [];
  const trailStart = t - TRAIL_SECS;
  const startIdx = slice.findIndex((p) => p.t >= trailStart);
  return startIdx === -1 ? slice : slice.slice(startIdx);
}

async function batchFetchLocations(
  sessionKey: number,
  drivers: Array<{ driverNumber: number; dateStart: string; dateEnd: string }>,
  replayT0Ms: number,
  onBatchDone: (loaded: number, total: number) => void
): Promise<Map<number, ReplayPoint[]>> {
  const BATCH_SIZE = 3;
  const BATCH_DELAY_MS = 400;
  const result = new Map<number, ReplayPoint[]>();

  for (let i = 0; i < drivers.length; i += BATCH_SIZE) {
    const batch = drivers.slice(i, i + BATCH_SIZE);
    const fetched = await Promise.all(
      batch.map(({ driverNumber, dateStart, dateEnd }) =>
        api
          .fetchLocationRange(sessionKey, driverNumber, dateStart, dateEnd)
          .then((locs) => ({ driverNumber, locs }))
          .catch(() => ({ driverNumber, locs: [] as import('../types/openf1').Location[] }))
      )
    );
    for (const { driverNumber, locs } of fetched) {
      const sorted = [...locs].sort((a, b) => (a.date < b.date ? -1 : 1));
      result.set(
        driverNumber,
        sorted.map((p) => ({
          t: (new Date(p.date).getTime() - replayT0Ms) / 1000,
          x: p.x,
          y: p.y,
        }))
      );
    }
    onBatchDone(Math.min(i + BATCH_SIZE, drivers.length), drivers.length);
    if (i + BATCH_SIZE < drivers.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }
  return result;
}

function buildPositionHistories(
  rows: import('../types/openf1').Position[],
  replayT0Ms: number
): Map<number, { t: number; position: number }[]> {
  const byDriver = new Map<number, { t: number; position: number }[]>();
  for (const row of rows) {
    const t = (new Date(row.date).getTime() - replayT0Ms) / 1000;
    if (!isFinite(t)) continue;
    const list = byDriver.get(row.driver_number) ?? [];
    list.push({ t, position: row.position });
    byDriver.set(row.driver_number, list);
  }
  for (const list of byDriver.values()) {
    list.sort((a, b) => a.t - b.t);
  }
  return byDriver;
}

export function useLapReplay(
  sessionKey: number | null,
  drivers: DriverWithData[]
): LapReplayState {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [driverData, setDriverData] = useState<DriverReplayData[]>([]);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);

  const maxDuration = useMemo(() => {
    if (driverData.length === 0) return 0;
    const t0ms = new Date(driverData[0]!.replayT0).getTime();
    let maxT = 0;
    for (const d of driverData) {
      const endMs =
        new Date(d.lastLap.date_start).getTime() + (d.lastLap.lap_duration! + 3) * 1000;
      maxT = Math.max(maxT, (endMs - t0ms) / 1000);
      const lp = d.points[d.points.length - 1]?.t ?? 0;
      const pp = d.positionHistory[d.positionHistory.length - 1]?.t ?? 0;
      maxT = Math.max(maxT, lp, pp);
    }
    return maxT;
  }, [driverData]);

  const isPlayingRef = useRef(false);
  const speedRef = useRef<ReplaySpeed>(1);
  const currentTimeRef = useRef(0);
  const maxDurationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { maxDurationRef.current = maxDuration; }, [maxDuration]);

  const animate = useCallback((ts: number) => {
    if (!isPlayingRef.current) return;
    if (lastTsRef.current !== null) {
      const delta = ((ts - lastTsRef.current) / 1000) * speedRef.current;
      const next = Math.min(currentTimeRef.current + delta, maxDurationRef.current);
      currentTimeRef.current = next;
      setCurrentTime(next);
      if (next >= maxDurationRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        lastTsRef.current = null;
        return;
      }
    }
    lastTsRef.current = ts;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const play = useCallback(() => {
    if (currentTimeRef.current >= maxDurationRef.current) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
    }
    lastTsRef.current = null;
    setIsPlaying(true);
    isPlayingRef.current = true;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastTsRef.current = null;
  }, []);

  const reset = useCallback(() => {
    pause();
    currentTimeRef.current = 0;
    setCurrentTime(0);
  }, [pause]);

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(t, maxDurationRef.current));
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);
    },
    []
  );

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    isPlayingRef.current = false;
    lastTsRef.current = null;
    currentTimeRef.current = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDriverData([]);
    setError(null);
    setProgress(0);
    setLoadingLabel('');
  }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const load = useCallback(async () => {
    if (!sessionKey || drivers.length === 0) return;
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setDriverData([]);
    reset();

    try {
      setLoadingLabel('Fetching lap times…');
      const allLaps = await api.fetchAllLaps(sessionKey);

      const firstLapByDriver = new Map<number, Lap>();
      const lastLapByDriver = new Map<number, Lap>();

      for (const d of drivers) {
        const timed = timedLapsForDriver(allLaps, d.driver_number);
        if (timed.length === 0) continue;
        firstLapByDriver.set(d.driver_number, timed[0]!);
        lastLapByDriver.set(d.driver_number, timed[timed.length - 1]!);
      }

      const eligibleDrivers = drivers.filter((d) => firstLapByDriver.has(d.driver_number));
      if (eligibleDrivers.length === 0) {
        setError('No lap time data found for this session.');
        return;
      }

      let replayT0Ms = Infinity;
      let globalEndMs = 0;
      for (const d of eligibleDrivers) {
        const first = firstLapByDriver.get(d.driver_number)!;
        const last = lastLapByDriver.get(d.driver_number)!;
        const startMs = new Date(first.date_start).getTime();
        const endMs = new Date(last.date_start).getTime() + (last.lap_duration! + 3) * 1000;
        if (startMs < replayT0Ms) replayT0Ms = startMs;
        if (endMs > globalEndMs) globalEndMs = endMs;
      }
      const replayT0 = new Date(replayT0Ms).toISOString();
      const globalDateEnd = new Date(globalEndMs).toISOString();

      setLoadingLabel('Fetching race positions…');
      setProgress(0.05);
      let positionRows: import('../types/openf1').Position[] = [];
      try {
        positionRows = await api.fetchPositionRange(sessionKey, replayT0, globalDateEnd);
      } catch {
        positionRows = [];
      }
      const positionByDriver = buildPositionHistories(positionRows, replayT0Ms);

      setLoadingLabel(`Loading GPS for ${eligibleDrivers.length} drivers…`);
      const locationRequests = eligibleDrivers.map((d) => {
        const first = firstLapByDriver.get(d.driver_number)!;
        const last = lastLapByDriver.get(d.driver_number)!;
        const dateStart = first.date_start;
        const dateEnd = new Date(
          new Date(last.date_start).getTime() + (last.lap_duration! + 3) * 1000
        ).toISOString();
        return { driverNumber: d.driver_number, dateStart, dateEnd };
      });

      const locationMap = await batchFetchLocations(
        sessionKey,
        locationRequests,
        replayT0Ms,
        (loaded, total) => {
          setProgress(0.05 + (loaded / total) * 0.95);
          setLoadingLabel(`Loading GPS… ${loaded}/${total} drivers`);
        }
      );

      const result: DriverReplayData[] = eligibleDrivers
        .map((driver) => ({
          driver,
          firstLap: firstLapByDriver.get(driver.driver_number)!,
          lastLap: lastLapByDriver.get(driver.driver_number)!,
          replayT0,
          points: locationMap.get(driver.driver_number) ?? [],
          positionHistory: positionByDriver.get(driver.driver_number) ?? [],
        }))
        .filter((d) => d.points.length > 1);

      setDriverData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load replay data.');
    } finally {
      setIsLoading(false);
      setLoadingLabel('');
    }
  }, [sessionKey, drivers, reset]);

  const replayTelemetryBounds = useMemo((): ReplayTelemetryBounds | null => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const { points } of driverData) {
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    if (minX === Infinity) return null;
    return { minX, maxX, minY, maxY };
  }, [driverData]);

  const positions = new Map<number, { x: number; y: number }>();
  const trails = new Map<number, ReplayPoint[]>();
  for (const { driver, points } of driverData) {
    const pos = interpolate(points, currentTime);
    if (pos) positions.set(driver.driver_number, pos);
    trails.set(driver.driver_number, trailPoints(points, currentTime));
  }

  return {
    isLoading,
    progress,
    loadingLabel,
    error,
    driverData,
    currentTime,
    maxDuration,
    isPlaying,
    speed,
    load,
    play,
    pause,
    reset,
    seek,
    setSpeed,
    positions,
    trails,
    replayTelemetryBounds,
  };
}
