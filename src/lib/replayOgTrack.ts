import type { DriverReplayData, ReplayPoint } from '../hooks/useLapReplay';

/** Interpolate (x,y) along a driver’s lap at time t (seconds from lap start). */
function interpolateAtT(points: ReplayPoint[], t: number): { x: number; y: number } | null {
  if (points.length === 0) return null;
  if (t <= points[0].t) return { x: points[0].x, y: points[0].y };
  const last = points[points.length - 1]!;
  if (t >= last.t) return { x: last.x, y: last.y };

  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >>> 1;
    if (points[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const p0 = points[lo]!;
  const p1 = points[hi]!;
  const frac = (t - p0.t) / (p1.t - p0.t || 1);
  return {
    x: p0.x + (p1.x - p0.x) * frac,
    y: p0.y + (p1.y - p0.y) * frac,
  };
}

/**
 * Single “OG” centerline from all drivers’ GPS laps: at each normalized lap time,
 * average (x,y) across everyone who has a sample — no official circuit geometry.
 */
export function buildOgTelemetryTrack(
  driverData: DriverReplayData[],
  samples = 480
): { x: number; y: number }[] {
  if (driverData.length === 0) return [];
  const maxT = Math.max(
    ...driverData.map((d) => d.points[d.points.length - 1]?.t ?? 0),
    1e-6
  );
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * maxT;
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const { points } of driverData) {
      const p = interpolateAtT(points, t);
      if (p) {
        sx += p.x;
        sy += p.y;
        n += 1;
      }
    }
    if (n > 0) out.push({ x: sx / n, y: sy / n });
  }
  return out;
}
