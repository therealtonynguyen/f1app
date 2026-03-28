import { useMemo } from 'react';
import type { Location, DriverWithData } from '../types/openf1';
import type { ReplayPoint } from '../hooks/useLapReplay';

interface Props {
  trackPoints: Location[];
  drivers: DriverWithData[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  replayPositions?: Map<number, { x: number; y: number }>;
  replayTrails?: Map<number, ReplayPoint[]>;
}

type XY = { x: number; y: number };

const SVG_W = 900;
const SVG_H = 650;
const PADDING = 70;

// ─── Coordinate transform ────────────────────────────────────────────────────

function buildTransform(points: XY[]) {
  if (points.length === 0) {
    return { tx: (x: number, y: number) => ({ x, y }), valid: false };
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const usableW = SVG_W - 2 * PADDING;
  const usableH = SVG_H - 2 * PADDING;
  const scale = Math.min(usableW / rangeX, usableH / rangeY);
  const scaledW = rangeX * scale;
  const scaledH = rangeY * scale;
  const offX = (SVG_W - scaledW) / 2;
  const offY = (SVG_H - scaledH) / 2;
  const tx = (x: number, y: number): XY => ({
    x: offX + (x - minX) * scale,
    y: SVG_H - offY - (y - minY) * scale, // flip Y
  });
  return { tx, valid: true };
}

// ─── Douglas-Peucker simplification (runs in original coordinate space) ──────

function perpDist(pt: XY, a: XY, b: XY): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(pt.x - a.x, pt.y - a.y);
  return (
    Math.abs(dy * pt.x - dx * pt.y + b.x * a.y - b.y * a.x) / Math.hypot(dx, dy)
  );
}

function rdp(pts: XY[], eps: number): XY[] {
  if (pts.length <= 2) return [...pts];
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const left = rdp(pts.slice(0, idx + 1), eps);
    const right = rdp(pts.slice(idx), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

// ─── Catmull-Rom → cubic Bézier (closed path, runs in SVG space) ─────────────

function catmullRomPath(pts: XY[]): string {
  if (pts.length < 3) return '';
  const n = pts.length;
  const cmds: string[] = [`M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    cmds.push(
      `C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
    );
  }
  cmds.push('Z');
  return cmds.join(' ');
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TrackMap({
  trackPoints,
  drivers,
  selectedDriverNumber,
  onSelectDriver,
  replayPositions,
  replayTrails,
}: Props) {
  const isReplay = replayPositions !== undefined;

  // Build the coordinate transform from track bounds + driver positions
  const allRawPoints = useMemo<XY[]>(() => {
    const pts: XY[] = trackPoints.map((p) => ({ x: p.x, y: p.y }));
    if (isReplay) {
      replayPositions?.forEach((p) => pts.push(p));
    } else {
      drivers.forEach((d) => {
        if (d.currentLocation) pts.push({ x: d.currentLocation.x, y: d.currentLocation.y });
      });
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackPoints, drivers, isReplay]);

  const { tx, valid } = useMemo(() => buildTransform(allRawPoints), [allRawPoints]);

  // Build smooth track path: sort → Douglas-Peucker → SVG transform → Catmull-Rom
  const trackPath = useMemo(() => {
    if (trackPoints.length < 10) return '';

    // 1. Sort by timestamp
    const raw: XY[] = [...trackPoints]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((p) => ({ x: p.x, y: p.y }));

    // 2. Douglas-Peucker: epsilon = 0.25% of circuit diagonal
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of raw) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const diagonal = Math.hypot(maxX - minX, maxY - minY) || 1;
    const simplified = rdp(raw, diagonal * 0.0025);

    // 3. Project to SVG space
    const svgPts = simplified.map((p) => tx(p.x, p.y));

    // 4. Catmull-Rom smooth (closed circuit)
    return catmullRomPath(svgPts);
  }, [trackPoints, tx]);

  // Driver dots
  const driverDots = useMemo(() => {
    return drivers
      .map((d) => {
        let rawPos: XY | undefined;
        if (isReplay) {
          rawPos = replayPositions?.get(d.driver_number);
        } else {
          rawPos = d.currentLocation
            ? { x: d.currentLocation.x, y: d.currentLocation.y }
            : undefined;
        }
        if (!rawPos) return null;
        const pos = tx(rawPos.x, rawPos.y);
        const isSelected = d.driver_number === selectedDriverNumber;
        const color = `#${d.team_colour || 'ffffff'}`;
        return { driver: d, x: pos.x, y: pos.y, isSelected, color };
      })
      .filter(Boolean) as Array<{
        driver: DriverWithData;
        x: number;
        y: number;
        isSelected: boolean;
        color: string;
      }>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers, selectedDriverNumber, tx, replayPositions, isReplay]);

  const hasData = valid && (trackPath.length > 0 || driverDots.length > 0);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-[#050508] overflow-hidden"
      onClick={() => onSelectDriver(null)}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-full"
        style={{ maxHeight: '100%' }}
      >
        <defs>
          {/* Subtle glow for the track surface */}
          <filter id="trackGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Sharper glow for selected driver */}
          <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Track layers ── */}
        {trackPath && (
          <g>
            {/* 1. Outer shadow / halo */}
            <path
              d={trackPath}
              fill="none"
              stroke="#0e0e1a"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 2. Track border */}
            <path
              d={trackPath}
              fill="none"
              stroke="#2e2e45"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 3. Track surface */}
            <path
              d={trackPath}
              fill="none"
              stroke="#181828"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#trackGlow)"
            />
            {/* 4. Track edge highlight — subtle rim light */}
            <path
              d={trackPath}
              fill="none"
              stroke="#3a3a58"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
            />
          </g>
        )}

        {/* ── Replay trails ── */}
        {isReplay &&
          driverDots.map(({ driver, color }) => {
            const trail = replayTrails?.get(driver.driver_number) ?? [];
            if (trail.length < 2) return null;
            const pts = trail
              .map((p) => {
                const s = tx(p.x, p.y);
                return `${s.x.toFixed(1)},${s.y.toFixed(1)}`;
              })
              .join(' ');
            return (
              <polyline
                key={`trail-${driver.driver_number}`}
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            );
          })}

        {/* ── Unselected driver dots ── */}
        {driverDots
          .filter((d) => !d.isSelected)
          .map(({ driver, x, y, color }) => (
            <g
              key={driver.driver_number}
              onClick={(e) => { e.stopPropagation(); onSelectDriver(driver.driver_number); }}
              style={{ cursor: 'pointer' }}
            >
              {/* Dark ring so dot is visible on any track color */}
              <circle cx={x} cy={y} r={8} fill="#050508" opacity={0.6} />
              <circle cx={x} cy={y} r={6} fill={color} />
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                fontSize="8"
                fill={color}
                fontFamily="monospace"
                fontWeight="bold"
                opacity={0.65}
              >
                {driver.name_acronym}
              </text>
            </g>
          ))}

        {/* ── Selected driver dot (on top) ── */}
        {driverDots
          .filter((d) => d.isSelected)
          .map(({ driver, x, y, color }) => (
            <g
              key={driver.driver_number}
              onClick={(e) => { e.stopPropagation(); onSelectDriver(null); }}
              style={{ cursor: 'pointer' }}
              filter="url(#dotGlow)"
            >
              <circle cx={x} cy={y} r={20} fill={color} opacity={0.07} />
              <circle cx={x} cy={y} r={13} fill={color} opacity={0.14} />
              <circle cx={x} cy={y} r={8} fill={color} stroke="white" strokeWidth={2} />
              <rect x={x - 17} y={y - 28} width={34} height={15} rx={4} fill={color} />
              <text
                x={x}
                y={y - 18}
                textAnchor="middle"
                fontSize="9"
                fill="white"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {driver.name_acronym}
              </text>
            </g>
          ))}
      </svg>

      {!hasData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="w-5 h-5 border-2 border-red-500/40 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 text-sm">Loading track…</p>
        </div>
      )}
    </div>
  );
}
