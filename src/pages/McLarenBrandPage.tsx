import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** FOM — Hall of Fame 2024 (sticky scene; “home of legends” on scroll) */
const MCLAREN_HALL_OF_FAME_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/manual/Hall%20of%20Fame%202024/GettyImages-659224375.webp';

/** FOM — side shot (labeled MCL39 in UI per brief) */
const MCL39_FEATURE_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_LN_Allwyn_side_right.webp';

/** McLaren papaya — full-bleed transition after Hall of Fame */
const MCLAREN_PAPAYA = '#FF8000';

/** Taller track: legends + centered hold + orange panels slide in */
const HALL_OF_FAME_SCROLL_VH = 420;

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

/** “home of legends” eases in over the first ~45% of this section’s scroll */
function legendsLineFade(p: number): number {
  return easeOutCubic(clamp01((p - 0.12) / 0.38));
}

/** Two orange halves: start after legends read, finish before track end */
function orangeSlideProgress(p: number): number {
  return easeOutCubic(clamp01((p - 0.48) / 0.46));
}

export function McLarenBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const hallOfFameTrackRef = useRef<HTMLDivElement>(null);
  const [hallProgress, setHallProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const updateScroll = useCallback(() => {
    const main = mainScrollRef.current;
    const track = hallOfFameTrackRef.current;
    if (!main || !track) return;
    const tTop = offsetTopToAncestor(track, main);
    const range = Math.max(1, track.offsetHeight - main.clientHeight);
    setHallProgress(clamp01((main.scrollTop - tTop) / range));
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    updateScroll();
    main.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScroll) : null;
    if (ro && hallOfFameTrackRef.current) ro.observe(hallOfFameTrackRef.current);
    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const p = hallProgress;
  const legendsOpacity = reduceMotion ? 1 : legendsLineFade(p);
  /** Reduced motion: skip orange wipe so the portrait stays visible */
  const orangeS = reduceMotion ? 0 : orangeSlideProgress(p);

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-neutral-950"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      {/* Sticky Hall of Fame — centered stack; scroll → papaya halves from L/R */}
      <div
        ref={hallOfFameTrackRef}
        className="relative w-full bg-neutral-950"
        style={{ minHeight: `${HALL_OF_FAME_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-neutral-950">
          <div className="relative z-10 mx-auto max-w-[min(92vw,960px)] px-5">
            <div className="relative inline-block max-w-full">
              <img
                src={MCLAREN_HALL_OF_FAME_IMG}
                alt=""
                className="pointer-events-none block max-h-[min(52dvh,560px)] w-auto max-w-full object-contain object-center shadow-2xl sm:max-h-[min(56dvh,620px)]"
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <p
                className="absolute inset-0 flex items-center justify-center px-4 text-center text-[clamp(1.35rem,4.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85),0_4px_48px_rgba(0,0,0,0.55)]"
                style={{
                  opacity: legendsOpacity,
                  willChange: reduceMotion ? undefined : 'opacity',
                }}
              >
                home of legends
              </p>
            </div>
          </div>

          {/* Two orange squares (half viewport each) — slide in from left & right */}
          <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
            <div
              className="absolute left-0 top-0 h-full w-1/2 min-w-[50%]"
              style={{
                backgroundColor: MCLAREN_PAPAYA,
                transform: `translate3d(calc(-100% + ${orangeS * 100}%), 0, 0)`,
                willChange: reduceMotion ? undefined : 'transform',
              }}
            />
            <div
              className="absolute right-0 top-0 h-full w-1/2 min-w-[50%]"
              style={{
                backgroundColor: MCLAREN_PAPAYA,
                transform: `translate3d(calc(100% - ${orangeS * 100}%), 0, 0)`,
                willChange: reduceMotion ? undefined : 'transform',
              }}
            />
          </div>
        </div>
      </div>

      <section className="relative z-10 border-t border-neutral-200 bg-white px-6 py-14 sm:px-10 sm:py-20">
        <figure className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200/80">
            <img
              src={MCL39_FEATURE_IMG}
              alt=""
              className="aspect-video w-full object-cover object-center sm:aspect-[21/9]"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
          <figcaption className="mt-5 text-center text-[13px] font-semibold uppercase tracking-[0.2em] text-neutral-600 sm:text-[14px]">
            MCL39
          </figcaption>
        </figure>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-neutral-950 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">McLaren</p>
          <Link
            to="/cars/team/mclaren"
            className="mt-10 inline-flex rounded-full border border-white/20 bg-white/5 px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-neutral-950" aria-hidden />
    </div>
  );
}
