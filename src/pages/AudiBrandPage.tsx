import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

/** Silver ring asset — four copies form the Audi rings */
const RING_IMG =
  'https://png.pngtree.com/png-vector/20230906/ourmid/pngtree-silver-metallic-circle-outlined-png-image_9992721.png';

/** Horizontal offset from center (px) for each ring at full “Audi” formation — overlap like the marque */
const RING_OFFSETS_PX = [-69, -23, 23, 69] as const;

const RING_SIZE_PX = 76;

/** Scroll length for the sticky ring scene */
const AUDI_RING_SCROLL_VH = 520;

/** Scroll length for the car drive (image crosses left → right, black viewport) */
const AUDI_CAR_SCROLL_VH = 320;

const AUDI_CAR_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/common/f1/2026/audi/2026audicarright.webp';

/** Scroll length for black → photo fade */
const AUDI_FADE_SCROLL_VH = 280;

/** Revealed when black overlay fades away */
const AUDI_FADE_PHOTO =
  'https://uploads.audi-mediacenter.com/system/production/media/129006/images/df3adc386158e88fb6f8fa6eedd0f2be1f750a2e/A251806_web_1920.jpg?1762965393';

/** Behind “Audi unveils design for Formula 1” */
const AUDI_HEADLINE_PHOTO =
  'https://uploads.audi-mediacenter.com/system/production/media/129017/images/4c4f51507253419425a628e3dc2fc30160e9d6a0/A251817_web_1920.jpg?1762964888';

/** Headline over hero photo → fade to black before gallery */
const AUDI_HEADLINE_SCROLL_VH = 320;

/** Black → “world’s first” → fade into Speedcafe photo */
const AUDI_WORLDS_FIRST_SCROLL_VH = 320;

const AUDI_WORLDS_FIRST_SPEEDCAFE_IMG =
  'https://speedcafe.b-cdn.net/wp-content/uploads/2026/01/A260222_large-1.jpg';

/** Apple/SF stack for headline-style type */
const AUDI_WORLDS_FIRST_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Sticky black — Nico’s helmet from left, then Gabriel’s from right */
const AUDI_HELMETS_SCROLL_VH = 380;

const AUDI_HELMET_NICO_IMG =
  'https://www.f1-fansite.com/wp-content/uploads/2012/07/Nico-Hulkenberg-Helmet-Design.png';

const AUDI_HELMET_GABRIEL_IMG =
  'https://www.bellcollectibles.com/wp-content/uploads/2025/09/GABRIEL-BORTOLETO-2025-Mini-1.png';

type AudiGalleryItem =
  | { kind: 'single'; src: string }
  | { kind: 'stack'; top: string; bottom: string };

/** Order + stacked pairs (A251809 under A251816, A251807 under A251811); A251805/A251810 stack last (swapped with A251835); A251834 removed */
const AUDI_GALLERY_ITEMS: readonly AudiGalleryItem[] = [
  {
    kind: 'single',
    src: 'https://uploads.audi-mediacenter.com/system/production/media/129036/images/798075a49be83d682dbc49c8528f9c6b9164fa06/A251836_web_1920.jpg?1763019513',
  },
  {
    kind: 'single',
    src: 'https://uploads.audi-mediacenter.com/system/production/media/129027/images/8f76e15909299d782ae94115b802de3d7c8d3974/A251827_web_960.jpg?1763022795',
  },
  {
    kind: 'stack',
    top: 'https://uploads.audi-mediacenter.com/system/production/media/129016/images/0ff1fdaaf94a967677ae20a3b5748c47fd5c7206/A251816_web_1920.jpg?1762964887',
    bottom:
      'https://uploads.audi-mediacenter.com/system/production/media/129009/images/3f845b208326925d445ba978fe482e6df337f7c8/A251809_web_1920.jpg?1762965364',
  },
  {
    kind: 'single',
    src: 'https://uploads.audi-mediacenter.com/system/production/media/129041/images/ef358db8e148c1f516a58f9f1beaa2a1aaa21a7f/A251841_web_1920.jpg?1763024903',
  },
  {
    kind: 'single',
    src: 'https://uploads.audi-mediacenter.com/system/production/media/129012/images/07e1e175b56debcd553354b300f8ac933e77391d/A251812_web_1920.jpg?1762965262',
  },
  {
    kind: 'single',
    src: 'https://uploads.audi-mediacenter.com/system/production/media/129004/images/04bf16f409d91f051f47838877530081bb2296a2/A251804_web_1920.jpg?1762964952',
  },
  {
    kind: 'stack',
    top: 'https://uploads.audi-mediacenter.com/system/production/media/129011/images/fb96278c0ae94c3293a301a3a710f3a9facd6c44/A251811_web_1920.jpg?1762964937',
    bottom:
      'https://uploads.audi-mediacenter.com/system/production/media/129007/images/880f87bb0f17f62df9d90d1691461a4156800c12/A251807_web_1920.jpg?1762964952',
  },
  {
    kind: 'single',
    src: 'https://uploads.audi-mediacenter.com/system/production/media/129025/images/29647454524860952238230c6a055c5f0263850d/A251825_web_960.jpg?1762985369',
  },
  {
    kind: 'single',
    src: 'https://uploads.audi-mediacenter.com/system/production/media/129035/images/64d56511c00d41285dac3cc79acfe0134bcb42ff/A251835_web_960.jpg?1762987394',
  },
  {
    kind: 'stack',
    top: 'https://uploads.audi-mediacenter.com/system/production/media/129005/images/c1050824c3c5d50f99a54c8ec3e9d7df1b6307ec/A251805_web_1920.jpg?1762965454',
    bottom:
      'https://uploads.audi-mediacenter.com/system/production/media/129010/images/5f0413d1e582accfa8ae886d463dfbba466dfad5/A251810_web_1920.jpg?1762965256',
  },
] as const;

/** Same full-width row treatment as the first gallery image */
const AUDI_GALLERY_FULL_WIDTH_IMG =
  'https://uploads.audi-mediacenter.com/system/production/media/129041/images/ef358db8e148c1f516a58f9f1beaa2a1aaa21a7f/A251841_web_1920.jpg?1763024903';

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

/** Ring i fades in after ring 0 (staggered). */
function ringAppear(i: number, p: number): number {
  if (i === 0) return 1;
  return clamp01((p - 0.14 - (i - 1) * 0.15) / 0.16);
}

/**
 * Audi brand landing — black canvas, one centered ring → scroll builds four rings (Audi symbol).
 */
export function AudiBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const ringTrackRef = useRef<HTMLDivElement>(null);
  const carTrackRef = useRef<HTMLDivElement>(null);
  const fadeTrackRef = useRef<HTMLDivElement>(null);
  const headlineTrackRef = useRef<HTMLDivElement>(null);
  const worldsFirstTrackRef = useRef<HTMLDivElement>(null);
  const helmetsTrackRef = useRef<HTMLDivElement>(null);
  const [ringProgress, setRingProgress] = useState(0);
  const [carProgress, setCarProgress] = useState(0);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [headlineProgress, setHeadlineProgress] = useState(0);
  const [worldsFirstProgress, setWorldsFirstProgress] = useState(0);
  const [helmetsProgress, setHelmetsProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const tick = useCallback(() => {
    const main = mainScrollRef.current;
    if (!main) return;

    const ringTrack = ringTrackRef.current;
    if (ringTrack) {
      const top = offsetTopToAncestor(ringTrack, main);
      const range = Math.max(1, ringTrack.offsetHeight - main.clientHeight);
      setRingProgress(clamp01((main.scrollTop - top) / range));
    }

    const carTrack = carTrackRef.current;
    if (carTrack) {
      const top = offsetTopToAncestor(carTrack, main);
      const range = Math.max(1, carTrack.offsetHeight - main.clientHeight);
      setCarProgress(clamp01((main.scrollTop - top) / range));
    }

    const fadeTrack = fadeTrackRef.current;
    if (fadeTrack) {
      const top = offsetTopToAncestor(fadeTrack, main);
      const range = Math.max(1, fadeTrack.offsetHeight - main.clientHeight);
      setFadeProgress(clamp01((main.scrollTop - top) / range));
    }

    const headlineTrack = headlineTrackRef.current;
    if (headlineTrack) {
      const top = offsetTopToAncestor(headlineTrack, main);
      const range = Math.max(1, headlineTrack.offsetHeight - main.clientHeight);
      setHeadlineProgress(clamp01((main.scrollTop - top) / range));
    }

    const worldsFirstTrack = worldsFirstTrackRef.current;
    if (worldsFirstTrack) {
      const top = offsetTopToAncestor(worldsFirstTrack, main);
      const range = Math.max(1, worldsFirstTrack.offsetHeight - main.clientHeight);
      setWorldsFirstProgress(clamp01((main.scrollTop - top) / range));
    }

    const helmetsTrack = helmetsTrackRef.current;
    if (helmetsTrack) {
      const top = offsetTopToAncestor(helmetsTrack, main);
      const range = Math.max(1, helmetsTrack.offsetHeight - main.clientHeight);
      setHelmetsProgress(clamp01((main.scrollTop - top) / range));
    }
  }, [mainScrollRef]);

  useEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;
    tick();
    main.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(tick) : null;
    if (ro) {
      if (ringTrackRef.current) ro.observe(ringTrackRef.current);
      if (carTrackRef.current) ro.observe(carTrackRef.current);
      if (fadeTrackRef.current) ro.observe(fadeTrackRef.current);
      if (headlineTrackRef.current) ro.observe(headlineTrackRef.current);
      if (worldsFirstTrackRef.current) ro.observe(worldsFirstTrackRef.current);
      if (helmetsTrackRef.current) ro.observe(helmetsTrackRef.current);
    }
    return () => {
      main.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
      ro?.disconnect();
    };
  }, [mainScrollRef, tick]);

  const spread = reduceMotion ? 1 : easeOutCubic(clamp01((ringProgress - 0.1) / 0.72));

  const fadeToPhoto = reduceMotion ? 1 : easeOutCubic(fadeProgress);
  const fadeOverlayOpacity = 1 - fadeToPhoto;

  const hp = headlineProgress;
  /** Title fades in, then eases out as the viewport goes to black */
  const headlineTextOpacity = reduceMotion
    ? 1
    : easeOutCubic(clamp01((hp - 0.05) / 0.26)) * (1 - easeOutCubic(clamp01((hp - 0.44) / 0.28)));
  const headlineBlackOpacity = reduceMotion ? 0 : easeOutCubic(clamp01((hp - 0.38) / 0.48));
  const headlineTextShift = reduceMotion ? 0 : (1 - easeOutCubic(clamp01((hp - 0.05) / 0.26))) * 14;

  const wf = worldsFirstProgress;
  /** Black clears → Speedcafe full-bleed */
  const worldsFirstPhotoReveal = reduceMotion ? 1 : easeOutCubic(clamp01((wf - 0.08) / 0.28));
  const worldsFirstBlackVeil = 1 - worldsFirstPhotoReveal;

  const hel = helmetsProgress;
  /** Nico from left, then Gabriel from right (later window) */
  const helmetNicoT = reduceMotion ? 1 : easeOutCubic(clamp01((hel - 0.05) / 0.3));
  const helmetGabT = reduceMotion ? 1 : easeOutCubic(clamp01((hel - 0.4) / 0.32));
  /** vw offset from viewport center: negative = left, positive = right */
  const helmetNicoXvw = -88 + helmetNicoT * 72;
  const helmetGabXvw = 88 - helmetGabT * 72;

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-black text-white"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      {/* Tall track: sticky viewport keeps rings centered while scroll drives formation */}
      <div
        ref={ringTrackRef}
        className="relative w-full"
        style={{ minHeight: `${AUDI_RING_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 z-10 flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-black">
          <div className="relative flex h-[min(140px,22vh)] w-full items-center justify-center px-4">
            {/* Absolute rings: spread=0 → stacked at center; spread=1 → four-ring Audi overlap */}
            <div
              className="relative h-[max(76px,12vh)] w-[min(300px,88vw)] sm:h-[88px]"
              aria-hidden
            >
              {[0, 1, 2, 3].map((i) => {
                const appear = reduceMotion ? 1 : ringAppear(i, ringProgress);
                const x = reduceMotion ? RING_OFFSETS_PX[i]! : RING_OFFSETS_PX[i]! * spread;
                const op = i === 0 ? 1 : appear;
                return (
                  <img
                    key={i}
                    src={RING_IMG}
                    alt=""
                    width={RING_SIZE_PX}
                    height={RING_SIZE_PX}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[76px] w-[76px] max-w-none object-contain select-none sm:h-[88px] sm:w-[88px]"
                    style={{
                      opacity: op,
                      left: `calc(50% + ${x}px)`,
                      transform: 'translate(-50%, -50%)',
                      transition: reduceMotion ? undefined : 'opacity 0.15s ease-out',
                    }}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                );
              })}
            </div>
          </div>

          <p className="pointer-events-none mt-10 max-w-sm px-6 text-center text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
            Scroll
          </p>
        </div>
      </div>

      {/* Car crosses viewport left → right; stays black */}
      <div
        ref={carTrackRef}
        className="relative w-full bg-black"
        style={{ minHeight: `${AUDI_CAR_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 z-10 flex h-[100dvh] w-full items-center overflow-hidden bg-black">
          <img
            src={AUDI_CAR_IMG}
            alt=""
            width={3392}
            height={1272}
            className="pointer-events-none absolute left-0 top-1/2 max-h-[min(42vh,420px)] w-[min(95vw,1040px)] max-w-none object-contain object-left select-none"
            style={{
              transform: reduceMotion
                ? 'translate3d(calc(50vw - 50%), -50%, 0)'
                : `translate3d(calc(-100% + ${carProgress} * (100vw + 100%)), -50%, 0)`,
            }}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Black fades away to reveal full-bleed Audi photo */}
      <div
        ref={fadeTrackRef}
        className="relative w-full bg-black"
        style={{ minHeight: `${AUDI_FADE_SCROLL_VH}vh` }}
      >
        <div className="sticky top-0 z-10 h-[100dvh] w-full overflow-hidden">
          <img
            src={AUDI_FADE_PHOTO}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: fadeOverlayOpacity }}
            aria-hidden
          />
        </div>
      </div>

      {/* Headline on same hero image → scroll fades to black */}
      {reduceMotion ? (
        <section className="relative w-full bg-black">
          <div className="relative min-h-[min(72vh,560px)] w-full">
            <img
              src={AUDI_HEADLINE_PHOTO}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 flex min-h-[min(72vh,560px)] items-center justify-center overflow-x-auto px-4 py-16 sm:px-6">
              <h2 className="whitespace-nowrap text-center text-[clamp(0.7rem,4.1vw,2.15rem)] font-semibold leading-none tracking-[-0.02em] text-white">
                Audi unveils design for Formula 1
              </h2>
            </div>
          </div>
        </section>
      ) : (
        <div
          ref={headlineTrackRef}
          className="relative w-full bg-black"
          style={{ minHeight: `${AUDI_HEADLINE_SCROLL_VH}vh` }}
        >
          <div className="sticky top-0 z-10 flex h-[100dvh] w-full flex-col items-center justify-center overflow-x-auto overflow-y-hidden">
            <img
              src={AUDI_HEADLINE_PHOTO}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: headlineBlackOpacity }}
              aria-hidden
            />
            <h2
              className="relative z-10 whitespace-nowrap px-4 text-center text-[clamp(0.7rem,4.1vw,2.15rem)] font-semibold leading-none tracking-[-0.02em] text-white sm:px-6"
              style={{
                opacity: headlineTextOpacity,
                transform: `translate3d(0, ${headlineTextShift}px, 0)`,
              }}
            >
              Audi unveils design for Formula 1
            </h2>
          </div>
        </div>
      )}

      {/* Black screen — press gallery: natural aspect, edge-to-edge tiles (no gaps) */}
      <section
        className="relative z-10 bg-black pb-20 pl-[env(safe-area-inset-left)] pt-6 sm:pb-28 sm:pt-10 pr-[env(safe-area-inset-right)]"
        aria-label="Audi Formula 1 gallery"
      >
        <div className="grid w-full max-w-none grid-cols-1 gap-0 sm:grid-cols-2">
          {AUDI_GALLERY_ITEMS.map((item, i) => {
            const fullWidthRow =
              item.kind === 'single' && (i === 0 || item.src === AUDI_GALLERY_FULL_WIDTH_IMG);
            if (item.kind === 'stack') {
              return (
                <div
                  key={`stack-${item.top}`}
                  className="relative flex w-full flex-col gap-0 overflow-hidden bg-black"
                >
                  <div className="relative w-full overflow-hidden">
                    <img
                      src={item.top}
                      alt=""
                      className="block h-auto w-full max-w-full object-contain object-center"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1024px"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="relative w-full overflow-hidden">
                    <img
                      src={item.bottom}
                      alt=""
                      className="block h-auto w-full max-w-full object-contain object-center"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1024px"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              );
            }
            return (
              <div
                key={item.src}
                className={cn(
                  'relative w-full overflow-hidden bg-black',
                  fullWidthRow && 'sm:col-span-2'
                )}
              >
                <img
                  src={item.src}
                  alt=""
                  className="block h-auto w-full max-w-full object-contain object-center"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1024px"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Black → “world’s first” (SF) → Speedcafe photo */}
      {reduceMotion ? (
        <section className="relative z-10 w-full bg-black" aria-label="World’s first">
          <div className="relative flex min-h-[min(72dvh,640px)] flex-col items-center justify-center overflow-hidden px-6 py-16">
            <img
              src={AUDI_WORLDS_FIRST_SPEEDCAFE_IMG}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <p
              className="relative z-10 text-center font-semibold tracking-[-0.03em] text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.65)]"
              style={{
                fontFamily: AUDI_WORLDS_FIRST_FONT,
                fontSize: 'clamp(2rem, 7vw, 3.5rem)',
                lineHeight: 1.05,
              }}
            >
              {"world's first"}
            </p>
          </div>
        </section>
      ) : (
        <div
          ref={worldsFirstTrackRef}
          className="relative w-full bg-black"
          style={{ minHeight: `${AUDI_WORLDS_FIRST_SCROLL_VH}vh` }}
        >
          <div className="sticky top-0 z-10 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black">
            <img
              src={AUDI_WORLDS_FIRST_SPEEDCAFE_IMG}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ opacity: worldsFirstPhotoReveal }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black" style={{ opacity: worldsFirstBlackVeil }} aria-hidden />
            <p
              className="relative z-10 px-6 text-center font-semibold tracking-[-0.03em] text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.65)]"
              style={{
                fontFamily: AUDI_WORLDS_FIRST_FONT,
                fontSize: 'clamp(2rem, 7.5vw, 4.25rem)',
                lineHeight: 1.05,
              }}
            >
              {"world's first"}
            </p>
          </div>
        </div>
      )}

      {/* Sticky black — helmets slide in from left / right */}
      {reduceMotion ? (
        <section
          className="relative z-10 flex w-full justify-center bg-black px-4 py-16"
          aria-label="Driver helmets"
        >
          <div className="flex max-w-4xl flex-wrap items-center justify-center gap-10 sm:gap-14">
            <img
              src={AUDI_HELMET_NICO_IMG}
              alt=""
              className="h-auto max-h-[min(42dvh,320px)] w-auto max-w-[min(46vw,280px)] object-contain"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <img
              src={AUDI_HELMET_GABRIEL_IMG}
              alt=""
              className="h-auto max-h-[min(42dvh,320px)] w-auto max-w-[min(46vw,280px)] object-contain"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>
      ) : (
        <div
          ref={helmetsTrackRef}
          className="relative w-full bg-black"
          style={{ minHeight: `${AUDI_HELMETS_SCROLL_VH}vh` }}
        >
          <div className="sticky top-0 z-10 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black">
            <img
              src={AUDI_HELMET_NICO_IMG}
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 h-auto max-h-[min(42dvh,360px)] w-auto max-w-[min(48vw,300px)] select-none object-contain"
              style={{
                opacity: helmetNicoT,
                transform: `translate3d(calc(-50% + ${helmetNicoXvw}vw), -50%, 0)`,
              }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <img
              src={AUDI_HELMET_GABRIEL_IMG}
              alt=""
              className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-auto max-h-[min(42dvh,360px)] w-auto max-w-[min(48vw,300px)] select-none object-contain"
              style={{
                opacity: helmetGabT,
                transform: `translate3d(calc(-50% + ${helmetGabXvw}vw), -50%, 0)`,
              }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      <div className="h-[max(28px,env(safe-area-inset-bottom))] bg-black" aria-hidden />
    </div>
  );
}
