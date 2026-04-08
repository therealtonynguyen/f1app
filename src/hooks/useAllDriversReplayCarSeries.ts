import { useEffect, useState } from 'react';
import * as api from '../api/openf1';
import type { CarData } from '../types/openf1';
import type { DriverReplayData } from './useLapReplay';

export type ReplayCarSeries = {
  lapDateStart: string;
  lapDuration: number;
  samples: CarData[];
};

const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 500;

/**
 * Loads car_data for every driver's full replay window (batched for OpenF1 rate limits).
 * `lapDateStart` is the shared replay origin (`replayT0`) so scrubber time aligns with charts.
 */
export function useAllDriversReplayCarSeries(
  sessionKey: number | null,
  driverData: DriverReplayData[],
  enabled: boolean
): {
  seriesByDriver: Map<number, ReplayCarSeries>;
  loading: boolean;
  error: string | null;
} {
  const [seriesByDriver, setSeriesByDriver] = useState<Map<number, ReplayCarSeries>>(() => new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || sessionKey == null || driverData.length === 0) {
      setSeriesByDriver(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    const sk = sessionKey;
    let cancelled = false;

    const tasks = driverData
      .map((rd) => {
        const last = rd.lastLap;
        if (last.lap_duration == null) return null;
        const dateStart = rd.firstLap.date_start;
        const dateEnd = new Date(
          new Date(last.date_start).getTime() + (last.lap_duration + 3) * 1000
        ).toISOString();
        const t0 = new Date(rd.replayT0).getTime();
        const lapDuration = (new Date(dateEnd).getTime() - t0) / 1000;
        return {
          driverNumber: rd.driver.driver_number,
          dateStart,
          dateEnd,
          lapDateStart: rd.replayT0,
          lapDuration,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t != null);

    async function run() {
      setLoading(true);
      setError(null);
      const next = new Map<number, ReplayCarSeries>();

      try {
        for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
          if (cancelled) return;
          const batch = tasks.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async (t) => {
              try {
                const pts = await api.fetchCarDataRange(sk, t.driverNumber, t.dateStart, t.dateEnd);
                if (cancelled) return;
                const sorted = [...pts].sort((a, b) => a.date.localeCompare(b.date));
                next.set(t.driverNumber, {
                  lapDateStart: t.lapDateStart,
                  lapDuration: t.lapDuration,
                  samples: sorted,
                });
              } catch {
                if (!cancelled) {
                  next.set(t.driverNumber, {
                    lapDateStart: t.lapDateStart,
                    lapDuration: t.lapDuration,
                    samples: [],
                  });
                }
              }
            })
          );
          if (!cancelled) setSeriesByDriver(new Map(next));
          if (i + BATCH_SIZE < tasks.length) {
            await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load car telemetry.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [sessionKey, enabled, driverData]);

  return { seriesByDriver, loading, error };
}
