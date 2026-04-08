import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import type { MainShellOutletContext } from '@/layouts/MainShellLayout';

const HERO_003 =
  'https://cdn.group.renault.com/alp/master/formula-1/homepage/alpine-F1-home-003-desktop.jpg.ximg.largex2.webp/b66071676e.webp';

const HERO_004 =
  'https://cdn.group.renault.com/alp/master/formula-1/homepage/alpine-F1-home-004-desktop.jpg.ximg.largex2.webp/e5b01c98b8.webp';

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function sectionProgress(main: HTMLElement, section: HTMLElement): number {
  const scrollStart = section.offsetTop;
  const range = Math.max(1, section.offsetHeight - main.clientHeight);
  return clamp01((main.scrollTop - scrollStart) / range);
}

/** Scroll phases within the sticky hero strip (0–1). */
const HOLD_END = 0.28;
const ZOOM_END = 0.52;

const ALPINE_FACTS: readonly { label: string; value: string }[] = [
  { label: 'Team', value: 'BWT Alpine F1 Team' },
  { label: 'Chassis', value: 'Carbon composite monocoque · 2026 regulations' },
  { label: 'Power unit', value: 'Renault (Alpine-badged) · hybrid V6 + MGU-K/H' },
  { label: 'Minimum mass', value: '768 kg · FIA technical regulations' },
  { label: 'Gearbox', value: '8 forward speeds · semi-automatic' },
  { label: 'Home base', value: 'Enstone, United Kingdom' },
];

function chunkPairs<T>(arr: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push(arr.slice(i, i + 2) as T[]);
  }
  return out;
}

function FactCell({ row }: { row: { label: string; value: string } }) {
  return (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{row.label}</div>
      <div className="mt-2 text-[14px] leading-snug text-neutral-900">{row.value}</div>
    </>
  );
}

export function AlpineBrandPage() {
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const tick = useCallback(() => {
    const m = mainScrollRef.current;
    if (!m) return;
    const hero = scrollParentRef.current;
    if (!hero) return;
    const next = sectionProgress(m, hero);
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

  let scale = 1;
  if (!reduceMotion) {
    if (progress <= HOLD_END) {
      scale = 1;
    } else if (progress <= ZOOM_END) {
      const t = easeOutCubic((progress - HOLD_END) / (ZOOM_END - HOLD_END));
      scale = 1 - t * 0.26;
    } else {
      scale = 0.74;
    }
  }

  return (
    <div
      className="relative -mt-[var(--app-top-nav-offset)] flex min-h-0 flex-1 flex-col bg-white"
      style={{ fontFamily: 'var(--ios-font)' }}
    >
      {/* Tall strip: sticky viewport keeps hero centered while you scroll; scale = zoom-out */}
      <div ref={scrollParentRef} className="relative min-h-[320vh] w-full">
        <div
          className="sticky top-0 z-10 flex w-full flex-col overflow-hidden bg-white"
          style={{ height: '100dvh' }}
        >
          <div className="relative min-h-0 flex-1">
            <img
              src={HERO_003}
              alt=""
              className="absolute left-1/2 top-1/2 h-[min(120vh,140%)] w-[min(120vw,140%)] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-center will-change-transform"
              style={{
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(255,255,255,0.5)_100%)]"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <section className="relative z-10 border-t border-neutral-200 bg-white px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-400">
            Alpine · Formula One™
          </p>
          <h2 className="mt-4 text-center text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight text-neutral-900">
            The car
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[14px] leading-relaxed text-neutral-500">
            Engineering snapshot — representative of modern F1 technical rules (mass, hybrid, gearbox).
          </p>
          <div className="mt-14">
            {/* Mobile: white tiles, divide-y = single 1px separators (no gap between backgrounds) */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:hidden">
              <div className="divide-y divide-neutral-200">
                {ALPINE_FACTS.map((row) => (
                  <div key={row.label} className="bg-white px-5 py-4">
                    <FactCell row={row} />
                  </div>
                ))}
              </div>
            </div>
            {/* sm+: collapsed table — shared borders merge (single hairlines, no gutters) */}
            <div className="hidden overflow-hidden rounded-2xl sm:block">
              <table className="w-full border-collapse border border-neutral-200 bg-white text-left">
                <tbody>
                  {chunkPairs(ALPINE_FACTS).map((pair, rowIdx) => (
                    <tr key={rowIdx}>
                      {pair.map((row) => (
                        <td key={row.label} className="w-1/2 border border-neutral-200 bg-white px-5 py-4 align-top">
                          <FactCell row={row} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 w-full border-t border-neutral-200 bg-white">
        <div className="relative min-h-[min(78dvh,820px)] w-full overflow-hidden">
          <img
            src={HERO_004}
            alt=""
            className="h-full min-h-[min(78dvh,820px)] w-full object-cover object-center"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/25"
            aria-hidden
          />
        </div>
      </section>

      <section className="relative z-10 border-t border-neutral-200 bg-neutral-50 px-6 py-20 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-400">Alpine</p>
          <p className="mt-5 text-[15px] leading-relaxed text-neutral-600">
            French precision — from Enstone to the grid.
          </p>
          <Link
            to="/cars/team/alpine"
            className="mt-10 inline-flex rounded-full border border-neutral-300 bg-white px-8 py-3 text-[14px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Chassis history
          </Link>
        </div>
      </section>

      <div className="h-[max(24px,env(safe-area-inset-bottom))]" aria-hidden />
    </div>
  );
}
