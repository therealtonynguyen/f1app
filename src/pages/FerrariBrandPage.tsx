import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';
import heroHorseUrl from '@/assets/ferrari-prancing-horse-chrome.png';

const CAMPAIGN_IMG =
  'https://wwd.com/wp-content/uploads/2025/05/The-Ferrari-x-Charles-Leclerc-capsule-collections-campaign.jpg';

/** Hamilton & Leclerc (studio) — full-bleed below the hero */
const FERRARI_BOTTOM_PORTRAIT_IMG =
  'https://scontent-lax7-1.cdninstagram.com/v/t51.75761-15/475467387_18032425934614685_5668608112645881722_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=111&ig_cache_key=MzU1NzkzNjUwMjA1MjUwMTU3Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjExNzl4MjU1Ni5zZHIuQzMifQ%3D%3D&_nc_ohc=KHIPPKQJoUsQ7kNvwE6tFUO&_nc_oc=AdqgTsnJniYitCLABjNQ3f4FZiogK0FoAG0KTn3ehasePGoZsVhPo4p_S4gq-Deh1RM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-lax7-1.cdninstagram.com&_nc_gid=ht_txCuGlKCnPMR3L3tsEA&_nc_ss=7a32e&oh=00_Af3FMO9Sqr8kAyDJ6GFdHgiB0OmC6LWletK75fG2CHGF6g&oe=69DCBE42';

/** First ~22% of scroll: hold campaign; then fade photo toward black (horse is always visible on top). */
const HOLD = 0.2;

/** Tall scroll track for sticky black + gold “SF-26” line */
const SF26_OUTRO_SCROLL_VH = 300;

/** Scroll after SF-26: rear studio still fades in while lifting from the bottom */
const REAR_STILL_SCROLL_VH = 320;
const REAR_STILL_IMG =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Ferrari/F678_still_f06_16_9_v10.webp';

/** Gallery — main left, two stacked on the right */
const GALLERY_MAIN =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Ferrari/F678_still_f09_16_9_v10.webp';
const GALLERY_STACK_TOP =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Ferrari/F678_still_f08_16_9_v10.webp';
const GALLERY_STACK_BOTTOM =
  'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000001/fom-website/2026/Ferrari/G_V027BWQAASNgK.webp';

/** Twin SF-26 — Amalgam studio row */
const FERRARI_DUAL_ROW_IMG =
  'https://www.amalgamcollection.com/cdn/shop/files/SF-26_Row1_2_de814a69-f033-4f7a-84e7-5e212a9f085e_4000x2677_crop_center.jpg?v=1775732058';

/** Luxury serif stack — Cormorant Garamond is the closest common web pairing to Gucci’s editorial serif */
const GUCCI_LIKE_SERIF = '"Cormorant Garamond", "Times New Roman", Times, serif';

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

/** Progress 0→1 through a tall scroll section. `scrollStart` = section offset inside `main`. */
function sectionProgress(main: HTMLElement, section: HTMLElement, scrollStart: number): number {
  const range = Math.max(1, section.offsetHeight - main.clientHeight);
  return clamp01((main.scrollTop - scrollStart) / range);
}

export function FerrariBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const sf26TrackRef = useRef<HTMLDivElement>(null);
  const rearStillTrackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [sf26Progress, setSf26Progress] = useState(0);
  const [rearStillProgress, setRearStillProgress] = useState(0);
  const [horseFadeIn, setHorseFadeIn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setHorseFadeIn(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    setReduceMotion(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const tick = useCallback(() => {
    const m = mainScrollRef.current;
    if (!m) return;
    const hero = scrollParentRef.current;
    if (hero) {
      const heroTop = offsetTopToAncestor(hero, m);
      const next = sectionProgress(m, hero, heroTop);
      if (Math.abs(next - progressRef.current) > 0.001) {
        progressRef.current = next;
        setProgress(next);
      }
    }

    const sf26 = sf26TrackRef.current;
    if (sf26) {
      const top = offsetTopToAncestor(sf26, m);
      const range = Math.max(1, sf26.offsetHeight - m.clientHeight);
      setSf26Progress(clamp01((m.scrollTop - top) / range));
    }

    const rear = rearStillTrackRef.current;
    if (rear) {
      const top = offsetTopToAncestor(rear, m);
      const range = Math.max(1, rear.offsetHeight - m.clientHeight);
      setRearStillProgress(clamp01((m.scrollTop - top) / range));
    }
  }, [mainScrollRef]);

  useLayoutEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;

    let raf = 0;
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    tick();
    main.addEventListener('scroll', tick, { passive: true });
    main.addEventListener('wheel', tick, { passive: true });
    window.addEventListener('resize', tick);
    const ro = new ResizeObserver(tick);
    const hero = scrollParentRef.current;
    if (hero) ro.observe(hero);
    ro.observe(main);
    const rafObserveSf26 = requestAnimationFrame(() => {
      const sf = sf26TrackRef.current;
      if (sf) ro.observe(sf);
      const rear = rearStillTrackRef.current;
      if (rear) ro.observe(rear);
    });
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rafObserveSf26);
      main.removeEventListener('scroll', tick);
      main.removeEventListener('wheel', tick);
      window.removeEventListener('resize', tick);
      ro.disconnect();
    };
  }, [mainScrollRef, tick]);

  // After hold: campaign fades toward black; horse stays fully visible (not tied to scroll)
  const t = clamp01((progress - HOLD) / (1 - HOLD));
  const photoOpacity = 1 - t;

  const sf26TextOpacity = reduceMotion ? 1 : easeOutCubic(clamp01((sf26Progress - 0.06) / 0.55));

  /** After SF-26: fade in + ease up from below (long, slow range). */
  const rearRaw = clamp01((rearStillProgress - 0.04) / 0.78);
  const rearEase = easeOutCubic(rearRaw);
  const rearLiftOpacity = rearEase;
  const rearLiftVh = (1 - rearEase) * 22;

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-[#0a0404]"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <div ref={scrollParentRef} className="relative min-h-[480vh] w-full">
        <div
          className="sticky top-0 z-10 flex w-full flex-col overflow-hidden"
          style={{
            height: '100dvh',
          }}
        >
          <div className="relative min-h-0 flex-1 bg-black">
            {/* Campaign (first photo): opacity 1→0 over scroll → black; horse above */}
            <img
              src={CAMPAIGN_IMG}
              alt=""
              className="absolute inset-0 z-0 h-full w-full object-cover object-center"
              style={{ opacity: photoOpacity }}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div
              className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 sm:px-10 transition-opacity duration-[1100ms] ease-out motion-reduce:transition-none ${horseFadeIn ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden
            >
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute left-1/2 top-1/2 h-[min(82vw,380px)] w-[min(82vw,380px)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(200,35,45,0.32)_0%,rgba(90,12,18,0.14)_38%,transparent_65%)]"
                  aria-hidden
                />
                <img
                  src={heroHorseUrl}
                  alt=""
                  className="relative z-10 w-[min(58vw,260px)] max-w-full object-contain drop-shadow-[0_0_48px_rgba(255,255,255,0.12)]"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full bg-[#140505]">
        <img
          src={FERRARI_BOTTOM_PORTRAIT_IMG}
          alt=""
          className="block h-auto w-full max-w-none"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Sticky black: gold Gucci-like serif line fades in as you scroll */}
      {reduceMotion ? (
        <>
          <section
            className="relative z-10 bg-black px-6 py-24 sm:px-10"
            aria-label="Scuderia Ferrari SF-26"
          >
            <p
              className="mx-auto max-w-4xl text-center text-[clamp(1.35rem,4.5vw,2.25rem)] font-medium leading-snug tracking-[0.12em]"
              style={{
                fontFamily: GUCCI_LIKE_SERIF,
                color: '#c9a227',
                textShadow: '0 0 36px rgba(201, 162, 39, 0.22)',
              }}
            >
              Scuderia Ferrari SF - 26
            </p>
          </section>
          <section
            className="relative z-10 h-[100dvh] w-full overflow-hidden bg-black"
            aria-label="Ferrari SF-26 rear"
          >
            <img
              src={REAR_STILL_IMG}
              alt=""
              className="block h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </section>
        </>
      ) : (
        <>
          <div
            ref={sf26TrackRef}
            className="relative w-full bg-black"
            style={{ minHeight: `${SF26_OUTRO_SCROLL_VH}vh` }}
          >
            <div className="sticky top-0 z-10 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black px-6">
              <p
                className="max-w-[min(40ch,92vw)] text-center text-[clamp(1.15rem,4vw,2.05rem)] font-medium leading-snug tracking-[0.14em] sm:tracking-[0.18em]"
                style={{
                  fontFamily: GUCCI_LIKE_SERIF,
                  color: '#c9a227',
                  opacity: sf26TextOpacity,
                  textShadow: '0 0 42px rgba(201, 162, 39, 0.28), 0 2px 24px rgba(0,0,0,0.65)',
                }}
              >
                Scuderia Ferrari SF - 26
              </p>
            </div>
          </div>

          <div
            ref={rearStillTrackRef}
            className="relative w-full bg-black"
            style={{ minHeight: `${REAR_STILL_SCROLL_VH}vh` }}
          >
            <div className="sticky top-0 z-10 h-[100dvh] w-full overflow-hidden bg-black">
              <img
                src={REAR_STILL_IMG}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                style={{
                  opacity: rearLiftOpacity,
                  transform: `translate3d(0, ${rearLiftVh}vh, 0)`,
                  willChange: 'opacity, transform',
                }}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </>
      )}

      <section
        className="relative z-10 w-full bg-black px-4 py-10 sm:px-6 sm:py-14"
        aria-label="Ferrari SF-26 gallery"
      >
        <div className="mx-auto max-w-[1600px]">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2 lg:grid-rows-2">
            <div className="relative aspect-video overflow-hidden lg:row-span-2 lg:aspect-auto lg:min-h-0">
              <img
                src={GALLERY_MAIN}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative aspect-video overflow-hidden">
              <img
                src={GALLERY_STACK_TOP}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative aspect-video overflow-hidden">
              <img
                src={GALLERY_STACK_BOTTOM}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 w-full bg-black">
        <img
          src={FERRARI_DUAL_ROW_IMG}
          alt=""
          className="block h-auto w-full max-w-none"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="h-[max(24px,env(safe-area-inset-bottom))] bg-black" aria-hidden />
    </div>
  );
}
