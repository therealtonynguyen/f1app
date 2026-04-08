import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** Cadillac F1 — official team imagery (cadillacf1team.com) */
const CADILLAC_HERO =
  'https://www.cadillacf1team.com/ctfassets/images/123jt18lixwc/6Sq0yL24jhWgKadGZKr5X3/20bb8d38f0a79de90be4de4a2477b53f/Image_Module_5.jpg?fm=avif&w=1920';

const CADILLAC_MODULE_4 =
  'https://www.cadillacf1team.com/ctfassets/images/123jt18lixwc/71Btd8srHM7PghcGrqQkVI/288435fa334cc06860a4125f228e2375/Image_Module_4.jpg?fm=avif&w=1920';

/** Horizontal strip — left scroll as you move down the page */
const CADILLAC_STRIP_IMAGES: readonly { src: string; alt: string }[] = [
  {
    src: 'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2202_HiResEdit.webp',
    alt: 'Cadillac Formula 1 car',
  },
  { src: CADILLAC_MODULE_4, alt: 'Cadillac F1' },
  {
    src: 'https://cdn-8.motorsport.com/images/amp/01QdBem0/s1000/cadillac-f1-livery-4.jpg',
    alt: 'Cadillac F1 livery',
  },
  {
    src: 'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2193_HiRes.jpg.webp',
    alt: 'Cadillac F1',
  },
  {
    src: 'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2196_HiRes.jpg.webp',
    alt: 'Cadillac F1',
  },
  {
    src: 'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2198_HiRes.jpg.webp',
    alt: 'Cadillac F1',
  },
  {
    src: 'https://media.formula1.com/image/upload/t_16by9Centre/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2199_HiRes.jpg.webp',
    alt: 'Cadillac F1',
  },
  {
    src: 'https://media.formula1.com/image/upload/t_16by9North/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Cadillac/CadillacF1Team_2189_HiRes.jpg.webp',
    alt: 'Cadillac F1',
  },
];

const COLUMN_COUNT = 6;

/** GM / Cadillac F1 announcement — full-width band below strip */
const CADILLAC_ANNOUNCEMENT_IMG =
  'https://media.formula1.com/image/upload/t_16by9North/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Cadillac%20(GM)/TWGMS-F1-Announcement-1298%20(1)%20(1).webp';

/** Tall scroll distance for the white / horizontal-strip scene (wider strip = more scroll) */
const WHITE_SCROLL_VH = 480;

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

function columnProgress(scrollProgress: number, index: number, total: number): number {
  const t = scrollProgress * total - index;
  return clamp01(t);
}

export function CadillacBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const trackRef = useRef<HTMLDivElement>(null);
  const whiteTrackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const [wipe, setWipe] = useState(0);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [stripMaxX, setStripMaxX] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
    if (!main) return;

    const track = trackRef.current;
    if (track) {
      const trackTop = offsetTopToAncestor(track, main);
      const range = Math.max(1, track.offsetHeight - main.clientHeight);
      setWipe(clamp01((main.scrollTop - trackTop) / range));
    }

    const whiteTrack = whiteTrackRef.current;
    if (whiteTrack) {
      const wTop = offsetTopToAncestor(whiteTrack, main);
      const wRange = Math.max(1, whiteTrack.offsetHeight - main.clientHeight);
      setGalleryProgress(clamp01((main.scrollTop - wTop) / wRange));
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
      if (trackRef.current) ro.observe(trackRef.current);
      if (whiteTrackRef.current) ro.observe(whiteTrackRef.current);
    }

    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const translateX = reduceMotion ? 0 : -(galleryProgress * stripMaxX);

  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col bg-black">
      <div ref={trackRef} className="relative min-h-[280vh] w-full">
        <div className="sticky top-0 flex h-[100dvh] w-full flex-col overflow-hidden">
          <section
            className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            <img
              src={CADILLAC_HERO}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-transparent to-black/45"
              aria-hidden
            />

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center sm:px-10">
              <h1 className="max-w-[min(100%,40rem)] text-[clamp(1.75rem,5.5vw,3.25rem)] font-light leading-[1.12] tracking-[-0.02em] text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.5)]">
                <span className="block">Born in Detroit</span>
                <span className="mt-[0.35em] block">Built for the World</span>
              </h1>
            </div>

            <div className="pointer-events-none absolute inset-0 z-20 flex flex-row" aria-hidden>
              {Array.from({ length: COLUMN_COUNT }, (_, i) => {
                const p = columnProgress(wipe, i, COLUMN_COUNT);
                return (
                  <div
                    key={i}
                    className="h-full flex-1 bg-black will-change-transform"
                    style={{
                      transformOrigin: 'bottom',
                      transform: `scaleY(${p})`,
                    }}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="min-h-[min(28dvh,240px)] w-full bg-black" aria-hidden />

      {/* Sticky white viewport: full-screen white stays centered; strip pans left with scroll */}
      <div
        ref={whiteTrackRef}
        className="relative w-full"
        style={{ minHeight: `${WHITE_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
          <div
            className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-0"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-10 z-20 px-6 text-center sm:top-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-neutral-400">Cadillac F1</p>
              <h2 className="mt-2 text-[clamp(1.2rem,3vw,1.5rem)] font-semibold tracking-tight text-neutral-900">
                MAC-26
              </h2>
            </div>

            <div className="flex w-full max-w-none flex-1 items-center overflow-hidden pt-20 pb-8 pl-[max(20px,env(safe-area-inset-left))] sm:pt-24 sm:pl-[max(28px,env(safe-area-inset-left))] md:pl-[max(36px,env(safe-area-inset-left))]">
              <div
                ref={stripRef}
                className="flex w-max flex-row flex-nowrap items-center gap-24 pl-[min(20vw,220px)] pr-10 sm:gap-40 sm:pl-[min(24vw,280px)] sm:pr-16 md:gap-48 md:pl-[min(28vw,340px)] md:pr-24 will-change-transform"
                style={{
                  transform: `translate3d(${translateX}px,0,0)`,
                }}
              >
                {CADILLAC_STRIP_IMAGES.map((item, i) => (
                  <img
                    key={`${item.src}-${i}`}
                    src={item.src}
                    alt={item.alt}
                    className={cn(
                      'h-auto w-auto shrink-0 rounded-none bg-neutral-100 ring-1 ring-neutral-200/90',
                      i % 2 === 0
                        ? 'max-h-[min(52dvh,520px)] sm:max-h-[min(56dvh,580px)]'
                        : 'max-h-[min(32dvh,300px)] sm:max-h-[min(36dvh,340px)]'
                    )}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onLoad={measureStrip}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="relative z-10 w-full border-t border-neutral-200 bg-white">
        <div className="relative min-h-[min(56dvh,640px)] w-full overflow-hidden">
          <img
            src={CADILLAC_ANNOUNCEMENT_IMG}
            alt=""
            className="h-full min-h-[min(56dvh,640px)] w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section
        className="relative z-10 border-t border-neutral-200 bg-white px-5 py-14 sm:px-10 sm:py-20"
        style={{ fontFamily: 'var(--ios-font)' }}
      >
        <div className="mx-auto max-w-xl text-center">
          <Link
            to="/cars/team/cadillac"
            className="inline-flex rounded-full border border-neutral-300 bg-white px-8 py-3 text-[14px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-white" aria-hidden />
    </div>
  );
}
