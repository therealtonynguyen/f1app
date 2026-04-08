import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronDown, CheckCircle2, Radio } from 'lucide-react';
import * as api from '@/api/openf1';
import type { Meeting, Session } from '@/types/openf1';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { dataSeasonYearsDescending } from '@/lib/f1DataYears';

interface SessionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionKey: number | undefined;
  onSelect: (sessionKey: number) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const DATA_SEASON_YEARS = dataSeasonYearsDescending();

type SessionStyle = { label: string; variant: 'default' | 'accent' | 'muted' | 'live' | 'ghost' };

function sessionStyle(s: Session): SessionStyle {
  const t = s.session_type?.toLowerCase() ?? '';
  const n = s.session_name?.toLowerCase() ?? '';
  if (t === 'race' && !n.includes('sprint')) return { label: 'Race',   variant: 'default' };
  if (n.includes('sprint') && t === 'race')  return { label: 'Sprint', variant: 'default' };
  if (t === 'qualifying' && !n.includes('sprint')) return { label: 'Quali', variant: 'accent' };
  if (n.includes('sprint'))                        return { label: 'SQ',    variant: 'accent' };
  if (n.includes('1'))  return { label: 'FP1', variant: 'muted' };
  if (n.includes('2'))  return { label: 'FP2', variant: 'muted' };
  if (n.includes('3'))  return { label: 'FP3', variant: 'muted' };
  return { label: s.session_name ?? t, variant: 'ghost' };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export function SessionPicker({ open, onOpenChange, currentSessionKey, onSelect }: SessionPickerProps) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<number | null>(null);
  const [sessionsByMeeting, setSessionsByMeeting] = useState<Map<number, Session[]>>(new Map());
  const [sessionsLoading, setSessionsLoading] = useState<Set<number>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const loadMeetings = useCallback(async (y: number) => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    setMeetings([]);
    setExpandedKey(null);
    try {
      setMeetings(await api.fetchMeetings(y));
    } catch (err) {
      setMeetingsError(err instanceof Error ? err.message : 'Failed to load races');
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => { if (open) loadMeetings(year); }, [open, year, loadMeetings]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const toggleMeeting = useCallback(async (key: number) => {
    if (expandedKey === key) { setExpandedKey(null); return; }
    setExpandedKey(key);
    if (sessionsByMeeting.has(key)) return;
    setSessionsLoading((p) => new Set(p).add(key));
    try {
      const sessions = await api.fetchSessionsForMeeting(key);
      setSessionsByMeeting((p) => new Map(p).set(key, sessions));
    } catch {
      setSessionsByMeeting((p) => new Map(p).set(key, []));
    } finally {
      setSessionsLoading((p) => { const n = new Set(p); n.delete(key); return n; });
    }
  }, [expandedKey, sessionsByMeeting]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      {/* Panel */}
      <div
        ref={panelRef}
        className="relative flex flex-col w-full max-w-[480px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--ios-grouped)',
          border: '0.5px solid var(--ios-separator)',
          maxHeight: 'min(88vh, 680px)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Select session"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '0.5px solid var(--ios-separator)' }}
        >
          <h2
            className="text-[17px] font-semibold"
            style={{ color: 'var(--ios-label)' }}
          >
            Select Session
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-70"
            style={{ background: 'var(--ios-fill)' }}
            aria-label="Close"
          >
            <X className="h-4 w-4" style={{ color: 'var(--ios-label)' }} />
          </button>
        </div>

        {/* Year selector — 2006 through current (horizontal scroll) */}
        <div className="shrink-0" style={{ borderBottom: '0.5px solid var(--ios-separator)' }}>
          <div
            className="flex gap-2 overflow-x-auto px-5 py-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
            role="tablist"
            aria-label="Season year"
          >
            {DATA_SEASON_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={year === y}
                onClick={() => setYear(y)}
                className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-colors sm:px-5"
                style={
                  year === y
                    ? { background: '#e10600', color: '#fff' }
                    : { background: 'var(--ios-fill)', color: 'var(--ios-label-secondary)' }
                }
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting list */}
        <ScrollArea className="flex-1 min-h-0">
          {meetingsLoading && (
            <div className="flex items-center justify-center py-16">
              <div
                className="h-6 w-6 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: 'var(--ios-blue)' }}
              />
            </div>
          )}
          {meetingsError && (
            <div className="text-center py-10 px-6 space-y-3">
              <p className="text-sm" style={{ color: 'var(--ios-label-secondary)' }}>
                {meetingsError}
              </p>
              <button
                type="button"
                onClick={() => loadMeetings(year)}
                className="text-[13px] font-medium"
                style={{ color: 'var(--ios-blue)' }}
              >
                Retry
              </button>
            </div>
          )}
          {!meetingsLoading && !meetingsError && meetings.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--ios-label-tertiary)' }}>
              No races found for {year}
            </p>
          )}

          {meetings.map((meeting, idx) => {
            const isExpanded = expandedKey === meeting.meeting_key;
            const sessions = sessionsByMeeting.get(meeting.meeting_key);
            const isLoadingSessions = sessionsLoading.has(meeting.meeting_key);

            return (
              <div key={meeting.meeting_key}>
                {idx > 0 && (
                  <div style={{ height: '0.5px', background: 'var(--ios-separator)', marginLeft: 56 }} />
                )}

                {/* Meeting row */}
                <button
                  type="button"
                  onClick={() => toggleMeeting(meeting.meeting_key)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                  style={{ background: isExpanded ? 'var(--ios-grouped-secondary)' : 'transparent' }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'var(--ios-fill)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isExpanded
                      ? 'var(--ios-grouped-secondary)'
                      : 'transparent';
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      background: 'var(--ios-grouped-tertiary)',
                      color: 'var(--ios-label-tertiary)',
                    }}
                  >
                    R{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ios-label)' }}>
                      {meeting.meeting_name}
                    </p>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--ios-label-secondary)' }}>
                      {meeting.location} · {meeting.country_name} · {formatDate(meeting.date_start)}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                    style={{ color: 'var(--ios-label-tertiary)' }}
                  />
                </button>

                {/* Sessions sub-list */}
                {isExpanded && (
                  <div style={{ background: 'var(--ios-grouped-secondary)' }}>
                    {isLoadingSessions && (
                      <div className="flex justify-center py-4">
                        <div
                          className="h-4 w-4 rounded-full border-2 border-transparent animate-spin"
                          style={{ borderTopColor: 'var(--ios-blue)' }}
                        />
                      </div>
                    )}
                    {sessions?.length === 0 && !isLoadingSessions && (
                      <p className="text-center py-4 text-xs" style={{ color: 'var(--ios-label-tertiary)' }}>
                        No session data available
                      </p>
                    )}
                    {sessions?.map((session, si) => {
                      const { label, variant } = sessionStyle(session);
                      const isCurrent = session.session_key === currentSessionKey;
                      const isLive = session.status === 'started';
                      return (
                        <div key={session.session_key}>
                          {si > 0 && (
                            <div style={{ height: '0.5px', background: 'var(--ios-separator)', marginLeft: 56 }} />
                          )}
                          <button
                            type="button"
                            onClick={() => { onSelect(session.session_key); onOpenChange(false); }}
                            className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                            style={{ background: isCurrent ? 'rgba(10,132,255,0.1)' : 'transparent' }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'var(--ios-fill)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = isCurrent
                                ? 'rgba(10,132,255,0.1)'
                                : 'transparent';
                            }}
                          >
                            <Badge
                              variant={isLive ? 'live' : variant}
                              className="w-10 justify-center shrink-0"
                            >
                              {isLive ? <Radio className="h-2.5 w-2.5" /> : label}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--ios-label)' }}>
                                {session.session_name}
                              </p>
                              <p className="text-[11px] mt-0.5" style={{ color: 'var(--ios-label-secondary)' }}>
                                {formatDate(session.date_start)}
                                {isLive && (
                                  <span className="ml-2 font-semibold" style={{ color: 'var(--ios-green)' }}>
                                    ● Live now
                                  </span>
                                )}
                              </p>
                            </div>
                            {isCurrent && (
                              <CheckCircle2
                                className="h-4 w-4 shrink-0"
                                style={{ color: 'var(--ios-blue)' }}
                              />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </ScrollArea>
      </div>
    </div>
  );
}
