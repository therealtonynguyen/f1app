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

/** Mercedes-AMG Petronas F1 — panorama hero + scroll-driven spinning logo. */
export function MercedesBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const spinTrackRef = useRef<HTMLDivElement>(null);
  const [spinProgress, setSpinProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const updateSpinProgress = useCallback(() => {
    const main = mainScrollRef.current;
    const track = spinTrackRef.current;
    if (!main || !track) return;
    const scrollTop = main.scrollTop;
    const trackTop = offsetTopToAncestor(track, main);
    const range = Math.max(1, track.offsetHeight - main.clientHeight);
    setSpinProgress(clamp01((scrollTop - trackTop) / range));
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    updateSpinProgress();
    main.addEventListener('scroll', updateSpinProgress, { passive: true });
    window.addEventListener('resize', updateSpinProgress, { passive: true });
    return () => {
      main.removeEventListener('scroll', updateSpinProgress);
      window.removeEventListener('resize', updateSpinProgress);
    };
  }, [mainScrollRef, updateSpinProgress]);

  const rotationDeg = reduceMotion ? 0 : spinDegrees(spinProgress);
  const logoOpacity = spinLogoOpacity(spinProgress);

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
          <img
            src={MERCEDES_LOGO_SPIN}
            alt=""
            className="pointer-events-none w-[min(36vw,180px)] max-w-[90%] select-none drop-shadow-[0_0_48px_rgba(255,255,255,0.1)] will-change-[transform,opacity]"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              opacity: logoOpacity,
            }}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <div className="min-h-[30dvh] w-full bg-black" aria-hidden />
    </div>
  );
}
