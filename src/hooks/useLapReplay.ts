import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/openf1';
import type { DriverWithData, Lap } from '../types/openf1';

export interface ReplayPoint {
  t: number; // seconds from lap start
  x: number;
  y: number;
}

export interface DriverReplayData {
  driver: DriverWithData;
  bestLap: Lap;
  points: ReplayPoint[];
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

// Linear interpolation between two replay points at time t
function interpolate(points: ReplayPoint[], t: number): { x: number; y: number } | null {
  if (points.length === 0) return null;
  if (t <= points[0].t) return { x: points[0].x, y: points[0].y };
  const last = points[points.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y };

  // Binary search
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

// Fetch location data for up to `batchSize` drivers at a time to stay under rate limits
async function batchFetchLocations(
  sessionKey: number,
  drivers: Array<{ driverNumber: number; dateStart: string; dateEnd: string }>,
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
      const t0 = sorted.length > 0 ? new Date(sorted[0].date).getTime() : 0;
      result.set(
        driverNumber,
        sorted.map((p) => ({
          t: (new Date(p.date).getTime() - t0) / 1000,
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

  const maxDuration = driverData.length > 0
    ? Math.max(...driverData.map((d) => d.bestLap.lap_duration ?? 0))
    : 0;

  // Refs for rAF loop — avoids stale closures
  const isPlayingRef = useRef(false);
  const speedRef = useRef<ReplaySpeed>(1);
  const currentTimeRef = useRef(0);
  const maxDurationRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { maxDurationRef.current = maxDuration; }, [maxDuration]);

  // rAF animation loop
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

  // Reset everything when the session changes so stale data never appears on a new circuit
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Load all best-lap data
  const load = useCallback(async () => {
    if (!sessionKey || drivers.length === 0) return;
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setDriverData([]);
    reset();

    try {
      setLoadingLabel('Fetching all lap times…');
      const allLaps = await api.fetchAllLaps(sessionKey);

      // Find each driver's best lap (fastest, non-pit-out, with duration)
      const bestLapByDriver = new Map<number, Lap>();
      for (const lap of allLaps) {
        if (lap.lap_duration == null || lap.is_pit_out_lap) continue;
        const existing = bestLapByDriver.get(lap.driver_number);
        if (!existing || lap.lap_duration < existing.lap_duration!) {
          bestLapByDriver.set(lap.driver_number, lap);
        }
      }

      const eligibleDrivers = drivers.filter((d) => bestLapByDriver.has(d.driver_number));
      if (eligibleDrivers.length === 0) {
        setError('No lap time data found for this session.');
        return;
      }

      setLoadingLabel(`Loading GPS data for ${eligibleDrivers.length} drivers…`);

      const locationRequests = eligibleDrivers.map((d) => {
        const lap = bestLapByDriver.get(d.driver_number)!;
        const dateStart = lap.date_start;
        const dateEnd = new Date(
          new Date(lap.date_start).getTime() + (lap.lap_duration! + 2) * 1000
        ).toISOString();
        return { driverNumber: d.driver_number, dateStart, dateEnd };
      });

      const locationMap = await batchFetchLocations(
        sessionKey,
        locationRequests,
        (loaded, total) => {
          setProgress(loaded / total);
          setLoadingLabel(`Loading GPS data… ${loaded}/${total} drivers`);
        }
      );

      const result: DriverReplayData[] = eligibleDrivers
        .map((driver) => ({
          driver,
          bestLap: bestLapByDriver.get(driver.driver_number)!,
          points: locationMap.get(driver.driver_number) ?? [],
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

  // Derived: current positions and trails from currentTime
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
