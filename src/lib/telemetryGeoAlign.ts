import type { Location } from '../types/openf1';

type XY = { x: number; y: number };
type LatLng = { lat: number; lng: number };

export function boundsFromLocations(
  locations: Location[]
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (locations.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of locations) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

export function localToLatLngBbox(
  x: number,
  y: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  coordinates: [number, number][]
): [number, number] {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lng, lat] of coordinates) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const rx = maxX - minX || 1;
  const ry = maxY - minY || 1;
  const u = (x - minX) / rx;
  const v = (y - minY) / ry;
  const lat = minLat + v * (maxLat - minLat);
  const lng = minLng + u * (maxLng - minLng);
  return [lat, lng];
}

function cumulativeLengths2D(pts: XY[]): number[] {
  const acc: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    acc.push(acc[acc.length - 1] + d);
  }
  return acc;
}

function samplePolyline(pts: XY[], n: number): XY[] {
  if (pts.length === 0 || n < 1) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const lens = cumulativeLengths2D(pts);
  const total = lens[lens.length - 1] || 1;
  const out: XY[] = [];
  for (let k = 0; k < n; k++) {
    const target = n === 1 ? 0 : (k / (n - 1)) * total;
    let i = 0;
    while (i < lens.length - 1 && lens[i + 1] < target) i++;
    const seg = lens[i + 1] - lens[i] || 1;
    const u = (target - lens[i]) / seg;
    out.push({
      x: pts[i].x + u * (pts[i + 1].x - pts[i].x),
      y: pts[i].y + u * (pts[i + 1].y - pts[i].y),
    });
  }
  return out;
}

function cumulativeLengthsGeo(pts: LatLng[]): number[] {
  const acc: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].lng - pts[i - 1].lng, pts[i].lat - pts[i - 1].lat);
    acc.push(acc[acc.length - 1] + d);
  }
  return acc;
}

function samplePolylineGeo(pts: LatLng[], n: number): LatLng[] {
  if (pts.length === 0 || n < 1) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const lens = cumulativeLengthsGeo(pts);
  const total = lens[lens.length - 1] || 1;
  const out: LatLng[] = [];
  for (let k = 0; k < n; k++) {
    const target = n === 1 ? 0 : (k / (n - 1)) * total;
    let i = 0;
    while (i < lens.length - 1 && lens[i + 1] < target) i++;
    const seg = lens[i + 1] - lens[i] || 1;
    const u = (target - lens[i]) / seg;
    out.push({
      lat: pts[i].lat + u * (pts[i + 1].lat - pts[i].lat),
      lng: pts[i].lng + u * (pts[i + 1].lng - pts[i].lng),
    });
  }
  return out;
}

/** Solve 3×3 symmetric positive-semidefinite system (Gaussian elimination). */
function solve3(
  a00: number,
  a01: number,
  a02: number,
  a11: number,
  a12: number,
  a22: number,
  b0: number,
  b1: number,
  b2: number
): [number, number, number] | null {
  const A = [
    [a00, a01, a02, b0],
    [a01, a11, a12, b1],
    [a02, a12, a22, b2],
  ];
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    if (Math.abs(A[pivot][col]) < 1e-18) return null;
    if (pivot !== col) [A[col], A[pivot]] = [A[pivot], A[col]];
    const div = A[col][col];
    for (let c = col; c < 4; c++) A[col][c] /= div;
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = A[r][col];
      if (f === 0) continue;
      for (let c = col; c < 4; c++) A[r][c] -= f * A[col][c];
    }
  }
  return [A[0][3], A[1][3], A[2][3]];
}

function fitAffineZ(samples: XY[], z: number[]): [number, number, number] | null {
  if (samples.length !== z.length || samples.length < 3) return null;
  let sxx = 0;
  let sxy = 0;
  let sx = 0;
  let syy = 0;
  let sy = 0;
  let n = 0;
  let sz = 0;
  let sxz = 0;
  let syz = 0;
  for (let i = 0; i < samples.length; i++) {
    const { x, y } = samples[i];
    const zi = z[i];
    sxx += x * x;
    sxy += x * y;
    sx += x;
    syy += y * y;
    sy += y;
    n += 1;
    sz += zi;
    sxz += x * zi;
    syz += y * zi;
  }
  return solve3(sxx, sxy, sx, syy, sy, n, sxz, syz, sz);
}

/**
 * Map OpenF1 telemetry (x, y) to [lat, lng] by fitting an affine transform from
 * the reference lap outline to the GeoJSON circuit polyline (arc-length resampling).
 */
export function buildTelemetryToLatLngProjector(
  trackOutline: Location[],
  geoCoordinates: [number, number][]
): ((x: number, y: number) => [number, number]) | null {
  if (trackOutline.length < 10 || geoCoordinates.length < 3) return null;

  const sorted = [...trackOutline].sort((a, b) => a.date.localeCompare(b.date));
  const telem: XY[] = sorted.map((p) => ({ x: p.x, y: p.y }));
  const geoPts: LatLng[] = geoCoordinates.map(([lng, lat]) => ({ lat, lng }));

  const n = Math.min(
    200,
    Math.max(24, Math.min(Math.floor(telem.length / 2), geoPts.length * 2))
  );
  const tSamp = samplePolyline(telem, n);
  const gSamp = samplePolylineGeo(geoPts, n);

  const latFit = fitAffineZ(
    tSamp,
    gSamp.map((g) => g.lat)
  );
  const lngFit = fitAffineZ(
    tSamp,
    gSamp.map((g) => g.lng)
  );
  if (!latFit || !lngFit) return null;

  const [al, bl, cl] = latFit;
  const [ad, bd, cd] = lngFit;

  return (x: number, y: number) => [al * x + bl * y + cl, ad * x + bd * y + cd] as [number, number];
}
