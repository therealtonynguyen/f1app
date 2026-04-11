import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
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

/** Sticky — duo photo; driver names fade in centered */
const AUDI_DRIVERS_DUO_SCROLL_VH = 340;

const AUDI_DRIVERS_DUO_IMG =
  'https://cdn-1.motorsport.com/static/img/news/711491.webp';

/** Miami — black block, track rises from bottom, countdown at top */
const AUDI_MIAMI_TRACK_SCROLL_VH = 360;

const AUDI_MIAMI_TRACK_IMG =
  'https://www.cadillacf1team.com/ctfassets/images/123jt18lixwc/2mBUUhnfOWQ0u07Wiqnl6F/f5e9b86abaf05c1eca665aa1e0f69a28/19.Miami_International_Autodrome_-_USA.001.png?fm=avif&w=1920';

const MIAMI_GP_RACE_DATE = 'May 3, 2026';

/** Miami GP 2026 — race start (America/New_York) */
const MIAMI_GP_RACE_START = new Date('2026-05-03T16:00:00-04:00');

/** Partner names — aligned with Audi Revolut F1 Team published partners (audif1.com/en/partners). */
const AUDI_SPONSORS: readonly string[] = [
  'Revolut',
  'Visit Qatar',
  'adidas',
  'Aleph',
  'bp',
  'Camozzi',
  'Castrol',
  'ElevenLabs',
  'Extreme Networks',
  'Gillette',
  'Glasurit',
  'Hyatt',
  'ic! berlin',
  'Libertex',
  'Mammoet',
  'Nexo',
  'NinjaOne',
  'Paulaner',
  'Perk',
  'Piquadro',
] as const;

/** Scroll length for sticky white partners block */
const AUDI_SPONSORS_SCROLL_VH = 320;

/** Vertical position of the “Partners” label in the viewport (px; negative = higher) */
const AUDI_PARTNERS_LABEL_NUDGE_PX = -104;

/** Extra downward offset for the sponsor list only (px), below the label */
const AUDI_PARTNERS_LIST_OFFSET_PX = 72;

function miamiGpCountdownParts(msLeft: number): { d: number; h: number; m: number; s: number } {
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
}

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
  const driversDuoTrackRef = useRef<HTMLDivElement>(null);
  const miamiTrackRef = useRef<HTMLDivElement>(null);
  const sponsorsTrackRef = useRef<HTMLElement>(null);
  const [ringProgress, setRingProgress] = useState(0);
  const [carProgress, setCarProgress] = useState(0);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [headlineProgress, setHeadlineProgress] = useState(0);
  const [worldsFirstProgress, setWorldsFirstProgress] = useState(0);
  const [driversDuoProgress, setDriversDuoProgress] = useState(0);
  const [miamiTrackProgress, setMiamiTrackProgress] = useState(0);
  const [sponsorsProgress, setSponsorsProgress] = useState(0);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(id);
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

    const driversDuoTrack = driversDuoTrackRef.current;
    if (driversDuoTrack) {
      const top = offsetTopToAncestor(driversDuoTrack, main);
      const range = Math.max(1, driversDuoTrack.offsetHeight - main.clientHeight);
      setDriversDuoProgress(clamp01((main.scrollTop - top) / range));
    }

    const miamiTrack = miamiTrackRef.current;
    if (miamiTrack) {
      const top = offsetTopToAncestor(miamiTrack, main);
      const range = Math.max(1, miamiTrack.offsetHeight - main.clientHeight);
      setMiamiTrackProgress(clamp01((main.scrollTop - top) / range));
    }

    const sponsorsTrack = sponsorsTrackRef.current;
    if (sponsorsTrack) {
      const top = offsetTopToAncestor(sponsorsTrack, main);
      const range = Math.max(1, sponsorsTrack.offsetHeight - main.clientHeight);
      setSponsorsProgress(clamp01((main.scrollTop - top) / range));
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
      if (driversDuoTrackRef.current) ro.observe(driversDuoTrackRef.current);
      if (miamiTrackRef.current) ro.observe(miamiTrackRef.current);
      if (sponsorsTrackRef.current) ro.observe(sponsorsTrackRef.current);
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
  /** “See More” — only once Speedcafe layer has nearly finished fading in (black veil cleared) */
  const worldsFirstSeeMoreOpacity = reduceMotion
    ? 1
    : easeOutCubic(clamp01((worldsFirstPhotoReveal - 0.92) / 0.08));

  const dd = driversDuoProgress;
  const driversNameNicoOp = reduceMotion ? 1 : easeOutCubic(clamp01((dd - 0.1) / 0.24));
  /** “&” between Nico and Gabriel in time — fades before Gabriel’s line */
  const driversAmpersandOp = reduceMotion ? 1 : easeOutCubic(clamp01((dd - 0.2) / 0.22));
  const driversNameGabrielOp = reduceMotion ? 1 : easeOutCubic(clamp01((dd - 0.46) / 0.28));

  const rp = miamiTrackProgress;
  const miamiTrackSlide = reduceMotion ? 1 : easeOutCubic(clamp01(rp / 0.48));
  const miamiTrackYvh = reduceMotion ? 0 : (1 - miamiTrackSlide) * 52;
  const miamiCountdownFade = reduceMotion ? 1 : easeOutCubic(clamp01((rp - 0.1) / 0.34));

  const sp = sponsorsProgress;
  const sponsorsReveal = reduceMotion ? 1 : easeOutCubic(clamp01((sp - 0.06) / 0.38));
  const sponsorsLift = reduceMotion ? 0 : (1 - easeOutCubic(clamp01((sp - 0.06) / 0.38))) * 18;

  const countdownParts = miamiGpCountdownParts(MIAMI_GP_RACE_START.getTime() - countdownNow);
  const cdD = countdownParts.d.toString();
  const cdH = countdownParts.h.toString().padStart(2, '0');
  const cdM = countdownParts.m.toString().padStart(2, '0');
  const cdS = countdownParts.s.toString().padStart(2, '0');

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
          <div className="relative flex min-h-[min(72dvh,640px)] flex-col overflow-hidden">
            <img
              src={AUDI_WORLDS_FIRST_SPEEDCAFE_IMG}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 flex min-h-[min(72dvh,640px)] flex-1 flex-col items-center justify-center px-6 py-16">
              <p
                className="text-center font-semibold tracking-[-0.03em] text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.65)]"
                style={{
                  fontFamily: AUDI_WORLDS_FIRST_FONT,
                  fontSize: 'clamp(2rem, 7vw, 3.5rem)',
                  lineHeight: 1.05,
                }}
              >
                {"world's first"}
              </p>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex justify-center px-4 pb-6 md:bottom-9 md:pb-8">
              <Link
                to="/cars/audi/showcase"
                style={{ fontFamily: 'var(--ios-font)' }}
                className="pointer-events-auto inline-flex h-10 min-h-10 min-w-[10rem] scale-[0.94] items-center justify-center rounded-full border-2 border-neutral-500 bg-black px-10 text-[14px] font-medium leading-none tracking-normal text-white transition-[transform,border-color] duration-200 ease-out hover:border-red-500 active:scale-[0.92] motion-reduce:transform-none focus-visible:border-red-500 focus-visible:outline-none sm:min-w-[11rem] sm:px-11"
                aria-label="Audi F1 cars showcase"
              >
                See More
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div
          ref={worldsFirstTrackRef}
          className="relative w-full bg-black"
          style={{ minHeight: `${AUDI_WORLDS_FIRST_SCROLL_VH}vh` }}
        >
          <div className="sticky top-0 z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-black">
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
            <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6">
              <p
                className="text-center font-semibold tracking-[-0.03em] text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.65)]"
                style={{
                  fontFamily: AUDI_WORLDS_FIRST_FONT,
                  fontSize: 'clamp(2rem, 7.5vw, 4.25rem)',
                  lineHeight: 1.05,
                }}
              >
                {"world's first"}
              </p>
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex justify-center px-4 pb-6 md:bottom-9 md:pb-8"
              style={{
                opacity: worldsFirstSeeMoreOpacity,
                transition: 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <Link
                to="/cars/audi/showcase"
                style={{ fontFamily: 'var(--ios-font)' }}
                className="pointer-events-auto inline-flex h-10 min-h-10 min-w-[10rem] scale-[0.94] items-center justify-center rounded-full border-2 border-neutral-500 bg-black px-10 text-[14px] font-medium leading-none tracking-normal text-white transition-[transform,border-color] duration-200 ease-out hover:border-red-500 active:scale-[0.92] motion-reduce:transform-none focus-visible:border-red-500 focus-visible:outline-none sm:min-w-[11rem] sm:px-11"
                aria-label="Audi F1 cars showcase"
              >
                See More
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sticky — duo photo; names fade in centered */}
      {reduceMotion ? (
        <section className="relative z-10 w-full bg-black" aria-label="Audi drivers">
          <div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden">
            <img
              src={AUDI_DRIVERS_DUO_IMG}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0 px-6 text-center">
              <div className="absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
                <span
                  className="select-none text-[clamp(2.25rem,11vw,6.5rem)] font-semibold text-white/35 [text-shadow:0_2px_32px_rgba(0,0,0,0.55)]"
                  style={{ fontFamily: AUDI_WORLDS_FIRST_FONT }}
                >
                  &
                </span>
              </div>
              <Link
                to="/cars/audi/drivers/nico-hulkenberg"
                className="relative z-10 text-[clamp(1.15rem,4vw,1.9rem)] font-semibold leading-none tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.82)] pointer-events-auto inline-block origin-center rounded-sm outline-offset-2 transition-[transform,colors] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                style={{ fontFamily: AUDI_WORLDS_FIRST_FONT }}
              >
                Nico Hulkenberg
              </Link>
              <Link
                to="/cars/audi/drivers/gabriel-bortoleto"
                className="relative z-10 -mt-1 text-[clamp(1.15rem,4vw,1.9rem)] font-semibold leading-none tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.82)] pointer-events-auto inline-block origin-center rounded-sm outline-offset-2 transition-[transform,colors] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                style={{ fontFamily: AUDI_WORLDS_FIRST_FONT }}
              >
                Gabriel Bortoleto
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div
          ref={driversDuoTrackRef}
          className="relative w-full bg-black"
          style={{ minHeight: `${AUDI_DRIVERS_DUO_SCROLL_VH}vh` }}
        >
          <div className="sticky top-0 z-10 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black">
            <img
              src={AUDI_DRIVERS_DUO_IMG}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-0 px-6 text-center">
              <div className="absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
                <span
                  className="select-none text-[clamp(2.25rem,11vw,6.5rem)] font-semibold text-white/35 [text-shadow:0_2px_32px_rgba(0,0,0,0.55)]"
                  style={{ fontFamily: AUDI_WORLDS_FIRST_FONT, opacity: driversAmpersandOp }}
                >
                  &
                </span>
              </div>
              <Link
                to="/cars/audi/drivers/nico-hulkenberg"
                className="relative z-10 text-[clamp(1.15rem,4vw,1.95rem)] font-semibold leading-none tracking-tight text-white [text-shadow:0_2px_22px_rgba(0,0,0,0.85)] pointer-events-auto inline-block origin-center rounded-sm outline-offset-2 transition-[transform,colors] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                style={{
                  fontFamily: AUDI_WORLDS_FIRST_FONT,
                  opacity: driversNameNicoOp,
                }}
              >
                Nico Hulkenberg
              </Link>
              <Link
                to="/cars/audi/drivers/gabriel-bortoleto"
                className="relative z-10 -mt-1 text-[clamp(1.15rem,4vw,1.95rem)] font-semibold leading-none tracking-tight text-white [text-shadow:0_2px_22px_rgba(0,0,0,0.85)] pointer-events-auto inline-block origin-center rounded-sm outline-offset-2 transition-[transform,colors] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                style={{
                  fontFamily: AUDI_WORLDS_FIRST_FONT,
                  opacity: driversNameGabrielOp,
                }}
              >
                Gabriel Bortoleto
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Miami — black block; track from bottom; race-start countdown at top */}
      {reduceMotion ? (
        <section
          ref={miamiTrackRef}
          className="relative w-full bg-black"
          style={{ minHeight: `${AUDI_MIAMI_TRACK_SCROLL_VH}vh` }}
          aria-label="Miami Grand Prix"
        >
          <div className="sticky top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-black">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 flex w-full flex-col items-stretch pt-[max(26vh,calc(2rem+env(safe-area-inset-top)))]"
              style={{ fontFamily: 'var(--ios-font)' }}
              aria-live="polite"
            >
              <div className="flex flex-col items-center px-4 text-center sm:px-8">
                <p className="text-[clamp(10px,2.5vw,12px)] font-bold uppercase tracking-[0.28em] text-white/70">
                  Race start
                </p>
                <p className="mt-5 text-[clamp(11px,2.8vw,13px)] font-medium tabular-nums text-white/45">
                  {MIAMI_GP_RACE_DATE}
                </p>
              </div>
              <div
                className="mt-7 flex w-full items-end justify-between gap-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] text-white"
                aria-label={`${countdownParts.d} days, ${countdownParts.h} hours, ${countdownParts.m} minutes, ${countdownParts.s} seconds until Miami Grand Prix`}
              >
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdD}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">days</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdH}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">hr</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdM}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">min</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdS}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">sec</span>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-28 sm:px-8 sm:pb-10">
              <img
                src={AUDI_MIAMI_TRACK_IMG}
                alt="Miami International Autodrome track layout"
                className="h-auto max-h-[min(82dvh,960px)] w-full max-w-[min(98vw,1400px)] object-contain object-bottom"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      ) : (
        <div
          ref={miamiTrackRef}
          className="relative w-full bg-black"
          style={{ minHeight: `${AUDI_MIAMI_TRACK_SCROLL_VH}vh` }}
        >
          <div className="sticky top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-black">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 flex w-full flex-col items-stretch pt-[max(26vh,calc(2rem+env(safe-area-inset-top)))]"
              style={{
                fontFamily: 'var(--ios-font)',
                opacity: miamiCountdownFade,
              }}
              aria-live="polite"
            >
              <div className="flex flex-col items-center px-4 text-center sm:px-8">
                <p className="text-[clamp(10px,2.5vw,12px)] font-bold uppercase tracking-[0.28em] text-white/70">
                  Race start
                </p>
                <p className="mt-5 text-[clamp(11px,2.8vw,13px)] font-medium tabular-nums text-white/45">
                  {MIAMI_GP_RACE_DATE}
                </p>
              </div>
              <div
                className="mt-7 flex w-full items-end justify-between gap-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] text-white"
                aria-label={`${countdownParts.d} days, ${countdownParts.h} hours, ${countdownParts.m} minutes, ${countdownParts.s} seconds until Miami Grand Prix`}
              >
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdD}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">days</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdH}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">hr</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdM}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">min</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[clamp(1.35rem,7vw,3rem)] font-bold tabular-nums leading-none">{cdS}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">sec</span>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-28 sm:px-8 sm:pb-10">
              <img
                src={AUDI_MIAMI_TRACK_IMG}
                alt="Miami International Autodrome track layout"
                className="h-auto max-h-[min(82dvh,960px)] w-full max-w-[min(98vw,1400px)] object-contain object-bottom"
                style={{
                  transform: `translate3d(0, ${miamiTrackYvh}vh, 0)`,
                  willChange: 'transform',
                }}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* White partners block — scroll reveals list */}
      <section
        ref={sponsorsTrackRef}
        className="relative w-full border-t border-neutral-200 bg-white text-neutral-900"
        style={{ minHeight: `${AUDI_SPONSORS_SCROLL_VH}vh` }}
        aria-labelledby="audi-partners-heading"
      >
        <div className="sticky top-0 flex h-[100dvh] w-full flex-col items-center justify-center px-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
          <div className="flex w-full max-w-3xl flex-col items-center self-center text-center">
            <h2
              id="audi-partners-heading"
              className="w-full text-center text-[clamp(11px,2.6vw,13px)] font-bold uppercase tracking-[0.28em] text-neutral-500"
              style={{
                opacity: sponsorsReveal,
                transform: `translate3d(0, ${AUDI_PARTNERS_LABEL_NUDGE_PX}px, 0)`,
                willChange: reduceMotion ? undefined : 'opacity, transform',
              }}
            >
              Partners
            </h2>
            <ul
              className="mt-10 mx-auto flex w-full max-w-3xl flex-wrap justify-center gap-x-6 gap-y-4 sm:gap-x-8 sm:gap-y-5"
              style={{
                opacity: sponsorsReveal,
                transform: `translate3d(0, ${sponsorsLift + AUDI_PARTNERS_LABEL_NUDGE_PX + AUDI_PARTNERS_LIST_OFFSET_PX}px, 0)`,
                willChange: reduceMotion ? undefined : 'opacity, transform',
              }}
            >
              {AUDI_SPONSORS.map((name) => (
                <li
                  key={name}
                  className="text-center text-[clamp(14px,3.4vw,17px)] font-medium tracking-tight text-neutral-800"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="h-[max(28px,env(safe-area-inset-bottom))] bg-black" aria-hidden />
    </div>
  );
}
