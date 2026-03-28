import { useEffect, useMemo, useState } from 'react';
import * as api from '../api/openf1';
import type { CarData } from '../types/openf1';
import { interpolateCarDataAtLapTime } from '../lib/carDataInterpolate';
import type { DriverReplayData } from './useLapReplay';

/**
 * Loads car_data for the selected driver's best replay lap and interpolates to `replayCurrentTime`.
 */
export function useReplayCarTelemetry(
  sessionKey: number | null,
  selectedDriverNumber: number | null,
  replayDriverData: DriverReplayData[],
  replayCurrentTime: number,
  enabled: boolean
): CarData | null {
  const [samples, setSamples] = useState<CarData[]>([]);

  const lapWindow = useMemo(() => {
    if (!enabled || !selectedDriverNumber) return null;
    const rd = replayDriverData.find((d) => d.driver.driver_number === selectedDriverNumber);
    if (!rd) return null;
    const dur = rd.bestLap.lap_duration;
    if (dur == null) return null;
    const lap = rd.bestLap;
    const dateEnd = new Date(new Date(lap.date_start).getTime() + (dur + 3) * 1000).toISOString();
    return { dateStart: lap.date_start, dateEnd };
  }, [enabled, selectedDriverNumber, replayDriverData]);

  useEffect(() => {
    if (!sessionKey || !lapWindow) {
      setSamples([]);
      return;
    }

    let cancelled = false;
    api
      .fetchCarDataRange(sessionKey, selectedDriverNumber!, lapWindow.dateStart, lapWindow.dateEnd)
      .then((pts) => {
        if (!cancelled) setSamples(pts);
      })
      .catch(() => {
        if (!cancelled) setSamples([]);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionKey, selectedDriverNumber, lapWindow]);

  return useMemo(() => {
    if (!lapWindow || samples.length === 0) return null;
    return interpolateCarDataAtLapTime(samples, lapWindow.dateStart, replayCurrentTime);
  }, [lapWindow, samples, replayCurrentTime]);
}
