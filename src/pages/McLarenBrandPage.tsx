import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** FOM — McLaren MCL40 social */
const MCLAREN_HERO_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_C_LN_Social_1920x1080.webp';

/** FOM — Hall of Fame 2024 (sticky scene + grayscale band below) */
const MCLAREN_HALL_OF_FAME_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/manual/Hall%20of%20Fame%202024/GettyImages-659224375.webp';

/** FOM — side shot (labeled MCL39 in UI per brief) */
const MCL39_FEATURE_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_LN_Allwyn_side_right.webp';

const SENNA_SCROLL_VH = 300;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
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

function legendsLineFade(p: number): number {
  return clamp01((p - 0.22) / 0.45);
}

export function McLarenBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const sennaTrackRef = useRef<HTMLDivElement>(null);
  const [sennaProgress, setSennaProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const updateScroll = useCallback(() => {
    const main = mainScrollRef.current;
    const track = sennaTrackRef.current;
    if (!main || !track) return;
    const tTop = offsetTopToAncestor(track, main);
    const range = Math.max(1, track.offsetHeight - main.clientHeight);
    setSennaProgress(clamp01((main.scrollTop - tTop) / range));
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    updateScroll();
    main.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScroll) : null;
    if (ro && sennaTrackRef.current) ro.observe(sennaTrackRef.current);
    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const legendsOpacity = reduceMotion ? 1 : legendsLineFade(sennaProgress);
  const legendsLift = reduceMotion ? 0 : (1 - legendsOpacity) * 16;

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-neutral-950"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <section className="relative min-h-[min(100dvh,960px)] w-full overflow-hidden">
        <img
          src={MCLAREN_HERO_IMG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </section>

      {/* Sticky Hall of Fame photo — centered; “home of legends” fades in on the right */}
      <div
        ref={sennaTrackRef}
        className="relative w-full bg-neutral-950"
        style={{ minHeight: `${SENNA_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-neutral-950">
          <img
            src={MCLAREN_HALL_OF_FAME_IMG}
            alt=""
            className="pointer-events-none relative z-0 max-h-[min(72dvh,680px)] w-auto max-w-[min(92vw,920px)] object-contain object-center shadow-2xl"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute right-0 top-1/2 z-10 max-w-[min(52%,22rem)] px-5 text-right sm:max-w-md sm:px-10 md:pr-14"
            style={{
              opacity: legendsOpacity,
              transform: `translate3d(0, calc(-50% + ${legendsLift}px), 0)`,
            }}
          >
            <p className="text-[clamp(1.35rem,4.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] text-white [text-shadow:0_4px_40px_rgba(0,0,0,0.65)]">
              home of legends
            </p>
          </div>
        </div>
      </div>

      <section className="relative z-10 border-t border-neutral-900 bg-black">
        <div className="relative w-full overflow-hidden">
          <img
            src={MCLAREN_HALL_OF_FAME_IMG}
            alt=""
            className="h-auto w-full object-cover object-center grayscale"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

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
