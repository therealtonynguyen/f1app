/**
 * CircuitMap — stylised SVG track view.
 *
 * Shows a clean Catmull-Rom smoothed track with glowing driver dots.
 * Used as an alternative to the Google Maps satellite layer when the
 * GPS-to-satellite alignment is off or the user prefers a cleaner look.
 */
import { useMemo } from 'react';
import type { DriverWithData, Location } from '../types/openf1';
import type { ReplayPoint } from '../hooks/useLapReplay';
import { metersPerUnitFromTrackOutline, speedKmhFromReplayTrail } from '../lib/locationSpeed';

// ─── Douglas-Peucker simplification ──────────────────────────────────────
function perpDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function rdp(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i][0], pts[i][1], pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
  }
  return [pts[0], pts[pts.length - 1]];
}

// ─── Catmull-Rom → cubic Bézier SVG path ─────────────────────────────────
function catmullRomPath(pts: [number, number][], alpha = 0.5): string {
  if (pts.length < 2) return '';
  const closed = [...pts, pts[0], pts[1], pts[2]].slice(0, pts.length + 3);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = closed[i];
    const p1 = closed[i + 1];
    const p2 = closed[i + 2];
    const p3 = closed[i + 3] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) * alpha / 3;
    const cp1y = p1[1] + (p2[1] - p0[1]) * alpha / 3;
    const cp2x = p2[0] - (p3[0] - p1[0]) * alpha / 3;
    const cp2y = p2[1] - (p3[1] - p1[1]) * alpha / 3;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

// ─── Coordinate normalisation ─────────────────────────────────────────────
interface Transform {
  toSvg: (x: number, y: number) => [number, number];
}
const PAD = 40;
function buildTransform(pts: Location[], vw: number, vh: number): Transform | null {
  if (pts.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const rx = maxX - minX || 1, ry = maxY - minY || 1;
  const drawW = vw - PAD * 2, drawH = vh - PAD * 2;
  const scale = Math.min(drawW / rx, drawH / ry);
  const offX = PAD + (drawW - rx * scale) / 2;
  const offY = PAD + (drawH - ry * scale) / 2;
  return {
    toSvg: (x, y) => [offX + (x - minX) * scale, offY + (maxY - y) * scale],
  };
}

// ─── Props ────────────────────────────────────────────────────────────────
interface CircuitMapProps {
  trackOutline: Location[];
  drivers: DriverWithData[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  driversHiddenOnTrack?: Set<number>;
  replayPositions?: Map<number, { x: number; y: number }>;
  replayTrails?: Map<number, ReplayPoint[]>;
}

const EMPTY_HIDDEN = new Set<number>();
const VW = 800, VH = 600;

export function CircuitMap({
  trackOutline,
  drivers,
  selectedDriverNumber,
  onSelectDriver,
  driversHiddenOnTrack,
  replayPositions,
  replayTrails,
}: CircuitMapProps) {
  const hidden = driversHiddenOnTrack ?? EMPTY_HIDDEN;
  const isReplayMode = replayPositions !== undefined;

  const transform = useMemo(() => buildTransform(trackOutline, VW, VH), [trackOutline]);
  const metersPerUnit = useMemo(() => metersPerUnitFromTrackOutline(trackOutline), [trackOutline]);

  const trackPath = useMemo(() => {
    if (!transform || trackOutline.length < 4) return '';
    const sorted = [...trackOutline].sort((a, b) => a.date.localeCompare(b.date));
    const raw: [number, number][] = sorted.map((p) => transform.toSvg(p.x, p.y));
    const simplified = rdp(raw, 2.5);
    return catmullRomPath(simplified);
  }, [transform, trackOutline]);

  // Replay trails as thin coloured polylines
  const trailPaths = useMemo(() => {
    if (!transform || !isReplayMode || !replayTrails) return [];
    return [...replayTrails.entries()]
      .filter(([num, trail]) => !hidden.has(num) && trail.length >= 2)
      .map(([num, trail]) => {
        const driver = drivers.find((d) => d.driver_number === num);
        const color = `#${driver?.team_colour ?? 'ffffff'}`;
        const pts = trail.map((p) => transform.toSvg(p.x, p.y));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
        return { num, color, d };
      });
  }, [transform, isReplayMode, replayTrails, drivers, hidden]);

  // Driver positions
  const driverDots = useMemo(() => {
    if (!transform) return [];
    return drivers
      .filter((d) => !hidden.has(d.driver_number))
      .flatMap((d) => {
        let x: number, y: number;
        if (isReplayMode) {
          const rp = replayPositions!.get(d.driver_number);
          if (!rp) return [];
          ({ x, y } = rp);
        } else {
          if (!d.currentLocation) return [];
          ({ x, y } = d.currentLocation);
        }
        const [sx, sy] = transform.toSvg(x, y);
        const isSelected = d.driver_number === selectedDriverNumber;
        const color = `#${d.team_colour || 'ffffff'}`;
        return [{ driver: d, sx, sy, isSelected, color }];
      });
  }, [transform, drivers, hidden, isReplayMode, replayPositions, selectedDriverNumber]);

  if (!trackOutline.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--ios-label-tertiary)' }}>
          Loading track data…
        </p>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full h-full"
      style={{ background: 'var(--ios-bg)' }}
      onClick={() => onSelectDriver(null)}
    >
      <defs>
        {/* Glow filter for the track */}
        <filter id="track-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Glow filter for selected driver */}
        <filter id="dot-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Track: outer glow → halo → sharp centre */}
      {trackPath && (
        <g filter="url(#track-glow)">
          <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" />
          <path d={trackPath} fill="none" stroke="rgba(200,200,220,0.25)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <path d={trackPath} fill="none" stroke="rgba(230,230,245,0.9)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {/* Replay trails */}
      {trailPaths.map(({ num, color, d }) => (
        <path key={num} d={d} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.45} strokeLinecap="round" />
      ))}

      {/* Driver dots */}
      {driverDots.map(({ driver, sx, sy, isSelected, color }) => {
        const CARD_W = 150;
        const CARD_H = driver.headshot_url ? 108 : 80;
        const CARD_GAP = 14;
        // Clamp so popover never goes outside the viewBox
        const foX = Math.max(4, Math.min(VW - CARD_W - 4, sx - CARD_W / 2));
        const foY = Math.max(4, sy - CARD_H - CARD_GAP);

        const speedKmh = isReplayMode
          ? speedKmhFromReplayTrail(replayTrails?.get(driver.driver_number) ?? [], metersPerUnit)
          : (driver.trackSpeedKmh ?? null);
        const speedMph = speedKmh != null && Number.isFinite(speedKmh)
          ? Math.round(speedKmh * 0.621371)
          : null;
        const speedText = speedMph != null
          ? `${speedMph} mph · ${Math.round(speedKmh!)} km/h`
          : null;
        const posText = driver.position != null ? `P${driver.position}` : null;

        return (
          <g
            key={driver.driver_number}
            onClick={(e) => {
              e.stopPropagation();
              onSelectDriver(driver.driver_number === selectedDriverNumber ? null : driver.driver_number);
            }}
            style={{ cursor: 'pointer' }}
          >
            {isSelected && (
              <circle cx={sx} cy={sy} r={18} fill={color} fillOpacity={0.2} filter="url(#dot-glow)" />
            )}
            <circle
              cx={sx}
              cy={sy}
              r={isSelected ? 9 : 6}
              fill={color}
              stroke={isSelected ? '#ffffff' : 'rgba(0,0,0,0.4)'}
              strokeWidth={isSelected ? 2.5 : 1}
            />

            {/* Popover card using foreignObject */}
            {isSelected && (
              <foreignObject x={foX} y={foY} width={CARD_W} height={CARD_H} style={{ overflow: 'visible' }}>
                <div
                  // @ts-expect-error – xmlns is required for SVG foreignObject HTML
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{
                    background: 'rgba(18,18,20,0.94)',
                    border: `1.5px solid ${color}`,
                    borderRadius: 10,
                    padding: '8px 12px',
                    width: CARD_W,
                    boxSizing: 'border-box',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    textAlign: 'center',
                    position: 'relative',
                    boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelectDriver(null); }}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.12)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 10,
                      lineHeight: 1,
                      padding: 0,
                    }}
                    aria-label="Close"
                  >
                    ✕
                  </button>

                  {/* Headshot */}
                  {driver.headshot_url && (
                    <img
                      src={driver.headshot_url}
                      referrerPolicy="no-referrer"
                      alt={driver.name_acronym}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: `2px solid ${color}`,
                        objectFit: 'cover',
                        display: 'block',
                        margin: '0 auto 5px',
                      }}
                    />
                  )}

                  {/* Acronym */}
                  <div style={{
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}>
                    {driver.name_acronym}
                  </div>

                  {/* Speed */}
                  {speedText != null && (
                    <div style={{
                      color: 'rgba(255,255,255,0.55)',
                      fontSize: 11,
                      marginTop: 3,
                    }}>
                      {speedText}
                    </div>
                  )}

                  {/* Position */}
                  {posText != null && (
                    <div style={{
                      color: 'rgba(255,255,255,0.38)',
                      fontSize: 10,
                      marginTop: 1,
                    }}>
                      {posText}
                    </div>
                  )}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
