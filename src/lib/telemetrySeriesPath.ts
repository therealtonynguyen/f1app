import type { CarData } from '../types/openf1';

const W = 400;
const H = 56;
const padL = 4;
const padR = 4;
const padT = 6;
const padB = 6;

export const TELEMETRY_CHART_VB = { w: W, h: H };

/** CSS height (px) for chart row — keep in sync with MiniChart SVG `h-[52px]` */
export const TELEMETRY_CHART_PX_HEIGHT = 52;

function clampPct(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/** SVG path for throttle (0–100) or brake over lap time; coords match viewBox 0 0 400 56 */
export function carSeriesToPath(
  samples: CarData[],
  lapDateStart: string,
  maxDuration: number,
  channel: 'throttle' | 'brake'
): string {
  if (samples.length === 0 || maxDuration <= 0) return '';

  const t0 = new Date(lapDateStart).getTime();
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const pts = samples
    .map((s) => {
      const t = (new Date(s.date).getTime() - t0) / 1000;
      const raw = channel === 'throttle' ? s.throttle : s.brake;
      const v = clampPct(typeof raw === 'number' ? raw : 0);
      return { t, v };
    })
    .filter((p) => p.t >= 0 && p.t <= maxDuration + 0.05)
    .sort((a, b) => a.t - b.t);

  if (pts.length === 0) return '';

  const xAt = (t: number) => padL + (t / maxDuration) * innerW;
  const yAt = (v: number) => padT + (1 - v / 100) * innerH;

  let d = `M ${xAt(pts[0].t)} ${yAt(pts[0].v)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${xAt(pts[i].t)} ${yAt(pts[i].v)}`;
  }
  return d;
}

export function playheadX(currentTime: number, maxDuration: number): number {
  if (maxDuration <= 0) return padL;
  const innerW = W - padL - padR;
  const t = Math.min(Math.max(0, currentTime), maxDuration);
  return padL + (t / maxDuration) * innerW;
}
