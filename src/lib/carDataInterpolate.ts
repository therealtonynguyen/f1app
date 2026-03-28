import type { CarData } from '../types/openf1';

type Timed = { s: CarData; t: number };

function toTimed(samples: CarData[], lapDateStart: string): Timed[] {
  const t0 = new Date(lapDateStart).getTime();
  return [...samples]
    .map((s) => ({ s, t: (new Date(s.date).getTime() - t0) / 1000 }))
    .sort((a, b) => a.t - b.t);
}

/**
 * Interpolate car telemetry at `tSeconds` after `lapDateStart` (same origin as replay timeline).
 */
export function interpolateCarDataAtLapTime(
  samples: CarData[],
  lapDateStart: string,
  tSeconds: number
): CarData | null {
  if (samples.length === 0) return null;
  const pts = toTimed(samples, lapDateStart);
  if (tSeconds <= pts[0]!.t) return pts[0]!.s;
  const last = pts[pts.length - 1]!;
  if (tSeconds >= last.t) return last.s;

  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (pts[mid]!.t <= tSeconds) lo = mid;
    else hi = mid;
  }
  const p0 = pts[lo]!;
  const p1 = pts[hi]!;
  const frac = (tSeconds - p0.t) / (p1.t - p0.t);
  const a = p0.s;
  const b = p1.s;
  return {
    ...a,
    speed: a.speed + (b.speed - a.speed) * frac,
    throttle: a.throttle + (b.throttle - a.throttle) * frac,
    rpm: a.rpm + (b.rpm - a.rpm) * frac,
    n_gear: frac < 0.5 ? a.n_gear : b.n_gear,
    brake: Math.round(a.brake + (b.brake - a.brake) * frac),
    drs: Math.round(a.drs + (b.drs - a.drs) * frac),
  };
}
