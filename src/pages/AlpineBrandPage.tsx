import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** Alpine F1 — Renault Group CDN homepage still */
const ALPINE_HERO_IMG =
  'https://cdn.group.renault.com/alp/master/formula-1/homepage/alpine-F1-home-003-desktop.jpg.ximg.largex2.webp/b66071676e.webp';

/** FOM — hero shot (fade-in sticky scene) */
const ALPINE_HERO_SHOT =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Alpine/TWJB_BWT_ALPINE_FORMULA_ONE_TEAM-A526_HERO_SHOT_3.webp';

const ALPINE_GALLERY: readonly string[] = [
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Alpine/TWJB_BWT_ALPINE_FORMULA_ONE_TEAM-A526_PARTNER_CLOSEUP4.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Alpine/TWJB_BWT_ALPINE_FORMULA_ONE_TEAM-A526_PARTNER_CLOSEUP15.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Alpine/TWJB_BWT_ALPINE_FORMULA_ONE_TEAM-A526_HERO_SHOT_2.webp',
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Alpine/TWJB_BWT_ALPINE_FORMULA_ONE_TEAM-A526_PARTNER_CLOSEUP10.webp',
];

/** Scroll distance for sticky black interlude + headline fade */
const BLACK_SCROLL_VH = 280;
/** Sticky FOM hero + “just take a look” */
const HERO_SHOT_SCROLL_VH = 280;

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

function sectionProgress(main: HTMLElement, section: HTMLElement): number {
  const tTop = offsetTopToAncestor(section, main);
  const range = Math.max(1, section.offsetHeight - main.clientHeight);
  return clamp01((main.scrollTop - tTop) / range);
}

/** Hold black only, then fade in headline over the rest of the scroll range. */
function prettiestLineFade(p: number): number {
  return clamp01((p - 0.32) / 0.42);
}

/** FOM shot fades in first. */
function heroShotImageFade(p: number): number {
  return clamp01((p - 0.1) / 0.4);
}

/** Line appears after the car is mostly visible. */
function justTakeLookFade(p: number): number {
  return clamp01((p - 0.38) / 0.36);
}

export function AlpineBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const blackTrackRef = useRef<HTMLDivElement>(null);
  const heroShotTrackRef = useRef<HTMLDivElement>(null);
  const [blackProgress, setBlackProgress] = useState(0);
  const [heroShotProgress, setHeroShotProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const updateScroll = useCallback(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    if (blackTrackRef.current) {
      setBlackProgress(sectionProgress(main, blackTrackRef.current));
    }
    if (heroShotTrackRef.current) {
      setHeroShotProgress(sectionProgress(main, heroShotTrackRef.current));
    }
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    updateScroll();
    main.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScroll) : null;
    if (ro) {
      if (blackTrackRef.current) ro.observe(blackTrackRef.current);
      if (heroShotTrackRef.current) ro.observe(heroShotTrackRef.current);
      ro.observe(main);
    }
    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const lineOpacity = reduceMotion ? 1 : prettiestLineFade(blackProgress);
  const lineLift = reduceMotion ? 0 : (1 - lineOpacity) * 18;

  const shotOpacity = reduceMotion ? 1 : heroShotImageFade(heroShotProgress);
  const shotLift = reduceMotion ? 0 : (1 - shotOpacity) * 14;
  const justOpacity = reduceMotion ? 1 : justTakeLookFade(heroShotProgress);
  const justLift = reduceMotion ? 0 : (1 - justOpacity) * 12;
  /** Nudge headline upward vs true center */
  const JUST_LOOK_NUDGE_PX = 36;

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-white"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <section className="relative min-h-[min(100dvh,960px)] w-full overflow-hidden">
        <img
          src={ALPINE_HERO_IMG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </section>

      {/* Sticky black viewport: stays centered while scrolling; line fades in later */}
      <div
        ref={blackTrackRef}
        className="relative w-full bg-black"
        style={{ minHeight: `${BLACK_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black px-6">
          <p
            className="max-w-[min(92vw,36rem)] text-center text-[clamp(1.5rem,5.2vw,2.75rem)] font-semibold leading-tight tracking-[-0.02em] text-white"
            style={{
              opacity: lineOpacity,
              transform: `translate3d(0, ${lineLift}px, 0)`,
            }}
          >
            Prettiest car in F1
          </p>
        </div>
      </div>

      {/* Sticky FOM hero: image fades in, then “just take a look” — stays centered while scrolling */}
      <div
        ref={heroShotTrackRef}
        className="relative w-full bg-neutral-950"
        style={{ minHeight: `${HERO_SHOT_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-neutral-950 px-6">
          <img
            src={ALPINE_HERO_SHOT}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{
              opacity: shotOpacity,
              transform: `translate3d(0, ${shotLift}px, 0)`,
            }}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <p
            className="relative z-10 max-w-[min(92vw,36rem)] text-center text-[clamp(1.35rem,4.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-white [text-shadow:0_2px_32px_rgba(0,0,0,0.65)]"
            style={{
              opacity: justOpacity,
              transform: `translate3d(0, ${justLift - JUST_LOOK_NUDGE_PX}px, 0)`,
            }}
          >
            just take a look
          </p>
        </div>
      </div>

      {/* Full-viewport gallery — each image fills width × one screen height */}
      <section className="relative z-10 w-full border-t border-neutral-200 bg-black">
        {ALPINE_GALLERY.map((src) => (
          <div
            key={src}
            className="relative h-[100dvh] min-h-[100svh] w-full overflow-hidden"
          >
            <img
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </section>

      <section className="relative z-10 border-t border-neutral-200 bg-neutral-50 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-400">Alpine</p>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">BWT Alpine F1 Team</p>
          <Link
            to="/cars/team/alpine"
            className="mt-10 inline-flex rounded-full border border-neutral-300 bg-white px-8 py-3 text-[14px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-neutral-50" aria-hidden />
    </div>
  );
}
