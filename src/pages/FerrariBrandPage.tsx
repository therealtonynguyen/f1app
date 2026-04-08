import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';
import heroHorseUrl from '@/assets/ferrari-prancing-horse-chrome.png';

const CAMPAIGN_IMG =
  'https://wwd.com/wp-content/uploads/2025/05/The-Ferrari-x-Charles-Leclerc-capsule-collections-campaign.jpg';

/** SF-26 — f1-fansite.com */
const SF26_IMG =
  'https://www.f1-fansite.com/wp-content/uploads/2026/01/SF-26_Row1_2_41b7bc5f-140d-4d17-a598-7333332cd2fc-Aangepast.png';

/** Between the two SF-26 stills — prismsilks.com */
const SF26_BETWEEN_IMG =
  'https://prismsilks.com/cdn/shop/products/IMG_8636_f97888b2-e1e8-4c5e-8c97-785071f662d1_1024x1024.jpg?v=1530419960';

const SF26_ROW1_NEXT_IMG =
  'https://www.f1-fansite.com/wp-content/uploads/2026/01/SF-26_Row1_1_362c25cd-9a20-42ec-aa21-a339c0389113-Aangepast.png';

/** First ~22% of scroll: hold campaign; then fade photo toward black (horse is always visible on top). */
const HOLD = 0.2;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/** Progress 0→1 through a tall scroll section. Uses main.scrollTop (the shell scroll container). */
function sectionProgress(main: HTMLElement, section: HTMLElement, scrollStart: number): number {
  const range = Math.max(1, section.offsetHeight - main.clientHeight);
  return clamp01((main.scrollTop - scrollStart) / range);
}

function Sf26PhotoCaption() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-[linear-gradient(to_top,rgba(6,2,2,0.92)_0%,rgba(6,2,2,0.45)_50%,transparent_100%)] sm:h-36"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center px-4 pb-7 pt-0 text-center sm:px-8 sm:pb-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F2E8D8]">SF-26 · 2026</p>
      </div>
    </>
  );
}

/** Centered 1 → 400 counter on the bottom SF-26 still; ease-in cubic so the count speeds up */
function BottomPhotoSpeedCounter() {
  const [speed, setSpeed] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const startAnim = () => {
      if (ran.current) return;
      ran.current = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setSpeed(400);
        return;
      }
      const start = performance.now();
      const duration = 2800;

      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t * t * t;
        const v = Math.min(400, Math.max(1, Math.floor(1 + eased * 399)));
        setSpeed(v);
        if (t < 1) requestAnimationFrame(frame);
        else setSpeed(400);
      };
      requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) startAnim();
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-center px-4 pb-12 text-center sm:pb-16 -translate-y-20 sm:-translate-y-24"
    >
      <div className="relative flex items-center justify-center">
        <div
          className="absolute left-1/2 top-1/2 h-[min(88vw,300px)] w-[min(88vw,300px)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.42)_0%,rgba(120,20,28,0.22)_38%,transparent_68%)] sm:h-[min(72vw,340px)] sm:w-[min(72vw,340px)]"
          aria-hidden
        />
        <span
          className="relative z-10 font-mono text-[clamp(2.75rem,11vw,4.75rem)] font-semibold tabular-nums tracking-tight text-white [text-shadow:0_0_2px_rgba(0,0,0,0.55),0_0_14px_rgba(0,0,0,0.38)]"
          aria-live="polite"
          aria-label={`Speed ${speed} kilometers per hour`}
        >
          {speed}
        </span>
      </div>
      <span className="relative z-10 mt-1 -translate-y-3 text-[15px] font-semibold uppercase tracking-[0.32em] text-white [text-shadow:0_0_2px_rgba(0,0,0,0.5)] sm:mt-2 sm:-translate-y-4">
        km/h
      </span>
    </div>
  );
}

export function FerrariBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [horseFadeIn, setHorseFadeIn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setHorseFadeIn(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  const tick = useCallback(() => {
    const m = mainScrollRef.current;
    if (!m) return;
    const hero = scrollParentRef.current;
    if (!hero) return;
    const next = sectionProgress(m, hero, 0);
    if (Math.abs(next - progressRef.current) > 0.001) {
      progressRef.current = next;
      setProgress(next);
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
    return () => {
      cancelAnimationFrame(raf);
      main.removeEventListener('scroll', tick);
      main.removeEventListener('wheel', tick);
      window.removeEventListener('resize', tick);
      ro.disconnect();
    };
  }, [mainScrollRef, tick]);

  // After hold: campaign fades toward black; horse stays fully visible (not tied to scroll)
  const t = clamp01((progress - HOLD) / (1 - HOLD));
  const photoOpacity = 1 - t;

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
            {/* Leclerc campaign; horse fades in on top after paint */}
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

      <section className="relative z-10 w-full border-t border-white/[0.06] bg-[#060202]">
        <div className="relative min-h-[min(78dvh,820px)] w-full overflow-hidden">
          <img
            src={SF26_IMG}
            alt="Ferrari SF-26"
            className="h-full min-h-[min(78dvh,820px)] w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25"
            aria-hidden
          />
          <Sf26PhotoCaption />
        </div>
      </section>

      <section className="relative z-10 w-full border-t border-white/[0.06] bg-[#060202]">
        <div className="relative min-h-[min(78dvh,820px)] w-full overflow-hidden">
          <img
            src={SF26_BETWEEN_IMG}
            alt=""
            className="h-full min-h-[min(78dvh,820px)] w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25"
            aria-hidden
          />
          <Sf26PhotoCaption />
        </div>
      </section>

      <section className="relative z-10 w-full border-t border-white/[0.06] bg-[#060202]">
        <div className="relative min-h-[min(78dvh,820px)] w-full overflow-hidden">
          <img
            src={SF26_ROW1_NEXT_IMG}
            alt="Ferrari SF-26"
            className="h-full min-h-[min(78dvh,820px)] w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/50 via-transparent to-black/25"
            aria-hidden
          />
          <BottomPhotoSpeedCounter />
          <Sf26PhotoCaption />
        </div>
      </section>

      <section className="relative z-10 border-t border-white/[0.06] bg-[#080202] px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-400/45">Scuderia Ferrari</p>
          <p className="mt-6 text-[15px] leading-relaxed text-white/45">
            Formula One™ — Maranello spirit, trackside.
          </p>
          <Link
            to="/cars/team/ferrari"
            className="mt-10 inline-flex rounded-full border border-white/15 bg-white/5 px-8 py-3 text-[14px] font-semibold text-white/90 transition-colors hover:bg-white/10"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))]" aria-hidden />
    </div>
  );
}
