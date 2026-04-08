import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  fetchFormulaOneSeasonSummary,
  formulaOneGenerationNote,
} from '@/lib/wikipediaSeasonSummary';
import { MIN_F1_DATA_YEAR, dataSeasonYearsDescending } from '@/lib/f1DataYears';
import {
  defaultGenerationsYear,
  generationTeamShowcase,
  type GenerationTeamRow,
} from '@/lib/generationsTeamShowcase';
import { APP_TOP_NAV_OFFSET_VAR, type MainShellOutletContext } from '@/layouts/MainShellLayout';
import type { TeamSlug } from '@/lib/teamCarHistory';

const F1_RED = '#e10600';
const NEWEST_F1_DATA_YEAR = dataSeasonYearsDescending()[0];

function RevealBlock({
  children,
  className,
  scrollRoot,
}: {
  children: React.ReactNode;
  className?: string;
  scrollRoot: RefObject<HTMLElement | null>;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const root = scrollRoot.current ?? undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) setVisible(true);
      },
      { root, rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRoot]);

  return (
    <div
      ref={elRef}
      className={cn(
        'transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

function TeamStage({
  row,
  index,
  scrollRoot,
  onOpenTeamHistory,
}: {
  row: GenerationTeamRow;
  index: number;
  scrollRoot: RefObject<HTMLElement | null>;
  onOpenTeamHistory: (slug: TeamSlug) => void;
}) {
  return (
    <RevealBlock scrollRoot={scrollRoot} className="w-full">
      <section
        className="relative min-h-[85dvh] w-full cursor-pointer overflow-hidden bg-black transition-opacity hover:opacity-[0.97] active:opacity-95"
        role="button"
        tabIndex={0}
        onClick={() => onOpenTeamHistory(row.teamSlug)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenTeamHistory(row.teamSlug);
          }
        }}
        aria-label={`Open ${row.name} car history`}
      >
        <img
          src={row.image}
          alt={`${row.name} Formula 1 car — race photo`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: 'center 42%' }}
          loading={index < 2 ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 mx-auto flex min-h-[85dvh] w-full max-w-6xl flex-col justify-end px-6 pb-14 pt-28 sm:px-10 sm:pb-20 lg:px-16 [text-shadow:0_1px_2px_rgba(0,0,0,0.5),0_4px_24px_rgba(0,0,0,0.65)]">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.38em] text-white/70"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            {row.name}
          </p>
          <h2
            className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.08]"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            {row.tagline}
          </h2>
          <p
            className="mt-4 max-w-xl text-[10px] leading-relaxed text-white/45"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            Tap for this team&apos;s cars {MIN_F1_DATA_YEAR}–{NEWEST_F1_DATA_YEAR}.
          </p>
        </div>
      </section>
    </RevealBlock>
  );
}

export function GenerationsPage() {
  const navigate = useNavigate();
  const { mainScrollRef } = useOutletContext<MainShellOutletContext>();
  const years = dataSeasonYearsDescending();
  const [year, setYear] = useState(() => defaultGenerationsYear(years));
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchFormulaOneSeasonSummary>>>(null);
  const yearHeaderRef = useRef<HTMLElement>(null);
  const [yearBarHeight, setYearBarHeight] = useState(96);

  useLayoutEffect(() => {
    const el = yearHeaderRef.current;
    if (!el) return;
    const measure = () => setYearBarHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [years.length]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSummary(null);
    void fetchFormulaOneSeasonSummary(year).then((s) => {
      if (!cancelled) {
        setSummary(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [year]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [year, mainScrollRef]);

  const eraNote = formulaOneGenerationNote(year);
  const teamRows = generationTeamShowcase(year);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col bg-black"
      style={{
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Year selector — fixed below shell nav */}
      <header
        ref={yearHeaderRef}
        className="fixed left-0 right-0 z-[90] border-b border-white/[0.1] bg-black/40 backdrop-blur-2xl backdrop-saturate-150"
        style={{
          top: `var(${APP_TOP_NAV_OFFSET_VAR})`,
          transition: 'top 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="flex items-center gap-2 px-2 pb-2 pt-2 sm:gap-3 sm:px-3">
          <div
            className="flex min-h-[40px] min-w-0 flex-1 flex-wrap items-center justify-evenly gap-x-0 gap-y-2 sm:gap-x-1"
            role="tablist"
            aria-label="Season year"
          >
            {years.map((y) => {
              const active = year === y;
              return (
                <button
                  key={y}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setYear(y)}
                  className={cn(
                    'min-w-[2.75rem] rounded-full px-2.5 py-2 text-center text-[11px] font-semibold tabular-nums transition-all duration-200 sm:min-w-[3.25rem] sm:px-3 sm:text-[12px]',
                    active ? 'text-white' : 'text-white/38 hover:text-white/70'
                  )}
                  style={{
                    fontFamily: 'var(--ios-font)',
                    background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
                    boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : undefined,
                  }}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div aria-hidden className="shrink-0" style={{ height: yearBarHeight }} />

        {/* Hero — Apple-style oversized year */}
        <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 pt-4">
          <RevealBlock scrollRoot={mainScrollRef} className="flex w-full max-w-4xl flex-col items-center text-center">
            <p
              className="text-[12px] font-medium uppercase tracking-[0.32em] text-white/38"
              style={{ fontFamily: 'var(--ios-font)' }}
            >
              Formula One World Championship
            </p>
            <h1
              className="mt-5 select-none text-center font-thin tracking-[-0.07em] text-white"
              style={{
                fontFamily: 'var(--ios-font)',
                fontSize: 'clamp(5rem, 19vw, 12.5rem)',
                lineHeight: 0.92,
              }}
            >
              {year}
            </h1>
            <p
              className="mt-10 max-w-md text-[17px] font-normal leading-[1.5] text-white/42"
              style={{ fontFamily: 'var(--ios-font)' }}
            >
              {teamRows
                ? 'Scroll to see how the grid looked — team by team, full frame.'
                : 'Season snapshot — regulations, liveries, and the story of the year.'}
            </p>
          </RevealBlock>

          <div
            className="pointer-events-none absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-white/22"
            aria-hidden
          >
            <span
              className="text-[10px] font-medium uppercase tracking-[0.28em]"
              style={{ fontFamily: 'var(--ios-font)' }}
            >
              Scroll
            </span>
            <div className="h-10 w-px bg-gradient-to-b from-white/35 to-transparent" />
          </div>
        </section>

        {/* Team gallery */}
        {teamRows?.map((row, i) => (
          <TeamStage
            key={`${year}-${row.name}`}
            row={row}
            index={i}
            scrollRoot={mainScrollRef}
            onOpenTeamHistory={(slug) => navigate(`/cars/team/${slug}`)}
          />
        ))}

        {/* Season detail — typography-led about (no thumbnail) */}
        <section
          className="border-t border-white/[0.06] bg-black"
          style={{ fontFamily: 'var(--ios-font)' }}
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-24 lg:px-14 lg:py-28">
            {loading && (
              <div className="flex justify-center py-16">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: F1_RED }}
                />
              </div>
            )}

            {!loading && !summary && (
              <RevealBlock scrollRoot={mainScrollRef}>
                <div className="w-full text-center">
                  <p className="text-[15px] font-normal leading-relaxed text-white/50 sm:text-[16px]">
                    No Wikipedia article found for this season. Try another year.
                  </p>
                  <p className="mx-auto mt-8 text-[14px] font-normal leading-relaxed text-white/35 sm:text-[15px]">
                    {eraNote}
                  </p>
                </div>
              </RevealBlock>
            )}

            {!loading && summary && (
              <RevealBlock scrollRoot={mainScrollRef}>
                <div className="w-full text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    About this season
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold leading-snug tracking-tight text-white sm:text-[26px] lg:text-[28px]">
                    {summary.title}
                  </h2>

                  <p className="mt-8 text-[14px] font-normal leading-relaxed text-white/42 sm:text-[15px]">
                    {eraNote}
                  </p>

                  <p className="mt-8 text-[13px] font-normal leading-[1.7] text-white/36 sm:text-[14px] sm:leading-[1.75]">
                    {summary.extract}
                  </p>

                  <a
                    href={`https://en.wikipedia.org/wiki/${summary.title.replace(/ /g, '_')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex text-[13px] font-medium transition-opacity hover:opacity-80 sm:text-[14px]"
                    style={{ color: 'var(--ios-blue)' }}
                  >
                    Read more on Wikipedia →
                  </a>
                </div>
              </RevealBlock>
            )}
          </div>
        </section>

        <div className="h-[max(32px,env(safe-area-inset-bottom))]" aria-hidden />
    </div>
  );
}
