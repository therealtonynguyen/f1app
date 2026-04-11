import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** FOM — Hall of Fame 2024 (sticky scene; “home of legends” on scroll) */
const MCLAREN_HALL_OF_FAME_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/manual/Hall%20of%20Fame%202024/GettyImages-659224375.webp';

/** FOM — side shot (labeled MCL39 in UI per brief) */
const MCL39_FEATURE_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_LN_Allwyn_side_right.webp';

/**
 * MCL40 launch hero (top of stack) — FOM; see also
 * https://www.mclaren.com/racing/formula-1/2026/mcl40-launch/
 */
const MCL40_LAUNCH_HERO_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_B_Social_1920x1080.webp';

/** Livery launch article cover (Contentful) */
const MCL40_LIVERY_ARTICLE_COVER_IMG =
  'https://images.ctfassets.net/gy95mqeyjg28/18wtPdPK64wBLFPm14e2yU/a1319e5f3dff9266b4ce2a41d1ecf046/F1A-Livery-Launch-2026-Article-Cover.jpg?w=3840&q=75&fm=webp&fit=fill';

/** FOM — alternate MCL40 social still */
const MCL40_A_SOCIAL_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_A_Social_1920x1080.webp';

/** FOM — MCL40 twin-car social (Lando) — fourth in launch stack */
const MCL40_C_LN_SOCIAL_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/McLaren/MCL40_C_LN_Social_1920x1080.webp';

/** McLaren speedmark — Wikimedia SVG; styled white over papaya */
const MCLAREN_SPEEDMARK_SVG =
  'https://upload.wikimedia.org/wikipedia/commons/c/cb/McLaren_Speedmark.svg';

/** McLaren papaya — full-bleed transition after Hall of Fame */
const MCLAREN_PAPAYA = '#FF8000';

/** Legends → orange → white logo + word — needs scroll room */
const HALL_OF_FAME_SCROLL_VH = 520;

/** Sticky white block + MCL40 stack (hero + 3 more) after papaya scene */
const WHITE_BLOCK_SCROLL_VH = 580;

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

/** “home of legends” */
function legendsLineFade(p: number): number {
  return easeOutCubic(clamp01((p - 0.1) / 0.28));
}

/** Two orange halves */
function orangeSlideProgress(p: number): number {
  return easeOutCubic(clamp01((p - 0.38) / 0.3));
}

/** White logo — after orange is essentially full */
function mclarenLogoFade(p: number): number {
  return easeOutCubic(clamp01((p - 0.7) / 0.12));
}

/** “McLaren” under logo — slightly later */
function mclarenWordFade(p: number): number {
  return easeOutCubic(clamp01((p - 0.84) / 0.12));
}

/** Staggered fades for the top-right MCL40 stack (scroll progress 0–1 in white block) */
function mcl40StackFade(p: number, start: number, span: number): number {
  return easeOutCubic(clamp01((p - start) / span));
}

export function McLarenBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const hallOfFameTrackRef = useRef<HTMLDivElement>(null);
  const whiteBlockTrackRef = useRef<HTMLDivElement>(null);
  const [hallProgress, setHallProgress] = useState(0);
  const [whiteBlockProgress, setWhiteBlockProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const updateScroll = useCallback(() => {
    const main = mainScrollRef.current;
    if (!main) return;

    const hallTrack = hallOfFameTrackRef.current;
    if (hallTrack) {
      const tTop = offsetTopToAncestor(hallTrack, main);
      const range = Math.max(1, hallTrack.offsetHeight - main.clientHeight);
      setHallProgress(clamp01((main.scrollTop - tTop) / range));
    }

    const whiteTrack = whiteBlockTrackRef.current;
    if (whiteTrack) {
      const tTop = offsetTopToAncestor(whiteTrack, main);
      const range = Math.max(1, whiteTrack.offsetHeight - main.clientHeight);
      setWhiteBlockProgress(clamp01((main.scrollTop - tTop) / range));
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
      if (hallOfFameTrackRef.current) ro.observe(hallOfFameTrackRef.current);
      if (whiteBlockTrackRef.current) ro.observe(whiteBlockTrackRef.current);
    }
    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const p = hallProgress;
  const legendsOpacity = reduceMotion ? 1 : legendsLineFade(p);
  /** Full grayscale until “home of legends” fades in, then color */
  const hallPhotoGrayscale = reduceMotion ? 0 : 1 - legendsOpacity;
  const orangeS = reduceMotion ? 0 : orangeSlideProgress(p);
  const logoOpacity = reduceMotion ? 0 : mclarenLogoFade(p) * Math.min(1, orangeS * 1.05);
  const wordOpacity = reduceMotion ? 0 : mclarenWordFade(p) * Math.min(1, orangeS * 1.05);

  const wb = whiteBlockProgress;
  const stack1 = reduceMotion ? 1 : mcl40StackFade(wb, 0.1, 0.22);
  const stack2 = reduceMotion ? 1 : mcl40StackFade(wb, 0.28, 0.2);
  const stack3 = reduceMotion ? 1 : mcl40StackFade(wb, 0.44, 0.2);
  const stack4 = reduceMotion ? 1 : mcl40StackFade(wb, 0.58, 0.2);

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-neutral-950"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
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
                style={{
                  filter: reduceMotion ? undefined : `grayscale(${hallPhotoGrayscale})`,
                  willChange: reduceMotion ? undefined : 'filter',
                }}
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

          {/* Full orange: white speedmark + “McLaren” — centered stack */}
          <div
            className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-6"
            aria-hidden
          >
            <img
              src={MCLAREN_SPEEDMARK_SVG}
              alt=""
              className="h-[min(18vw,5.5rem)] w-auto max-w-[min(72vw,280px)] select-none"
              style={{
                opacity: logoOpacity,
                filter: 'brightness(0) invert(1)',
                willChange: reduceMotion ? undefined : 'opacity',
              }}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <p
              className="mt-6 text-[clamp(0.8rem,2.8vw,1rem)] font-semibold uppercase tracking-[0.42em] text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.55),0_1px_4px_rgba(0,0,0,0.4)]"
              style={{
                opacity: wordOpacity,
                willChange: reduceMotion ? undefined : 'opacity',
              }}
            >
              McLaren
            </p>
          </div>
        </div>
      </div>

      {/* After papaya: sticky centered white block; MCL40 launch photo appears top-right while scrolling */}
      <div
        ref={whiteBlockTrackRef}
        className="relative w-full bg-neutral-100"
        style={{ minHeight: `${WHITE_BLOCK_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-neutral-100 px-4 sm:px-6">
          <div
            className="relative z-0 min-h-[min(52dvh,480px)] w-full max-w-[min(92vw,640px)] rounded-2xl bg-white shadow-[0_25px_80px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex max-h-[calc(100dvh-1.5rem)] w-[min(42vw,240px)] flex-col items-stretch gap-1.5 overflow-y-auto pr-0.5 sm:right-6 sm:top-8 sm:w-[min(38vw,300px)] sm:gap-2"
            aria-label="MCL40 launch photography"
          >
            <img
              src={MCL40_LAUNCH_HERO_IMG}
              alt="McLaren MCL40"
              className="h-auto w-full shrink-0 rounded-lg object-cover shadow-lg ring-1 ring-black/10"
              style={{
                opacity: stack1,
                willChange: reduceMotion ? undefined : 'opacity',
              }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <img
              src={MCL40_LIVERY_ARTICLE_COVER_IMG}
              alt=""
              className="h-auto w-full shrink-0 rounded-lg object-cover shadow-md ring-1 ring-black/10"
              style={{
                opacity: stack2,
                willChange: reduceMotion ? undefined : 'opacity',
              }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <img
              src={MCL40_A_SOCIAL_IMG}
              alt=""
              className="h-auto w-full shrink-0 rounded-lg object-cover shadow-md ring-1 ring-black/10"
              style={{
                opacity: stack3,
                willChange: reduceMotion ? undefined : 'opacity',
              }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <img
              src={MCL40_C_LN_SOCIAL_IMG}
              alt="McLaren MCL40"
              className="h-auto w-full shrink-0 rounded-lg object-cover shadow-md ring-1 ring-black/10"
              style={{
                opacity: stack4,
                willChange: reduceMotion ? undefined : 'opacity',
              }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
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
