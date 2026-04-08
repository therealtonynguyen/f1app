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

/** GM / Cadillac F1 — Pérez/Bottas scene (drivers scroll) */
const CADILLAC_ANNOUNCEMENT_IMG =
  'https://media.formula1.com/image/upload/t_16by9North/c_lfill,w_3392/q_auto/v1740000001/fom-website/2025/Cadillac%20(GM)/TWGMS-F1-Announcement-1298%20(1)%20(1).webp';

/** Full-width band below countdown — Japan (FOM) */
const CADILLAC_JAPAN_BAND_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Japan/16x9%20single%20image%20-%202026-04-01T162650.157.webp';

/** Cadillac F1 Team — principal + official partners (cadillacf1team.com/partners) */
const CADILLAC_SPONSORS: readonly string[] = [
  'General Motors',
  'Cadillac',
  'IFS',
  'TWG AI',
  'Claro',
  'Core Scientific',
  'Jim Beam',
  'Tommy Hilfiger',
  'Tenneco',
  'Pirelli',
  'Alpinestars',
];

/** Tall scroll distance for the white / horizontal-strip scene (wider strip = more scroll) */
const WHITE_SCROLL_VH = 480;

/** Scroll length for driver-name reveal + sliding card */
const DRIVERS_SCROLL_VH = 260;
const RACE_CARD_SCROLL_VH = 300;

/** Miami International Autodrome — track map (cadillacf1team.com) */
const CADILLAC_SLIDE_MIAMI_IMG =
  'https://www.cadillacf1team.com/ctfassets/images/123jt18lixwc/2mBUUhnfOWQ0u07Wiqnl6F/f5e9b86abaf05c1eca665aa1e0f69a28/19.Miami_International_Autodrome_-_USA.001.png?fm=avif&w=1920';

/** 2026 Miami GP — Grand Prix Sunday (local) */
const MIAMI_GP_RACE_DATE = 'May 3, 2026';

/** Miami GP 2026 — race start (America/New_York; 4:00 PM EDT per F1 schedule) */
const MIAMI_GP_RACE_START = new Date('2026-05-03T16:00:00-04:00');

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

/** Ramp 0→1 over central part of scroll (names lift in). */
function driverNameReveal(p: number): number {
  return clamp01((p - 0.12) / 0.55);
}

/** Fade in right-side Miami copy after the sliding card is mostly in view. */
function miamiGpLabelFade(p: number): number {
  return clamp01((p - 0.22) / 0.4);
}

function miamiGpCountdownParts(msLeft: number): { d: number; h: number; m: number; s: number } {
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
}

export function CadillacBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const trackRef = useRef<HTMLDivElement>(null);
  const whiteTrackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const driversTrackRef = useRef<HTMLDivElement>(null);
  const raceTrackRef = useRef<HTMLDivElement>(null);

  const [wipe, setWipe] = useState(0);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [driversProgress, setDriversProgress] = useState(0);
  const [raceProgress, setRaceProgress] = useState(0);
  const [stripMaxX, setStripMaxX] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());

  useEffect(() => {
    setReduceMotion(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(id);
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

    const driversTrack = driversTrackRef.current;
    if (driversTrack) {
      const dTop = offsetTopToAncestor(driversTrack, main);
      const dRange = Math.max(1, driversTrack.offsetHeight - main.clientHeight);
      setDriversProgress(clamp01((main.scrollTop - dTop) / dRange));
    }

    const raceTrack = raceTrackRef.current;
    if (raceTrack) {
      const rTop = offsetTopToAncestor(raceTrack, main);
      const rRange = Math.max(1, raceTrack.offsetHeight - main.clientHeight);
      setRaceProgress(clamp01((main.scrollTop - rTop) / rRange));
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
      if (driversTrackRef.current) ro.observe(driversTrackRef.current);
      if (raceTrackRef.current) ro.observe(raceTrackRef.current);
    }

    return () => {
      main.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      ro?.disconnect();
    };
  }, [mainScrollRef, updateScroll]);

  const translateX = reduceMotion ? 0 : -(galleryProgress * stripMaxX);

  const nameReveal = reduceMotion ? 1 : driverNameReveal(driversProgress);
  const nameY = reduceMotion ? 0 : (1 - nameReveal) * 28;
  const nameOpacity = nameReveal;

  const raceSlide = reduceMotion ? 1 : raceProgress;
  const miamiLabelFade = reduceMotion ? 1 : miamiGpLabelFade(raceProgress);
  const miamiLabelLift = reduceMotion ? 0 : (1 - miamiLabelFade) * 14;

  const countdownParts = miamiGpCountdownParts(MIAMI_GP_RACE_START.getTime() - countdownNow);
  const cdD = countdownParts.d.toString();
  const cdH = countdownParts.h.toString().padStart(2, '0');
  const cdM = countdownParts.m.toString().padStart(2, '0');
  const cdS = countdownParts.s.toString().padStart(2, '0');

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
                const wider = i === 1 || i === 4;
                return (
                  <div
                    key={i}
                    className={cn(
                      'h-full min-w-0 bg-black will-change-transform',
                      wider ? 'flex-[1.14]' : 'flex-1'
                    )}
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

      {/* Pérez & Bottas — full-bleed photo; names rise in beside them as you scroll */}
      <div
        ref={driversTrackRef}
        className="relative w-full bg-black"
        style={{ minHeight: `${DRIVERS_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
          <img
            src={CADILLAC_ANNOUNCEMENT_IMG}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_35%] sm:object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30"
            aria-hidden
          />
          <div
            className="absolute bottom-[10%] left-0 right-0 z-10 flex items-end justify-between gap-4 px-5 sm:bottom-[12%] sm:px-12 md:px-20"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            <p
              className="max-w-[44%] text-left text-[clamp(0.95rem,2.8vw,1.35rem)] font-semibold uppercase tracking-[0.12em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.75)] sm:max-w-none sm:text-[clamp(1.1rem,2.2vw,1.5rem)] sm:tracking-[0.18em]"
              style={{
                opacity: nameOpacity,
                transform: `translate3d(0,${nameY}px,0)`,
              }}
            >
              Valtteri Bottas
            </p>
            <p
              className="max-w-[44%] text-right text-[clamp(0.95rem,2.8vw,1.35rem)] font-semibold uppercase tracking-[0.12em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.75)] sm:max-w-none sm:text-[clamp(1.1rem,2.2vw,1.5rem)] sm:tracking-[0.18em]"
              style={{
                opacity: nameOpacity,
                transform: `translate3d(0,${nameY}px,0)`,
              }}
            >
              Sergio Pérez
            </p>
          </div>
        </div>
      </div>

      {/* White section: track card slides from left; Miami GP copy fades in on the right */}
      <div
        ref={raceTrackRef}
        className="relative w-full bg-white"
        style={{ minHeight: `${RACE_CARD_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 flex h-[100dvh] w-full items-center overflow-hidden">
          <div
            className="absolute left-0 top-1/2 z-10 w-[min(100%,min(92vw,1600px))] min-w-[min(100%,min(72vw,320px))] overflow-hidden rounded-r-2xl bg-white"
            style={{
              transform: `translate3d(${(1 - raceSlide) * -100}%, -50%, 0)`,
              willChange: 'transform',
            }}
          >
            <img
              src={CADILLAC_SLIDE_MIAMI_IMG}
              alt="Miami International Autodrome track layout"
              className="block h-auto w-full min-h-[min(72dvh,640px)] object-cover object-center sm:min-h-[min(78dvh,880px)]"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
          <div
            className="pointer-events-none absolute right-0 top-1/2 z-20 max-w-[min(52%,20rem)] px-5 text-right sm:max-w-md sm:px-10 md:pr-16"
            style={{
              fontFamily: 'var(--ios-font)',
              opacity: miamiLabelFade,
              transform: `translate3d(0, calc(-50% + ${miamiLabelLift}px), 0)`,
            }}
          >
            <p className="text-[clamp(1.35rem,4vw,2.25rem)] font-semibold uppercase tracking-[0.14em] text-neutral-900">
              MIAMI GP
            </p>
            <p className="mt-2 text-[clamp(0.95rem,2vw,1.125rem)] font-medium tabular-nums tracking-[0.06em] text-neutral-600">
              {MIAMI_GP_RACE_DATE}
            </p>
          </div>
        </div>
      </div>

      {/* Miami GP — countdown (below Miami track block) */}
      <section
        className="relative z-10 w-full bg-white py-10 sm:py-12"
        style={{ fontFamily: 'var(--ios-font)' }}
        aria-live="polite"
      >
        <div className="mx-auto flex w-full max-w-[min(100%,96rem)] flex-col items-center gap-6 px-4 sm:px-6 md:px-10 lg:px-14">
          <p className="text-[clamp(10px,2.5vw,12px)] font-bold uppercase tracking-[0.28em] text-black">
            Race start
          </p>
          <div
            className="flex min-h-[min(36vw,16rem)] w-full items-stretch justify-center gap-1 sm:min-h-[min(32vw,15rem)] sm:gap-2 md:gap-3"
            aria-label={`${countdownParts.d} days, ${countdownParts.h} hours, ${countdownParts.m} minutes, ${countdownParts.s} seconds until Miami Grand Prix`}
          >
            <div className="@container flex min-h-0 min-w-0 flex-1 flex-col items-stretch justify-end text-center">
              <div className="flex min-h-0 w-full flex-1 items-center justify-center px-0.5">
                <span className="block w-full max-w-full text-center font-bold tabular-nums leading-none tracking-tight text-black [font-size:clamp(1.5rem,min(52cqw,36cqh),8rem)] [line-height:0.95]">
                  {cdD}
                </span>
              </div>
              <span className="mt-2 shrink-0 text-[clamp(8px,2.4vw,12px)] font-bold uppercase tracking-[0.18em] text-black sm:tracking-[0.22em]">
                Days
              </span>
            </div>
            <span
              className="flex shrink-0 items-center justify-center self-stretch px-0.5 font-bold leading-none text-black [font-size:clamp(1rem,5vw,3rem)] sm:px-1"
              aria-hidden
            >
              :
            </span>
            <div className="@container flex min-h-0 min-w-0 flex-1 flex-col items-stretch justify-end text-center">
              <div className="flex min-h-0 w-full flex-1 items-center justify-center px-0.5">
                <span className="block w-full max-w-full text-center font-bold tabular-nums leading-none tracking-tight text-black [font-size:clamp(1.5rem,min(52cqw,36cqh),8rem)] [line-height:0.95]">
                  {cdH}
                </span>
              </div>
              <span className="mt-2 shrink-0 text-[clamp(8px,2.4vw,12px)] font-bold uppercase tracking-[0.18em] text-black sm:tracking-[0.22em]">
                Hours
              </span>
            </div>
            <span
              className="flex shrink-0 items-center justify-center self-stretch px-0.5 font-bold leading-none text-black [font-size:clamp(1rem,5vw,3rem)] sm:px-1"
              aria-hidden
            >
              :
            </span>
            <div className="@container flex min-h-0 min-w-0 flex-1 flex-col items-stretch justify-end text-center">
              <div className="flex min-h-0 w-full flex-1 items-center justify-center px-0.5">
                <span className="block w-full max-w-full text-center font-bold tabular-nums leading-none tracking-tight text-black [font-size:clamp(1.5rem,min(52cqw,36cqh),8rem)] [line-height:0.95]">
                  {cdM}
                </span>
              </div>
              <span className="mt-2 shrink-0 text-[clamp(8px,2.4vw,12px)] font-bold uppercase tracking-[0.18em] text-black sm:tracking-[0.22em]">
                Minutes
              </span>
            </div>
            <span
              className="flex shrink-0 items-center justify-center self-stretch px-0.5 font-bold leading-none text-black [font-size:clamp(1rem,5vw,3rem)] sm:px-1"
              aria-hidden
            >
              :
            </span>
            <div className="@container flex min-h-0 min-w-0 flex-1 flex-col items-stretch justify-end text-center">
              <div className="flex min-h-0 w-full flex-1 items-center justify-center px-0.5">
                <span className="block w-full max-w-full text-center font-bold tabular-nums leading-none tracking-tight text-black [font-size:clamp(1.5rem,min(52cqw,36cqh),8rem)] [line-height:0.95]">
                  {cdS}
                </span>
              </div>
              <span className="mt-2 shrink-0 text-[clamp(8px,2.4vw,12px)] font-bold uppercase tracking-[0.18em] text-black sm:tracking-[0.22em]">
                Seconds
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 w-full border-t border-neutral-200 bg-white">
        <div className="relative min-h-[min(56dvh,640px)] w-full overflow-hidden">
          <img
            src={CADILLAC_JAPAN_BAND_IMG}
            alt="Cadillac Formula 1 — Japan Grand Prix"
            className="h-full min-h-[min(56dvh,640px)] w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section
        className="relative z-10 border-t border-neutral-900 bg-black px-5 py-14 sm:px-10 sm:py-16"
        style={{ fontFamily: 'var(--ios-font)' }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-neutral-500">Sponsored by</p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:gap-x-8 sm:gap-y-4">
            {CADILLAC_SPONSORS.map((name) => (
              <li
                key={name}
                className="text-[13px] font-semibold tracking-wide text-neutral-100 sm:text-[14px]"
              >
                {name}
              </li>
            ))}
          </ul>
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
