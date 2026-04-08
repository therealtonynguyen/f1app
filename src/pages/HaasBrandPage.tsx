import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

const HAAS_HERO_IMG =
  'https://t4.ftcdn.net/jpg/03/22/11/39/360_F_322113924_RAwjA08YXJyRL2ACccAqV50vQZvZuMfC.jpg';

const HAAS_LOGO_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Haas_F1_Team_Logo.svg/3840px-Haas_F1_Team_Logo.svg.png';

/** Scroll length for sticky hero + logo fade */
const HAAS_HERO_SCROLL_VH = 280;

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

/** Ramp logo opacity 0→1 across the middle of the hero scroll range. */
function haasLogoFade(p: number): number {
  return clamp01((p - 0.18) / 0.55);
}

export function HaasBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const trackRef = useRef<HTMLDivElement>(null);
  const [heroProgress, setHeroProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const updateScroll = useCallback(() => {
    const main = mainScrollRef.current;
    const track = trackRef.current;
    if (!main || !track) return;
    const tTop = offsetTopToAncestor(track, main);
    const range = Math.max(1, track.offsetHeight - main.clientHeight);
    setHeroProgress(clamp01((main.scrollTop - tTop) / range));
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    updateScroll();
    main.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScroll) : null;
    if (ro && trackRef.current) ro.observe(trackRef.current);
    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const logoOpacity = reduceMotion ? 1 : haasLogoFade(heroProgress);

  return (
    <div className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-black">
      <div
        ref={trackRef}
        className="relative w-full"
        style={{ minHeight: `${HAAS_HERO_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden">
          <img
            src={HAAS_HERO_IMG}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <img
            src={HAAS_LOGO_IMG}
            alt="Haas F1 Team"
            className="pointer-events-none relative z-10 w-[min(72vw,520px)] max-w-[90%] object-contain px-6 drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            style={{ opacity: logoOpacity }}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <section
        className="relative z-10 border-t border-white/10 bg-neutral-950 px-5 py-16 sm:px-10"
        style={{ fontFamily: 'var(--ios-font)' }}
      >
        <div className="mx-auto max-w-xl text-center">
          <Link
            to="/cars/team/haas"
            className="inline-flex rounded-full border border-white/20 bg-white/5 px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-neutral-950" aria-hidden />
    </div>
  );
}
