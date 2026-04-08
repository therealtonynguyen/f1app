import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import * as api from '@/api/openf1';
import type { Meeting, Session } from '@/types/openf1';
import { fetchWikipediaThumbnailForMeeting } from '@/lib/wikipediaThumbnail';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { dataSeasonYearsDescending } from '@/lib/f1DataYears';

const FLAG_MAP: Record<string, string> = {
  Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  Australia: '🇦🇺',
  Japan: '🇯🇵',
  China: '🇨🇳',
  'United States': '🇺🇸',
  'United States of America': '🇺🇸',
  Italy: '🇮🇹',
  Monaco: '🇲🇨',
  Canada: '🇨🇦',
  Spain: '🇪🇸',
  Austria: '🇦🇹',
  'United Kingdom': '🇬🇧',
  Hungary: '🇭🇺',
  Belgium: '🇧🇪',
  Netherlands: '🇳🇱',
  Singapore: '🇸🇬',
  Mexico: '🇲🇽',
  Brazil: '🇧🇷',
  'United Arab Emirates': '🇦🇪',
  Azerbaijan: '🇦🇿',
  Qatar: '🇶🇦',
  'Las Vegas': '🇺🇸',
};

const F1_RED = '#e10600';

function countryFlag(countryName: string): string {
  return FLAG_MAP[countryName] ?? '🏁';
}

const CURRENT_YEAR = new Date().getFullYear();
const CALENDAR_YEARS = dataSeasonYearsDescending();

function formatWeekendLine(iso: string): string {
  try {
    const d = new Date(iso);
    return d
      .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
      .replace(/,/g, '');
  } catch {
    return '';
  }
}

function formatSessionRange(s: Session): string {
  try {
    const a = new Date(s.date_start);
    const opts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    const start = a.toLocaleString(undefined, opts);
    if (!s.date_end) return start;
    const b = new Date(s.date_end);
    if (a.toDateString() === b.toDateString()) {
      return `${start} – ${b.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    }
    return `${start} → ${b.toLocaleString(undefined, opts)}`;
  } catch {
    return s.date_start;
  }
}

function sessionKindLabel(s: Session): string {
  const t = s.session_type?.toLowerCase() ?? '';
  const n = s.session_name?.toLowerCase() ?? '';
  if (t === 'race' && !n.includes('sprint')) return 'Race';
  if (t === 'race' && n.includes('sprint')) return 'Sprint';
  if (t === 'qualifying' && n.includes('sprint')) return 'Sprint quali';
  if (t === 'qualifying') return 'Qualifying';
  if (t === 'practice') return 'Practice';
  return s.session_type || 'Session';
}

function sessionAccentClass(s: Session): string {
  const t = s.session_type?.toLowerCase() ?? '';
  if (t === 'race') return 'bg-[#e10600]/15 text-[#ff4d4d] border-[#e10600]/35';
  if (t === 'qualifying') return 'bg-violet-500/10 text-violet-300 border-violet-500/25';
  if (t === 'practice') return 'bg-white/[0.06] text-white/55 border-white/10';
  return 'bg-white/[0.04] text-white/45 border-white/10';
}

export function RaceCalendarPage() {
  const navigate = useNavigate();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<number | null>(null);
  const [sessionsByMeeting, setSessionsByMeeting] = useState<Map<number, Session[]>>(new Map());
  const [sessionsLoading, setSessionsLoading] = useState<Set<number>>(new Set());
  const [images, setImages] = useState<Map<number, string | null>>(new Map());

  const loadMeetings = useCallback(async (y: number) => {
    setLoading(true);
    setError(null);
    setMeetings([]);
    setExpandedKey(null);
    setSessionsByMeeting(new Map());
    setImages(new Map());
    try {
      setMeetings(await api.fetchMeetings(y));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings(year);
  }, [year, loadMeetings]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const toggleMeeting = useCallback(
    async (key: number) => {
      if (expandedKey === key) {
        setExpandedKey(null);
        return;
      }
      setExpandedKey(key);
      const meeting = meetings.find((m) => m.meeting_key === key);
      if (meeting) {
        void fetchWikipediaThumbnailForMeeting(meeting).then((url) => {
          setImages((p) => new Map(p).set(key, url));
        });
      }
      if (sessionsByMeeting.has(key)) return;
      setSessionsLoading((p) => new Set(p).add(key));
      try {
        const sessions = await api.fetchSessionsForMeeting(key);
        setSessionsByMeeting((p) => new Map(p).set(key, sessions));
      } catch {
        setSessionsByMeeting((p) => new Map(p).set(key, []));
      } finally {
        setSessionsLoading((p) => {
          const n = new Set(p);
          n.delete(key);
          return n;
        });
      }
    },
    [expandedKey, meetings, sessionsByMeeting]
  );

  useEffect(() => {
    if (meetings.length === 0) return;
    let cancelled = false;
    const timers: number[] = [];
    meetings.forEach((m, i) => {
      const t = window.setTimeout(() => {
        if (cancelled) return;
        void fetchWikipediaThumbnailForMeeting(m).then((url) => {
          if (cancelled) return;
          setImages((p) => (p.has(m.meeting_key) ? p : new Map(p).set(m.meeting_key, url)));
        });
      }, i * 120);
      timers.push(t);
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [meetings]);

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #121214 0%, #0a0a0c 100%)',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="h-0.5 w-full shrink-0" style={{ background: F1_RED }} aria-hidden />

      <header className="flex shrink-0 items-center px-3 pb-2 pt-3 sm:px-5 sm:pb-2 sm:pt-4">
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40"
            style={{ fontFamily: 'var(--f1-wordmark-font, system-ui)' }}
          >
            Schedule
          </p>
          <h1
            className="truncate text-[1.35rem] font-bold leading-tight tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: 'var(--f1-wordmark-font, system-ui)' }}
          >
            {year} Season
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg shrink-0 px-3 pb-3 sm:max-w-2xl sm:px-5">
        <div
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
          role="tablist"
          aria-label="Season year"
        >
          {CALENDAR_YEARS.map((y) => {
            const active = year === y;
            return (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setYear(y)}
                className={cn(
                  'shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-all sm:px-4 sm:text-[13px]',
                  active ? 'text-white shadow-sm' : 'text-white/45 hover:text-white/75'
                )}
                style={
                  active
                    ? { background: F1_RED, boxShadow: '0 2px 8px rgba(225,6,0,0.35)' }
                    : { background: 'rgba(255,255,255,0.06)' }
                }
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-lg pb-[max(16px,env(safe-area-inset-bottom))] sm:max-w-2xl">
          <div className="pb-2">
            {loading && (
              <div className="flex justify-center py-20">
                <div
                  className="h-7 w-7 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: F1_RED }}
                />
              </div>
            )}
            {error && (
              <div className="space-y-3 px-5 py-12 text-center">
                <p className="text-sm text-white/55">{error}</p>
                <button
                  type="button"
                  onClick={() => loadMeetings(year)}
                  className="text-[13px] font-semibold uppercase tracking-wide"
                  style={{ color: F1_RED }}
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && meetings.length === 0 && (
              <p className="py-12 text-center text-sm text-white/40">No races for {year}</p>
            )}

            {!loading &&
              !error &&
              meetings.map((meeting, idx) => {
                const expanded = expandedKey === meeting.meeting_key;
                const sessions = sessionsByMeeting.get(meeting.meeting_key);
                const sessLoading = sessionsLoading.has(meeting.meeting_key);
                const imgUrl = images.get(meeting.meeting_key);
                const roundNum = idx + 1;
                const sortedSessions = sessions
                  ? [...sessions].sort((a, b) => a.date_start.localeCompare(b.date_start))
                  : [];

                return (
                  <div
                    key={meeting.meeting_key}
                    className="border-b border-white/[0.06] last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleMeeting(meeting.meeting_key)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors sm:gap-3.5 sm:px-5',
                        expanded ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
                      )}
                    >
                      <div className="w-10 shrink-0 text-center sm:w-11">
                        <div className="text-[8px] font-bold uppercase leading-none tracking-[0.14em] text-white/35">
                          Rnd
                        </div>
                        <div
                          className="mt-0.5 text-[1.35rem] font-bold leading-none tabular-nums text-white sm:text-2xl"
                          style={{ fontFamily: 'var(--f1-wordmark-font, system-ui)' }}
                        >
                          {roundNum}
                        </div>
                      </div>

                      <div
                        className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-md sm:h-14 sm:w-14"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                        }}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span
                            className="flex h-full w-full items-center justify-center text-2xl"
                            aria-hidden
                          >
                            {countryFlag(meeting.country_name)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white sm:text-[15px]">
                          {meeting.meeting_official_name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-white/45 sm:text-xs">
                          {meeting.circuit_short_name} · {meeting.location}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-white/40 sm:hidden">
                          {formatWeekendLine(meeting.date_start)}
                        </p>
                      </div>

                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                          Weekend
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium tabular-nums text-white/65">
                          {formatWeekendLine(meeting.date_start)}
                        </p>
                      </div>

                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0 text-white/25 transition-transform duration-200',
                          expanded && 'rotate-90'
                        )}
                      />
                    </button>

                    {expanded && (
                      <div
                        className="border-t border-white/[0.06] px-4 pb-4 pt-1 sm:px-5"
                        style={{ background: 'rgba(0,0,0,0.35)' }}
                      >
                        {imgUrl && (
                          <div className="relative mt-2 overflow-hidden rounded-lg">
                            <div
                              className="pointer-events-none absolute inset-0 z-[1]"
                              style={{
                                background:
                                  'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)',
                              }}
                            />
                            <div className="aspect-[2.1/1] max-h-[200px] w-full sm:max-h-[240px]">
                              <img
                                src={imgUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 z-[2] p-3 pt-8">
                              <p className="text-[15px] font-bold leading-tight text-white">
                                {meeting.meeting_official_name}
                              </p>
                              <p className="mt-0.5 text-xs text-white/60">
                                {meeting.circuit_short_name} · {meeting.location},{' '}
                                {meeting.country_name}
                              </p>
                            </div>
                          </div>
                        )}

                        {!imgUrl && (
                          <div className="mt-3 space-y-1">
                            <p className="text-[15px] font-bold text-white">
                              {meeting.meeting_official_name}
                            </p>
                            <p className="text-xs text-white/55">
                              {meeting.circuit_short_name} · {meeting.location},{' '}
                              {meeting.country_name}
                            </p>
                          </div>
                        )}

                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                          Session schedule
                        </p>

                        {sessLoading && (
                          <div className="flex justify-center py-6">
                            <div
                              className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
                              style={{ borderTopColor: F1_RED }}
                            />
                          </div>
                        )}
                        {!sessLoading && sortedSessions.length === 0 && (
                          <p className="py-4 text-center text-xs text-white/40">
                            No session times available.
                          </p>
                        )}
                        {!sessLoading && sortedSessions.length > 0 && (
                          <ul className="mt-1 divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-white/[0.02]">
                            {sortedSessions.map((s) => (
                              <li key={s.session_key} className="px-3 py-2.5 sm:px-3.5 sm:py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-white">
                                      {s.session_name}
                                    </p>
                                    <span
                                      className={cn(
                                        'mt-1 inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                        sessionAccentClass(s)
                                      )}
                                    >
                                      {sessionKindLabel(s)}
                                      {s.status ? ` · ${s.status}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-2 text-[11px] leading-relaxed text-white/50">
                                  {formatSessionRange(s)}
                                </p>
                                <p className="mt-1 text-[10px] text-white/35">
                                  {s.gmt_offset ? `${s.gmt_offset} · ` : ''}
                                  {s.location}, {s.country_name}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
