import type { Location } from '../types/openf1';
import type { ReplayPoint } from '../hooks/useLapReplay';

/** Typical F1 lap distance (m) for scaling arbitrary OpenF1 XYZ units to metres. */
const ASSUMED_LAP_LENGTH_M = 5000;

/** Fallback if outline is missing; OpenF1 sample deltas are ~O(10²) per ~0.25s — not SI metres. */
const FALLBACK_METERS_PER_UNIT = 0.1;

/**
 * OpenF1 location x/y/z are Cartesian but not documented as metres; match outline polyline
 * length to a typical lap so displacement/time → km/h is in the right ballpark.
 */
export function metersPerUnitFromTrackOutline(trackPoints: Location[]): number {
  if (trackPoints.length < 4) return FALLBACK_METERS_PER_UNIT;
  const sorted = [...trackPoints].sort((a, b) => (a.date < b.date ? -1 : 1));
  let L = 0;
  for (let i = 1; i < sorted.length; i++) {
    L += Math.hypot(
      sorted[i].x - sorted[i - 1].x,
      sorted[i].y - sorted[i - 1].y,
      sorted[i].z - sorted[i - 1].z
    );
  }
  if (L < 1e-6) return FALLBACK_METERS_PER_UNIT;
  return ASSUMED_LAP_LENGTH_M / L;
}

function segmentSpeedKmh(a: Location, b: Location, metersPerUnit: number): number | null {
  const dt = (new Date(b.date).getTime() - new Date(a.date).getTime()) / 1000;
  if (dt < 0.02 || dt > 8) return null;
  const du = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  if (du < 1e-9) return null;
  const mps = (du * metersPerUnit) / dt;
  const kmh = mps * 3.6;
  if (!Number.isFinite(kmh) || kmh < 0 || kmh > 420) return null;
  return kmh;
}

/**
 * Median speed over recent consecutive samples (robust to single noisy segment).
 */
export function speedKmhFromLocationSeries(
  sortedByDate: Location[],
  metersPerUnit: number
): number | null {
  if (sortedByDate.length < 2) return null;
  const speeds: number[] = [];
  const n = sortedByDate.length;
  const start = Math.max(0, n - 12);
  for (let i = start + 1; i < n; i++) {
    const v = segmentSpeedKmh(sortedByDate[i - 1], sortedByDate[i], metersPerUnit);
    if (v != null) speeds.push(v);
  }
  if (speeds.length === 0) return null;
  speeds.sort((a, b) => a - b);
  return speeds[Math.floor(speeds.length / 2)]!;
}

export function speedKmhFromReplayTrail(
  trail: ReplayPoint[],
  metersPerUnit: number
): number | null {
  if (trail.length < 2) return null;
  const speeds: number[] = [];
  const n = trail.length;
  const start = Math.max(0, n - 10);
  for (let i = start + 1; i < n; i++) {
    const a = trail[i - 1]!;
    const b = trail[i]!;
    const dt = b.t - a.t;
    if (dt < 0.02 || dt > 8) continue;
    const du = Math.hypot(b.x - a.x, b.y - a.y);
    if (du < 1e-9) continue;
    const mps = (du * metersPerUnit) / dt;
    const kmh = mps * 3.6;
    if (Number.isFinite(kmh) && kmh >= 0 && kmh <= 420) speeds.push(kmh);
  }
  if (speeds.length === 0) return null;
  speeds.sort((a, b) => a - b);
  return speeds[Math.floor(speeds.length / 2)]!;
}
