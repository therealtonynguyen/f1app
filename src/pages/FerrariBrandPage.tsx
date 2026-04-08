import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

const CAMPAIGN_IMG =
  'https://wwd.com/wp-content/uploads/2025/05/The-Ferrari-x-Charles-Leclerc-capsule-collections-campaign.jpg';

/** Metallic prancing horse — local asset, centered after campaign fades to black */
const HERO_PRANCING_HORSE_IMG = '/ferrari-prancing-horse-chrome.png';

/** SF-26 — f1-fansite.com */
const SF26_IMG =
  'https://www.f1-fansite.com/wp-content/uploads/2026/01/SF-26_Row1_2_41b7bc5f-140d-4d17-a598-7333332cd2fc-Aangepast.png';

const SF26_ROW2_IMG =
  'https://www.f1-fansite.com/wp-content/uploads/2026/01/SF-26_Row2_2_6ceeb2a5-e569-41d6-b87d-fc02cc66ba9b-Aangepast.png';

const SF26_ROW1_NEXT_IMG =
  'https://www.f1-fansite.com/wp-content/uploads/2026/01/SF-26_Row1_1_362c25cd-9a20-42ec-aa21-a339c0389113-Aangepast.png';

/** First ~22% of scroll: hold campaign; then fade photo to black and bring in crest. */
const HOLD = 0.2;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function scrollProgress(main: HTMLElement, parent: HTMLElement): number {
  const scrollTop = main.scrollTop;
  const mainRect = main.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const offsetTopInScroll = scrollTop + (parentRect.top - mainRect.top);
  const range = Math.max(1, parent.offsetHeight - main.clientHeight);
  return clamp01((scrollTop - offsetTopInScroll) / range);
}

export function FerrariBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const photoPairRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [photoPairProgress, setPhotoPairProgress] = useState(0);

  useLayoutEffect(() => {
    const main = mainScrollRef.current;
    if (!main) return;

    const tick = () => {
      const m = mainScrollRef.current;
      if (!m) return;
      const hero = scrollParentRef.current;
      const pair = photoPairRef.current;
      if (hero) setProgress(scrollProgress(m, hero));
      if (pair) setPhotoPairProgress(scrollProgress(m, pair));
    };

    tick();
    main.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    const ro = new ResizeObserver(tick);
    const hero = scrollParentRef.current;
    const pair = photoPairRef.current;
    if (hero) ro.observe(hero);
    if (pair) ro.observe(pair);
    return () => {
      main.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
      ro.disconnect();
    };
  }, [mainScrollRef]);

  // After hold: campaign fades to black; crest (logo) fades in centered on the black
  const t = clamp01((progress - HOLD) / (1 - HOLD));
  const photoOpacity = 1 - t;
  const crestOpacity = t;

  /** Row1_2 (cover) ↔ Row2 (rotated, car faces down): sticky crossfade until next photo */
  const pairP = clamp01(photoPairProgress);
  const row1Fade = 1 - pairP;
  const row2Fade = pairP;

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-[#0a0404] pt-[var(--app-top-nav-offset)]"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      <div ref={scrollParentRef} className="relative min-h-[480vh] w-full">
        <div
          className="sticky z-10 flex w-full flex-col overflow-hidden"
          style={{
            top: 'var(--app-top-nav-offset)',
            height: 'calc(100dvh - var(--app-top-nav-offset))',
          }}
        >
          <div className="relative min-h-0 flex-1 bg-black">
            {/* Leclerc campaign — sits above black, below logo so the horse can fade in over the photo */}
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
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 sm:px-10"
              style={{ opacity: crestOpacity }}
              aria-hidden
            >
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute left-1/2 top-1/2 h-[min(82vw,380px)] w-[min(82vw,380px)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(200,35,45,0.32)_0%,rgba(90,12,18,0.14)_38%,transparent_65%)]"
                  aria-hidden
                />
                <img
                  src={HERO_PRANCING_HORSE_IMG}
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

      {/* SF-26 Row1_2 → Row2: sticky viewport; car follows until Row1_1 below */}
      <div
        ref={photoPairRef}
        className="relative z-10 min-h-[280vh] w-full border-t border-white/[0.06] bg-[#060202]"
      >
        <div
          className="sticky flex w-full flex-col overflow-hidden bg-[#060202]"
          style={{
            top: 'var(--app-top-nav-offset)',
            minHeight: 'calc(100dvh - var(--app-top-nav-offset))',
          }}
        >
          <div className="relative isolate min-h-0 w-full flex-1">
            <img
              src={SF26_IMG}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center transition-none"
              style={{ opacity: row1Fade }}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25"
              style={{ opacity: row1Fade }}
              aria-hidden
            />
            <div
              className="absolute inset-0 z-[1] flex items-center justify-center px-1 py-6 sm:px-3 sm:py-8"
              style={{ opacity: row2Fade }}
              aria-hidden
            >
              <img
                src={SF26_ROW2_IMG}
                alt=""
                className="h-auto w-[min(100vw,2000px)] max-w-none origin-center object-contain [transform:rotate(90deg)_scale(1.12)] sm:[transform:rotate(90deg)_scale(1.18)]"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

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
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25"
            aria-hidden
          />
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
