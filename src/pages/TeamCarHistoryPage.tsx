import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWikipediaPageSummary, type WikipediaPageSummary } from '@/lib/wikipediaSeasonSummary';
import { MIN_F1_DATA_YEAR } from '@/lib/f1DataYears';
import {
  TEAM_DISPLAY_NAME,
  TEAM_LOGO_URL,
  getChassisHistoryDescending,
  parseTeamSlugParam,
  type ChassisEntry,
  type TeamSlug,
} from '@/lib/teamCarHistory';

const F1_RED = '#e10600';

/** Dark-theme watermark: monochrome CDN marks are black → invert to light. Skip invert for full-colour PNG marks. */
function teamSymbolToneClass(slug: TeamSlug): string {
  if (
    slug === 'force-india' ||
    slug === 'alpine' ||
    slug === 'aston-martin' ||
    slug === 'ferrari'
  ) {
    return '';
  }
  return 'brightness-0 invert';
}

function RevealBlock({
  children,
  className,
  scrollRoot,
}: {
  children: React.ReactNode;
  className?: string;
  scrollRoot: RefObject<HTMLDivElement | null>;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const root = scrollRoot.current ?? undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
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
        'transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

function YearStage({
  entry,
  summary,
  scrollRoot,
  index,
}: {
  entry: ChassisEntry;
  summary: WikipediaPageSummary | null | undefined;
  scrollRoot: RefObject<HTMLDivElement | null>;
  index: number;
}) {
  const img = summary?.thumbnailUrl;
  return (
    <RevealBlock scrollRoot={scrollRoot} className="w-full">
      <section className="relative min-h-[78dvh] w-full overflow-hidden bg-black">
        {img ? (
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: 'center 40%' }}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(145deg, #1a1a1e 0%, #0a0a0c 100%)',
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.88) 90%, #000 100%)',
          }}
        />
        <div className="relative z-10 mx-auto flex min-h-[78dvh] w-full max-w-6xl flex-col justify-end px-6 pb-12 pt-24 sm:px-10 sm:pb-16 lg:px-16">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.38em] text-white/45"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            {entry.year}
          </p>
          <h2
            className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-tight"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            {entry.wikipediaTitle}
          </h2>
          {summary?.extract && (
            <p
              className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/40 sm:text-[14px]"
              style={{ fontFamily: 'var(--ios-font)' }}
            >
              {summary.extract.length > 220 ? `${summary.extract.slice(0, 217)}…` : summary.extract}
            </p>
          )}
          <a
            href={`https://en.wikipedia.org/wiki/${entry.wikipediaTitle.replace(/ /g, '_')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex text-[12px] font-medium transition-opacity hover:opacity-80 sm:text-[13px]"
            style={{ color: 'var(--ios-blue)', fontFamily: 'var(--ios-font)' }}
            onClick={(e) => e.stopPropagation()}
          >
            Wikipedia →
          </a>
          <p
            className="mt-4 text-[9px] leading-relaxed text-white/25"
            style={{ fontFamily: 'var(--ios-font)' }}
          >
            Lead image from Wikipedia article (Commons / fair use per Wikimedia).
          </p>
        </div>
      </section>
    </RevealBlock>
  );
}

export function TeamCarHistoryPage() {
  const navigate = useNavigate();
  const { teamSlug: teamSlugParam } = useParams<{ teamSlug: string }>();
  const slug = parseTeamSlugParam(teamSlugParam);

  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(88);

  const [byYear, setByYear] = useState<Map<number, WikipediaPageSummary | null>>(new Map());
  const [fetchDone, setFetchDone] = useState(false);

  const entries = useMemo(() => (slug ? getChassisHistoryDescending(slug) : []), [slug]);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderH(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!slug || entries.length === 0) {
      setByYear(new Map());
      setFetchDone(true);
      return;
    }

    let cancelled = false;
    setByYear(new Map());
    setFetchDone(false);

    async function load() {
      const batchSize = 4;
      for (let i = 0; i < entries.length; i += batchSize) {
        if (cancelled) return;
        const slice = entries.slice(i, i + batchSize);
        const results = await Promise.all(
          slice.map((e) => fetchWikipediaPageSummary(e.wikipediaTitle))
        );
        if (cancelled) return;
        setByYear((prev) => {
          const next = new Map(prev);
          slice.forEach((e, j) => next.set(e.year, results[j] ?? null));
          return next;
        });
        if (i + batchSize < entries.length) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      if (!cancelled) setFetchDone(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, entries]);

  const displayName = slug ? TEAM_DISPLAY_NAME[slug] : '';
  const endYear = new Date().getFullYear();
  const invalid = !slug;

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden bg-black"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      <header
        ref={headerRef}
        className="fixed left-0 right-0 top-0 z-40 border-b border-white/[0.08] bg-black/90 backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 px-3 pb-3 pt-[max(8px,env(safe-area-inset-top))] sm:px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] transition-colors hover:bg-white/14"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5 text-white/90" strokeWidth={2} />
          </button>
          <div className="relative min-h-[44px] min-w-0 flex-1 overflow-hidden">
            {!invalid && slug && (
              <img
                src={TEAM_LOGO_URL[slug]}
                alt=""
                className={cn(
                  'pointer-events-none absolute -right-1 top-1/2 max-h-[3.25rem] w-auto max-w-[min(200px,52%)] -translate-y-1/2 object-contain opacity-[0.14]',
                  teamSymbolToneClass(slug)
                )}
                aria-hidden
                decoding="async"
                referrerPolicy="no-referrer"
              />
            )}
            <p
              className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35"
              style={{ fontFamily: 'var(--ios-font)' }}
            >
              Car history
            </p>
            <p
              className="relative z-10 truncate text-[15px] font-semibold text-white sm:text-base"
              style={{ fontFamily: 'var(--ios-font)' }}
            >
              {invalid ? 'Team' : displayName}
            </p>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
        style={{ paddingTop: headerH }}
      >
        {invalid ? (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <p className="text-[15px] text-white/50" style={{ fontFamily: 'var(--ios-font)' }}>
              Unknown team. Go back and pick a car from Cars.
            </p>
            <button
              type="button"
              onClick={() => navigate('/cars')}
              className="mt-6 text-[14px] font-semibold"
              style={{ color: 'var(--ios-blue)', fontFamily: 'var(--ios-font)' }}
            >
              Open Cars
            </button>
          </div>
        ) : (
          <>
            <section
              className="relative flex min-h-[72dvh] flex-col items-center justify-center overflow-hidden px-6 pt-6"
              style={{ fontFamily: 'var(--ios-font)' }}
            >
              {slug && (
                <img
                  src={TEAM_LOGO_URL[slug]}
                  alt=""
                  className={cn(
                    'pointer-events-none absolute left-1/2 top-[40%] max-h-[min(38vh,320px)] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.13]',
                    teamSymbolToneClass(slug)
                  )}
                  aria-hidden
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/35">
                  Every generation
                </p>
                <h1
                  className="mt-4 max-w-3xl text-center font-thin tracking-tight text-white"
                  style={{ fontSize: 'clamp(2.25rem, 8vw, 3.75rem)', lineHeight: 1.05 }}
                >
                  {displayName}
                </h1>
                <p className="mt-6 max-w-md text-center text-[15px] font-normal leading-relaxed text-white/40">
                  {MIN_F1_DATA_YEAR}–{endYear} · one chassis per season (where the team competed). Tap any
                  year block to read more on Wikipedia.
                </p>
                {!fetchDone && (
                  <div className="mt-10 flex justify-center">
                    <div
                      className="h-7 w-7 animate-spin rounded-full border-2 border-transparent"
                      style={{ borderTopColor: F1_RED }}
                    />
                  </div>
                )}
              </div>
            </section>

            {entries.map((entry, index) => (
              <YearStage
                key={`${entry.year}-${entry.wikipediaTitle}`}
                entry={entry}
                summary={byYear.get(entry.year)}
                scrollRoot={scrollRef}
                index={index}
              />
            ))}

            <div className="h-[max(28px,env(safe-area-inset-bottom))]" aria-hidden />
          </>
        )}
      </div>
    </div>
  );
}
