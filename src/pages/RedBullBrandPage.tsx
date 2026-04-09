import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** Red Bull — Max Verstappen, Abu Dhabi Grand Prix 2023 */
const RED_BULL_HERO_IMG =
  'https://img.redbull.com/images/w_3000/q_auto,f_auto/redbullcom/2023/11/26/kad8pgnushzugkhfmcmj/max-verstappen-abu-dhabi-grand-prix-2023';

/** Scroll length: sequential blues + final fullscreen cover */
const RED_BULL_BLUE_SCROLL_VH = 520;

/** Light → dark blue (rect 6 uses last + expands to full viewport) */
const BLUE_RECTS = [
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#172554',
] as const;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function offsetTopToAncestor(element: HTMLElement, ancestor: HTMLElement): number {
  let top = 0;
  let el: HTMLElement | null = element;
  while (el && el !== ancestor) {
    top += el.offsetTop;
    el = el.parentElement;
  }
  return top;
}

/** First 6/7 of progress: six rects appear in order; last 1/7: darkest grows to cover viewport */
function sequenceProgress(p: number) {
  const segment = 6 / 7;
  const seqP = clamp01(p / segment);
  const coverP = clamp01((p - segment) / (1 - segment));
  return { seqP, coverP };
}

/** vmin size for each rect when fully “in” (before last rect’s cover pass) */
const RECT_TARGET_VMIN = [26, 40, 52, 64, 76, 88] as const;

export function RedBullBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const blueTrackRef = useRef<HTMLDivElement>(null);
  const [blueProgress, setBlueProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const tick = useCallback(() => {
    const main = mainScrollRef.current;
    const track = blueTrackRef.current;
    if (!main || !track) return;
    const top = offsetTopToAncestor(track, main);
    const range = Math.max(1, track.offsetHeight - main.clientHeight);
    setBlueProgress(clamp01((main.scrollTop - top) / range));
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    tick();
    main.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(tick) : null;
    if (ro && blueTrackRef.current) ro.observe(blueTrackRef.current);
    return () => {
      main.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
      ro?.disconnect();
    };
  }, [mainScrollRef, tick]);

  const { seqP, coverP } = sequenceProgress(blueProgress);

  const rectIn = (i: number) => {
    if (reduceMotion) return 1;
    const n = 6;
    const w = 1 / n;
    const start = i * w;
    return easeOutCubic(clamp01((seqP - start) / w));
  };

  /** Darkest rect: scales up in the final seventh to blanket the viewport */
  const lastCoverScale = reduceMotion ? 3.2 : 1 + easeOutCubic(coverP) * 2.35;

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-[#172554]"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <div
        ref={blueTrackRef}
        className="relative w-full"
        style={{ minHeight: `${RED_BULL_BLUE_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 z-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-neutral-950">
          <img
            src={RED_BULL_HERO_IMG}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-black/50 via-transparent to-black/20"
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden>
            {BLUE_RECTS.map((color, i) => {
              const t = rectIn(i);
              const vmin = RECT_TARGET_VMIN[i] * t;
              const op = i === 5 ? Math.min(1, t + coverP * 0.2) : t;
              const scale = i === 5 ? lastCoverScale : 1;
              return (
                <div
                  key={color}
                  className="absolute left-1/2 top-1/2 rounded-sm shadow-sm"
                  style={{
                    width: `min(${vmin}vmin, 96vw)`,
                    height: `min(${vmin}vmin, 96dvh)`,
                    backgroundColor: color,
                    opacity: op,
                    zIndex: 20 + i,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <section className="relative z-10 border-t border-white/10 bg-[#172554] px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-200/80">
            Red Bull Racing
          </p>
          <Link
            to="/cars/team/red-bull-racing"
            className="mt-10 inline-flex rounded-full border border-white/20 bg-white/10 px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/15"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-[#172554]" aria-hidden />
    </div>
  );
}
