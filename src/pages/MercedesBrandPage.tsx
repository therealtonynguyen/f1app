import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** George Russell — Singapore 2025 panorama (Kym Illman / kymillman.com) */
const MERCEDES_HERO =
  'https://www.kymillman.com/wp-content/uploads/f1/products/panorama-prints/singapore-2025-george-russell-t-pose/singapore-2025-george-russell-t-pose.jpg';

/** Mercedes star — Wikimedia (scroll-spin section) */
const MERCEDES_LOGO_SPIN =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/960px-Mercedes-Logo.svg.png';

/** Scroll length (vh) for the black spin scene — taller = slower overall progression */
const SPIN_TRACK_VH = 320;

/** Scroll length for W17 type → FOM W17 photo reveal */
const W17_TRACK_VH = 380;

/** FOM — Mercedes-AMG F1 W17 E PERFORMANCE (scroll-reveal) */
const MERCEDES_W17_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Mercedes/Mercedes-AMG%20F1%20W17%20E%20PERFORMANCE%20-%20GR%204.webp';

/** FOM — W17 split gallery (left stack + right hero) */
const MERCEDES_W17_SPLIT_GR6 =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Mercedes/Mercedes-AMG%20F1%20W17%20E%20PERFORMANCE%20-%20GR%206.webp';
const MERCEDES_W17_SPLIT_KA7 =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Mercedes/Mercedes-AMG%20F1%20W17%20E%20PERFORMANCE%20-%20KA%207.webp';
const MERCEDES_W17_SPLIT_GR2 =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Mercedes/Mercedes-AMG%20F1%20W17%20E%20PERFORMANCE%20-%20GR%202.webp';

/** Drivers — Kimi (left) · George (right), side by side on md+ */
const MERCEDES_DRIVER_KIMI_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/trackside-images/2025/F1_Grand_Prix_of_Canada/2220302117.webp';
const MERCEDES_DRIVER_GEORGE_IMG =
  'https://static.independent.co.uk/2024/11/24/12/24-48fac137d2de42ea8b2f4ca8f53c706e.jpg';

/** Total full rotations at end of scroll (cubic curve makes angular velocity ramp up). */
const SPIN_FULL_ROTATIONS = 14;

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

/** Cubic: slow spin at first, much faster rotation per scroll unit near the end. */
function spinDegrees(progress: number): number {
  return progress ** 3 * 360 * SPIN_FULL_ROTATIONS;
}

/** Fade out in the last ~38% of the spin scroll. */
function spinLogoOpacity(progress: number): number {
  const fadeStart = 0.62;
  if (progress <= fadeStart) return 1;
  return clamp01(1 - (progress - fadeStart) / (1 - fadeStart));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/** Big “W17” eases in over the first ~40% of the W17 track. */
function w17TextReveal(p: number): number {
  return easeOutCubic(clamp01((p - 0.04) / 0.36));
}

/** FOM car photo fades in after the title starts reading. */
function w17PhotoReveal(p: number): number {
  return easeOutCubic(clamp01((p - 0.34) / 0.58));
}

/** Mercedes-AMG Petronas F1 — panorama hero + scroll-driven spinning logo. */
export function MercedesBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const spinTrackRef = useRef<HTMLDivElement>(null);
  const w17TrackRef = useRef<HTMLDivElement>(null);
  const [spinProgress, setSpinProgress] = useState(0);
  const [w17Progress, setW17Progress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const updateScroll = useCallback(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    const scrollTop = main.scrollTop;

    const spinTrack = spinTrackRef.current;
    if (spinTrack) {
      const top = offsetTopToAncestor(spinTrack, main);
      const range = Math.max(1, spinTrack.offsetHeight - main.clientHeight);
      setSpinProgress(clamp01((scrollTop - top) / range));
    }

    const w17Track = w17TrackRef.current;
    if (w17Track) {
      const top = offsetTopToAncestor(w17Track, main);
      const range = Math.max(1, w17Track.offsetHeight - main.clientHeight);
      setW17Progress(clamp01((scrollTop - top) / range));
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
      if (spinTrackRef.current) ro.observe(spinTrackRef.current);
      if (w17TrackRef.current) ro.observe(w17TrackRef.current);
    }
    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const rotationDeg = reduceMotion ? 0 : spinDegrees(spinProgress);
  const logoOpacity = spinLogoOpacity(spinProgress);

  const w17TextOpacity = reduceMotion ? 1 : w17TextReveal(w17Progress);
  const w17PhotoOpacity = reduceMotion ? 1 : w17PhotoReveal(w17Progress);
  const w17TextLift = reduceMotion ? 0 : (1 - w17TextOpacity) * 28;

  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col bg-black">
      <section
        className="relative min-h-[100dvh] w-full"
        style={{ fontFamily: 'var(--ios-font)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <img
            src={MERCEDES_HERO}
            alt="Mercedes-AMG Petronas F1 — Singapore"
            className="mx-auto block max-h-[100dvh] w-auto max-w-full object-contain object-center"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-end px-6 pb-[max(3rem,env(safe-area-inset-bottom))] pt-28 text-center sm:px-10 sm:pb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-teal-200/90">
            Mercedes-AMG Petronas Formula One™ Team
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2rem,6vw,3.5rem)] font-light leading-[1.05] tracking-[-0.02em] text-white [text-shadow:0_2px_32px_rgba(0,0,0,0.55)]">
            The Silver Arrows
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] font-normal leading-relaxed text-white/55 sm:text-[16px]">
            Brackley · Brixworth · Silverstone
          </p>
          <Link
            to="/cars/team/mercedes"
            className="mt-10 inline-flex rounded-full border border-white/20 bg-white/10 px-8 py-3 text-[13px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/18"
          >
            Car history
          </Link>
        </div>
      </section>

      {/* Black scene: logo pinned to viewport center while scroll drives spin + fade */}
      <div
        ref={spinTrackRef}
        className="relative w-full bg-black"
        style={{ minHeight: `${SPIN_TRACK_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center bg-black">
          <div
            className="relative flex items-center justify-center will-change-[transform,opacity]"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              opacity: logoOpacity,
            }}
          >
            {/* Soft silver halo behind the star — reads as ambient glow on black */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[min(52vw,280px)] w-[min(52vw,280px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,rgba(186,198,220,0.12)_35%,rgba(59,130,246,0.06)_55%,transparent_72%)] blur-2xl"
              aria-hidden
            />
            <img
              src={MERCEDES_LOGO_SPIN}
              alt=""
              className="relative z-10 pointer-events-none w-[min(36vw,180px)] max-w-[90%] select-none drop-shadow-[0_0_22px_rgba(255,255,255,0.35),0_0_56px_rgba(203,213,225,0.2)]"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* W17 — large type first, then FOM car photo as scroll continues */}
      <div
        ref={w17TrackRef}
        className="relative w-full bg-black"
        style={{ minHeight: `${W17_TRACK_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black">
          <img
            src={MERCEDES_W17_IMG}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            style={{ opacity: w17PhotoOpacity }}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-black"
            style={{ opacity: 1 - w17PhotoOpacity }}
            aria-hidden
          />
          <p
            className="relative z-10 text-center font-semibold tracking-[-0.06em] text-white [text-shadow:0_4px_60px_rgba(0,0,0,0.75),0_0_80px_rgba(0,0,0,0.5)]"
            style={{
              fontSize: 'clamp(3.25rem, 20vw, 14rem)',
              lineHeight: 0.9,
              opacity: w17TextOpacity,
              transform: `translate3d(0, ${w17TextLift}px, 0)`,
            }}
          >
            W17
          </p>
        </div>
      </div>

      {/* W17 — half / half, full viewport: left stack + right panel; images fill with object-cover */}
      <section
        className="relative z-10 w-full bg-black pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        style={{ fontFamily: 'var(--ios-font)' }}
        aria-label="Mercedes W17 gallery"
      >
        {/* Mobile: top half = two stacked; bottom half = one — fills one viewport height */}
        <div className="flex h-[100svh] min-h-0 w-full flex-col md:hidden">
          <div className="flex min-h-0 w-full flex-1 flex-col gap-px bg-white/[0.12]">
            <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
              <img
                src={MERCEDES_W17_SPLIT_GR6}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                sizes="100vw"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
              <img
                src={MERCEDES_W17_SPLIT_KA7}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                sizes="100vw"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
            <img
              src={MERCEDES_W17_SPLIT_GR2}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              sizes="100vw"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* md+: 50/50 columns, one full viewport tall */}
        <div className="hidden h-[100svh] min-h-0 w-full gap-px bg-white/[0.12] md:grid md:grid-cols-2 md:grid-rows-1">
          <div className="flex h-full min-h-0 flex-col">
            <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
              <img
                src={MERCEDES_W17_SPLIT_GR6}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                sizes="(min-width:768px) 50vw, 100vw"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
              <img
                src={MERCEDES_W17_SPLIT_KA7}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                sizes="(min-width:768px) 50vw, 100vw"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="relative h-full min-h-0 overflow-hidden bg-black">
            <img
              src={MERCEDES_W17_SPLIT_GR2}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              sizes="(min-width:768px) 50vw, 100vw"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Drivers — black block, Kimi & George side by side */}
      <section
        className="w-full bg-black pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        style={{ fontFamily: 'var(--ios-font)' }}
        aria-label="Mercedes-AMG Petronas drivers"
      >
        <div className="grid min-h-[min(90svh,920px)] w-full grid-cols-1 gap-px bg-white/[0.1] md:grid-cols-2">
          <figure className="relative m-0 flex min-h-[min(52svh,560px)] flex-col bg-black md:min-h-0">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <img
                src={MERCEDES_DRIVER_KIMI_IMG}
                alt="Kimi Antonelli"
                className="absolute inset-0 h-full w-full object-cover object-center"
                sizes="(min-width:768px) 50vw, 100vw"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <figcaption className="shrink-0 border-t border-white/[0.06] px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
              Kimi Antonelli
            </figcaption>
          </figure>
          <figure className="relative m-0 flex min-h-[min(52svh,560px)] flex-col bg-black md:min-h-0">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <img
                src={MERCEDES_DRIVER_GEORGE_IMG}
                alt="George Russell"
                className="absolute inset-0 h-full w-full object-cover object-center"
                sizes="(min-width:768px) 50vw, 100vw"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <figcaption className="shrink-0 border-t border-white/[0.06] px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
              George Russell
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="min-h-[30dvh] w-full bg-black" aria-hidden />
    </div>
  );
}
