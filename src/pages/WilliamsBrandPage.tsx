import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { X } from 'lucide-react';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** FOM — Williams 2026 announcement stacked logo */
const WILLIAMS_HERO_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Williams/2026_AWF1_Announcement_Graphic_2_Stacked_Logo.webp';

/** Sanity — horizontal strip (scroll pans left) */
const WILLIAMS_STRIP_IMAGES: readonly string[] = [
  'https://cdn.sanity.io/images/fnx611yr/productionv2/d0cc36de94e8000635de445ff89edb2e5fce99e7-4075x5094.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/0c6f7ac8c1d56cd0fa017769c473c02439f58b68-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/501bfd44c49f60224b06b28168229c9df99e1c12-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/c9f816af4cdc5fd907c8934c3ff26c379d5aaeee-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/384849fe1bb6b114ab3175c6d6645e3eb3373331-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/07eec55b197eb2190042d65975de90914cd7ff3c-4037x5046.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/96473d38ba4bcb2a9d0ee2e519195b398dc6e316-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/34500e0d849abe83219ea6c1e8c897277adcb183-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/599df88b095dde0e5fe8fe75fef33c76882c13a0-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/1ec20a105b4ddeecd5db67a44b9f60b56ad5b715-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/71dad3ca890391ee32e931d6bf7095a1a0c9d8e4-4096x5120.jpg?w=800&auto=format',
  'https://cdn.sanity.io/images/fnx611yr/productionv2/b9d63b7e12478f015cdf83137a46cbb744d95f39-4096x5120.jpg?w=800&auto=format',
];

/** Vertical scroll length driving horizontal pan */
const WILLIAMS_STRIP_SCROLL_VH = 520;

const WILLIAMS_DRIVER_ALBON_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/trackside-images/2024/F1_Grand_Prix_of_Miami___Previews/2151108377.webp';

const WILLIAMS_DRIVER_SAINZ_IMG =
  'https://media.formula1.com/image/upload/t_16by9Centre/f_auto/q_auto/v1758466180/trackside-images/2025/F1_Grand_Prix_of_Azerbaijan/2236574109.jpg';

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

/** Larger Sanity width for lightbox */
function williamsLightboxSrc(thumb: string): string {
  if (thumb.includes('cdn.sanity.io')) {
    return thumb.replace(/w=\d+/, 'w=1920');
  }
  return thumb;
}

export function WilliamsBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const blueTrackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripProgress, setStripProgress] = useState(0);
  const [stripMaxX, setStripMaxX] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    setReduceMotion(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const measureStrip = useCallback(() => {
    const strip = stripRef.current;
    const main = mainScrollRef.current;
    if (!strip || !main) return;
    const overflow = Math.max(0, strip.scrollWidth - main.clientWidth);
    setStripMaxX(overflow);
  }, [mainScrollRef]);

  useLayoutEffect(() => {
    measureStrip();
    window.addEventListener('resize', measureStrip, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureStrip) : null;
    if (ro && stripRef.current) ro.observe(stripRef.current);
    return () => {
      window.removeEventListener('resize', measureStrip);
      ro?.disconnect();
    };
  }, [measureStrip]);

  const updateScroll = useCallback(() => {
    const main = mainScrollRef.current;
    const track = blueTrackRef.current;
    if (!main || !track) return;
    const tTop = offsetTopToAncestor(track, main);
    const range = Math.max(1, track.offsetHeight - main.clientHeight);
    setStripProgress(clamp01((main.scrollTop - tTop) / range));
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    updateScroll();
    main.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScroll) : null;
    if (ro && blueTrackRef.current) ro.observe(blueTrackRef.current);
    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxSrc]);

  const translateX = reduceMotion ? 0 : -(stripProgress * stripMaxX);

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-neutral-950"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <section className="relative min-h-[min(100dvh,960px)] w-full overflow-hidden">
        <img
          src={WILLIAMS_HERO_IMG}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </section>

      {/* Blue block: sticky viewport; horizontal strip pans left as you scroll down */}
      <div
        ref={blueTrackRef}
        className="relative w-full"
        style={{ minHeight: `${WILLIAMS_STRIP_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#003b7a]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-6 pt-16 text-center sm:px-10 sm:pt-20">
            <p className="text-[clamp(1.35rem,4.5vw,2.25rem)] font-semibold tracking-[0.14em] text-white">
              FW48
            </p>
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col items-stretch justify-center overflow-hidden">
            <div className="flex w-full flex-1 items-center overflow-hidden px-0 pb-6 pt-16 sm:pb-10 sm:pt-20">
              <div
                ref={stripRef}
                className="flex w-max flex-row flex-nowrap items-center gap-16 pl-[min(18vw,200px)] pr-8 sm:gap-24 sm:pl-[min(22vw,260px)] sm:pr-12 md:gap-32 md:pl-[min(26vw,320px)] md:pr-16 will-change-transform"
                style={{
                  transform: `translate3d(${translateX}px,0,0)`,
                }}
              >
                {WILLIAMS_STRIP_IMAGES.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className="shrink-0 cursor-zoom-in border-0 bg-transparent p-0"
                    onClick={() => setLightboxSrc(src)}
                    aria-label="View image larger"
                  >
                    <img
                      src={src}
                      alt=""
                      className="pointer-events-none h-auto w-auto max-h-[min(52dvh,520px)] rounded-sm bg-black/10 object-cover object-center shadow-lg ring-1 ring-white/10 sm:max-h-[min(58dvh,580px)]"
                      loading={i < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onLoad={measureStrip}
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Darker blue — 2026 drivers */}
      <section className="relative z-10 border-t border-white/10 bg-[#001a3d] px-6 py-14 sm:px-10 sm:py-20">
        <h2 className="text-center text-[clamp(1.15rem,2.8vw,1.5rem)] font-semibold uppercase tracking-[0.28em] text-white">
          Drivers
        </h2>
        <div className="mx-auto mt-12 grid w-full max-w-6xl grid-cols-1 gap-12 md:mt-14 md:grid-cols-2 md:gap-x-16 lg:gap-x-24 xl:gap-x-32">
          <div className="flex min-w-0 flex-col items-center md:items-stretch">
            <div className="aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-black/20 ring-1 ring-white/10 md:max-w-none">
              <img
                src={WILLIAMS_DRIVER_ALBON_IMG}
                alt=""
                className="h-full w-full object-cover object-center"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="mt-4 text-center text-[15px] font-semibold tracking-wide text-white sm:text-[16px]">
              Alex Albon
            </p>
          </div>
          <div className="flex min-w-0 flex-col items-center md:items-stretch">
            <div className="aspect-square w-full max-w-sm overflow-hidden rounded-lg bg-black/20 ring-1 ring-white/10 md:max-w-none">
              <img
                src={WILLIAMS_DRIVER_SAINZ_IMG}
                alt=""
                className="h-full w-full object-cover object-center"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="mt-4 text-center text-[15px] font-semibold tracking-wide text-white sm:text-[16px]">
              Carlos Sainz
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-neutral-950 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">Williams Racing</p>
          <Link
            to="/cars/team/williams"
            className="mt-10 inline-flex rounded-full border border-white/20 bg-white/5 px-8 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-neutral-950" aria-hidden />

      {lightboxSrc ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/92 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged photo"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-5 sm:h-11 sm:w-11"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxSrc(null);
            }}
          >
            <X className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={2.25} aria-hidden />
          </button>
          <img
            src={williamsLightboxSrc(lightboxSrc)}
            alt=""
            className="max-h-[min(92dvh,92svh)] max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}
    </div>
  );
}
