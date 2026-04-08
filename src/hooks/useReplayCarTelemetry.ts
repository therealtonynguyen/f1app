import { useEffect, useMemo, useState } from 'react';
import * as api from '../api/openf1';
import type { CarData } from '../types/openf1';
import { interpolateCarDataAtLapTime } from '../lib/carDataInterpolate';
import type { DriverReplayData } from './useLapReplay';

/**
 * Loads car_data for the selected driver's full replay window and interpolates to `replayCurrentTime`
 * (seconds since shared `replayT0`).
 */
export function useReplayCarTelemetry(
  sessionKey: number | null,
  selectedDriverNumber: number | null,
  replayDriverData: DriverReplayData[],
  replayCurrentTime: number,
  enabled: boolean
): CarData | null {
  const [samples, setSamples] = useState<CarData[]>([]);

  const raceWindow = useMemo(() => {
    if (!enabled || !selectedDriverNumber) return null;
    const rd = replayDriverData.find((d) => d.driver.driver_number === selectedDriverNumber);
    if (!rd) return null;
    const last = rd.lastLap;
    if (last.lap_duration == null) return null;
    const dateStart = rd.firstLap.date_start;
    const dateEnd = new Date(
      new Date(last.date_start).getTime() + (last.lap_duration + 3) * 1000
    ).toISOString();
    return { dateStart, dateEnd, replayT0: rd.replayT0 };
  }, [enabled, selectedDriverNumber, replayDriverData]);

  useEffect(() => {
    if (!sessionKey || !raceWindow) {
      setSamples([]);
      return;
    }

    let cancelled = false;
    api
      .fetchCarDataRange(sessionKey, selectedDriverNumber!, raceWindow.dateStart, raceWindow.dateEnd)
      .then((pts) => {
        if (!cancelled) setSamples(pts);
      })
      .catch(() => {
        if (!cancelled) setSamples([]);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionKey, selectedDriverNumber, raceWindow]);

  return useMemo(() => {
    if (!raceWindow || samples.length === 0) return null;
    return interpolateCarDataAtLapTime(samples, raceWindow.replayT0, replayCurrentTime);
  }, [raceWindow, samples, replayCurrentTime]);
}
