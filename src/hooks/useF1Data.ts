import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../api/openf1';
import { OpenF1Error } from '../api/openf1';
import type {
  Session,
  Driver,
  Location,
  Interval,
  Lap,
  CarData,
  DriverWithData,
} from '../types/openf1';
import {
  metersPerUnitFromTrackOutline,
  speedKmhFromLocationSeries,
} from '../lib/locationSpeed';
import { isErgastSessionKey } from '../lib/ergastKeys';

const POLL_MS = 4000;

function isSessionLive(session: Session): boolean {
  const now = Date.now();
  const start = new Date(session.date_start).getTime() - 30 * 60 * 1000;
  const end = session.date_end
    ? new Date(session.date_end).getTime() + 30 * 60 * 1000
    : Infinity;
  return now >= start && now <= end;
}

function latestByDriver<T extends { driver_number: number; date: string }>(
  items: T[]
): Map<number, T> {
  const map = new Map<number, T>();
  for (const item of items) {
    const existing = map.get(item.driver_number);
    if (!existing || item.date > existing.date) {
      map.set(item.driver_number, item);
    }
  }
  return map;
}

export function useF1Data(_initialSessionKey?: number) {
  const [session, setSession] = useState<Session | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverLocations, setDriverLocations] = useState<Map<number, Location>>(new Map());
  /** Reference lap locations for map alignment + speed scaling (not shown as the track line). */
  const [trackOutline, setTrackOutline] = useState<Location[]>([]);
  const [trackSpeedKmhByDriver, setTrackSpeedKmhByDriver] = useState<Map<number, number>>(
    () => new Map()
  );
  const [positions, setPositions] = useState<Map<number, number>>(new Map());
  const [intervals, setIntervals] = useState<Map<number, Interval>>(new Map());

  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number | null>(null);
  const [selectedDriverLaps, setSelectedDriverLaps] = useState<Lap[]>([]);
  const [selectedDriverCarData, setSelectedDriverCarData] = useState<CarData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const carPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocSampleRef = useRef<Map<number, Location>>(new Map());
  const trackOutlineRef = useRef<Location[]>([]);

  const updateLiveData = useCallback(async (sess: Session) => {
    try {
      const [locations, positionsData, intervalsData] = await Promise.all([
        api.fetchLatestLocations(sess.session_key, sess),
        api.fetchPositions(sess.session_key, sess),
        api.fetchIntervals(sess.session_key, sess),
      ]);

      if (locations.length > 0) {
        setDriverLocations(latestByDriver(locations));

        const mpu = metersPerUnitFromTrackOutline(trackOutlineRef.current);
        const byDriver = new Map<number, Location[]>();
        for (const loc of locations) {
          const list = byDriver.get(loc.driver_number) ?? [];
          list.push(loc);
          byDriver.set(loc.driver_number, list);
        }

        setTrackSpeedKmhByDriver((prev) => {
          const next = new Map(prev);
          for (const [driverNumber, samples] of byDriver) {
            const sorted = [...samples].sort((a, b) => (a.date < b.date ? -1 : 1));
            const prevSample = lastLocSampleRef.current.get(driverNumber);
            let series = sorted;
            if (
              prevSample &&
              sorted.length > 0 &&
              sorted[0]!.date > prevSample.date &&
              sorted[0]!.date !== prevSample.date
            ) {
              series = [prevSample, ...sorted];
            }
            const kmh = speedKmhFromLocationSeries(series, mpu);
            if (kmh != null) next.set(driverNumber, kmh);
            const newest = sorted[sorted.length - 1]!;
            lastLocSampleRef.current.set(driverNumber, newest);
          }
          return next;
        });
      }
      if (positionsData.length > 0) {
        const posMap = new Map<number, number>();
        latestByDriver(positionsData).forEach((p, num) => posMap.set(num, p.position));
        setPositions(posMap);
      }
      if (intervalsData.length > 0) {
        setIntervals(latestByDriver(intervalsData));
      }
    } catch (err) {
      // Transient errors (rate limit, network blip) — silently skip this poll tick.
      // Non-transient errors get a warn so they're visible in DevTools but never
      // surface to the user as they're mid-session.
      if (err instanceof OpenF1Error && err.transient) return;
      console.warn('[useF1Data] Poll error (non-fatal):', err instanceof Error ? err.message : err);
    }
  }, []);

  const initialize = useCallback(async (overrideSessionKey?: number, attempt = 0) => {
    setIsLoading(true);
    setError(null);
    // Clear ALL stale data when switching sessions
    setDrivers([]);
    setDriverLocations(new Map());
    setPositions(new Map());
    setIntervals(new Map());
    setTrackOutline([]);
    setTrackSpeedKmhByDriver(new Map());
    setSelectedDriverNumber(null);
    setSelectedDriverLaps([]);
    setSelectedDriverCarData(null);
    trackOutlineRef.current = [];
    lastLocSampleRef.current.clear();

    try {
      const sessionData = overrideSessionKey
        ? await api.fetchSessionByKey(overrideSessionKey)
        : await api.fetchLatestSession();

      if (!sessionData) {
        console.warn('[useF1Data] Session fetch returned null — empty array from OpenF1');
        setError('No session data available from OpenF1.');
        return;
      }

      console.log('[useF1Data] Session loaded:', sessionData.session_key, sessionData.location, sessionData.session_name);

      setSession(sessionData);
      sessionRef.current = sessionData;
      setIsLive(isSessionLive(sessionData));

      const ergastOnly = isErgastSessionKey(sessionData.session_key);

      if (ergastOnly) {
        setDrivers([]);
        setIsLive(false);
      } else {
        const driverData = await api.fetchDrivers(sessionData.session_key);
        setDrivers(driverData);

        if (driverData.length > 0) {
          const candidateDrivers = driverData.slice(0, 4).map((d) => d.driver_number);
          (async () => {
            for (const driverNumber of candidateDrivers) {
              try {
                const pts = await api.fetchCleanTrackLap(sessionData.session_key, driverNumber);
                if (pts.length >= 50) {
                  trackOutlineRef.current = pts;
                  setTrackOutline(pts);
                  return;
                }
              } catch { /* try next driver */ }
            }
            try {
              const pts = await api.fetchCleanTrackLap(sessionData.session_key, candidateDrivers[0]);
              if (pts.length >= 10) {
                trackOutlineRef.current = pts;
                setTrackOutline(pts);
              }
            } catch { /* no track outline available */ }
          })();
        }

        await updateLiveData(sessionData);
      }

    } catch (err) {
      // Transient error during init (rate limit / network blip that survived all
      // apiFetch retries) — silently retry the whole init once after a short delay
      // rather than showing an error screen.
      if (err instanceof OpenF1Error && err.transient && attempt === 0) {
        console.warn('[useF1Data] Transient init error, retrying once…', err.message);
        setIsLoading(false);
        await new Promise((r) => setTimeout(r, 2000));
        return initialize(overrideSessionKey, 1);
      }
      const msg = err instanceof Error ? err.message : 'Failed to load session data.';
      console.error('[useF1Data] Initialization failed:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [updateLiveData]);

  // Bootstrap — run once on mount
  useEffect(() => {
    initialize();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll live data
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const sess = sessionRef.current;
    if (sess && isLive) {
      pollRef.current = setInterval(() => updateLiveData(sess), POLL_MS);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLive, updateLiveData]);

  useEffect(() => {
    trackOutlineRef.current = trackOutline;
  }, [trackOutline]);

  // Fetch selected driver data
  useEffect(() => {
    if (carPollRef.current) clearInterval(carPollRef.current);

    if (!selectedDriverNumber || !sessionRef.current) {
      setSelectedDriverLaps([]);
      setSelectedDriverCarData(null);
      return;
    }

    const sess = sessionRef.current;

    const fetchDriverDetails = async () => {
      const [laps, carDataPts] = await Promise.all([
        api.fetchLaps(sess.session_key, selectedDriverNumber),
        api.fetchCarData(sess.session_key, selectedDriverNumber, sess),
      ]);
      setSelectedDriverLaps(laps);
      if (carDataPts.length > 0) {
        setSelectedDriverCarData(carDataPts[carDataPts.length - 1]);
      }
    };

    fetchDriverDetails();

    if (isLive) {
      carPollRef.current = setInterval(async () => {
        const [laps, pts] = await Promise.all([
          api.fetchLaps(sess.session_key, selectedDriverNumber),
          api.fetchCarData(sess.session_key, selectedDriverNumber, sess),
        ]);
        setSelectedDriverLaps(laps);
        if (pts.length > 0) setSelectedDriverCarData(pts[pts.length - 1]);
      }, POLL_MS);
    }

    return () => {
      if (carPollRef.current) clearInterval(carPollRef.current);
    };
  }, [selectedDriverNumber, isLive]);

  // Build enriched, sorted driver list
  const driversWithData: DriverWithData[] = drivers
    .map((driver) => ({
      ...driver,
      position: positions.get(driver.driver_number),
      gap_to_leader: intervals.get(driver.driver_number)?.gap_to_leader,
      interval: intervals.get(driver.driver_number)?.interval,
      currentLocation: driverLocations.get(driver.driver_number),
      trackSpeedKmh: trackSpeedKmhByDriver.get(driver.driver_number),
    }))
    .sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) return a.position - b.position;
      if (a.position !== undefined) return -1;
      if (b.position !== undefined) return 1;
      return a.driver_number - b.driver_number;
    });

  return {
    session,
    drivers: driversWithData,
    trackOutline,
    selectedDriverNumber,
    setSelectedDriverNumber,
    selectedDriverLaps,
    selectedDriverCarData,
    isLoading,
    error,
    isLive,
    refresh: () => initialize(),
    loadSession: (sessionKey: number) => initialize(sessionKey),
  };
}
