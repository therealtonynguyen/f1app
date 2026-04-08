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

const AUDI_GALLERY_IMGS = [
  'https://uploads.audi-mediacenter.com/system/production/media/129036/images/798075a49be83d682dbc49c8528f9c6b9164fa06/A251836_web_1920.jpg?1763019513',
  'https://uploads.audi-mediacenter.com/system/production/media/129027/images/8f76e15909299d782ae94115b802de3d7c8d3974/A251827_web_960.jpg?1763022795',
  'https://uploads.audi-mediacenter.com/system/production/media/129016/images/0ff1fdaaf94a967677ae20a3b5748c47fd5c7206/A251816_web_1920.jpg?1762964887',
  'https://uploads.audi-mediacenter.com/system/production/media/129007/images/880f87bb0f17f62df9d90d1691461a4156800c12/A251807_web_1920.jpg?1762964952',
  'https://uploads.audi-mediacenter.com/system/production/media/129009/images/3f845b208326925d445ba978fe482e6df337f7c8/A251809_web_1920.jpg?1762965364',
] as const;

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
  const [ringProgress, setRingProgress] = useState(0);
  const [carProgress, setCarProgress] = useState(0);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [headlineProgress, setHeadlineProgress] = useState(0);
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

      {/* Black screen — press gallery */}
      <section
        className="relative z-10 bg-black px-4 pb-20 pt-6 sm:px-8 sm:pb-28 sm:pt-10"
        aria-label="Audi Formula 1 gallery"
      >
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 sm:gap-5">
          {AUDI_GALLERY_IMGS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={cn(
                'h-auto w-full rounded-sm object-cover ring-1 ring-white/[0.06]',
                i === 0 && 'sm:col-span-2'
              )}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      </section>

      {/* Continue scrolling — copy + chassis link */}
      <section
        className="relative z-10 border-t border-white/[0.08] bg-black px-6 py-24 sm:px-10 sm:py-32"
        style={{ fontFamily: 'var(--ios-font)' }}
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">Audi</p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/45">
            Four rings — one legacy. Explore every Audi chassis in the app.
          </p>
          <Link
            to="/cars/team/audi"
            className="mt-10 inline-flex rounded-full border border-white/20 bg-white/5 px-8 py-3 text-[14px] font-semibold text-white/90 transition-colors hover:bg-white/10"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(28px,env(safe-area-inset-bottom))] bg-black" aria-hidden />
    </div>
  );
}
