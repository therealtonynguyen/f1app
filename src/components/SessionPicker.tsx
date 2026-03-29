import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/openf1';
import type { Meeting, Session } from '../types/openf1';

interface SessionPickerProps {
  currentSessionKey: number | undefined;
  onSelect: (sessionKey: number) => void;
  onClose: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].filter((y) => y >= 2023);

// Map session_type / session_name to a short badge label
function sessionBadge(s: Session): { label: string; accent: string } {
  const t = s.session_type?.toLowerCase() ?? '';
  const n = s.session_name?.toLowerCase() ?? '';
  if (t === 'race' && !n.includes('sprint')) return { label: 'Race', accent: '#ff453a' };
  if (t === 'race' && n.includes('sprint')) return { label: 'Sprint', accent: '#ff9f0a' };
  if (t === 'qualifying' && !n.includes('sprint')) return { label: 'Quali', accent: '#0a84ff' };
  if (t === 'qualifying' && n.includes('sprint')) return { label: 'SQ', accent: '#bf5af2' };
  if (n.includes('practice 1') || n.includes('fp1')) return { label: 'FP1', accent: '#30d158' };
  if (n.includes('practice 2') || n.includes('fp2')) return { label: 'FP2', accent: '#30d158' };
  if (n.includes('practice 3') || n.includes('fp3')) return { label: 'FP3', accent: '#30d158' };
  return { label: s.session_name ?? t, accent: '#636366' };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function getRound(meetings: Meeting[], meeting: Meeting): number {
  return meetings.indexOf(meeting) + 1;
}

export function SessionPicker({ currentSessionKey, onSelect, onClose }: SessionPickerProps) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [expandedMeetingKey, setExpandedMeetingKey] = useState<number | null>(null);
  const [sessionsByMeeting, setSessionsByMeeting] = useState<Map<number, Session[]>>(new Map());
  const [sessionsLoading, setSessionsLoading] = useState<Set<number>>(new Set());

  const loadMeetings = useCallback(async (y: number) => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    setMeetings([]);
    setExpandedMeetingKey(null);
    try {
      const data = await api.fetchMeetings(y);
      setMeetings(data);
    } catch (err) {
      setMeetingsError(err instanceof Error ? err.message : 'Failed to load races');
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings(year);
  }, [year, loadMeetings]);

  const toggleMeeting = useCallback(
    async (meetingKey: number) => {
      if (expandedMeetingKey === meetingKey) {
        setExpandedMeetingKey(null);
        return;
      }
      setExpandedMeetingKey(meetingKey);
      if (sessionsByMeeting.has(meetingKey)) return;

      setSessionsLoading((prev) => new Set(prev).add(meetingKey));
      try {
        const sessions = await api.fetchSessionsForMeeting(meetingKey);
        setSessionsByMeeting((prev) => new Map(prev).set(meetingKey, sessions));
      } catch {
        setSessionsByMeeting((prev) => new Map(prev).set(meetingKey, []));
      } finally {
        setSessionsLoading((prev) => {
          const next = new Set(prev);
          next.delete(meetingKey);
          return next;
        });
      }
    },
    [expandedMeetingKey, sessionsByMeeting]
  );

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[2000] flex flex-col justify-end sm:justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Sheet */}
      <div
        className="w-full sm:w-[480px] sm:max-w-[95vw] flex flex-col rounded-t-[20px] sm:rounded-[20px] overflow-hidden"
        style={{
          background: 'var(--ios-grouped)',
          maxHeight: '88vh',
          border: '0.5px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '0.5px solid var(--ios-separator)' }}
        >
          <h2 className="text-[17px] font-semibold text-white">Select Race</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[15px] font-semibold transition-opacity active:opacity-60"
            style={{ background: 'var(--ios-fill)', color: 'var(--ios-label-secondary)' }}
          >
            ✕
          </button>
        </div>

        {/* Year tabs */}
        <div
          className="flex gap-2 px-4 py-3 shrink-0"
          style={{ borderBottom: '0.5px solid var(--ios-separator)' }}
        >
          {YEARS.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
              style={
                year === y
                  ? { background: 'var(--ios-blue)', color: '#fff' }
                  : { background: 'var(--ios-fill)', color: 'var(--ios-label-secondary)' }
              }
            >
              {y}
            </button>
          ))}
        </div>

        {/* Meetings list */}
        <div className="flex-1 overflow-y-auto">
          {meetingsLoading && (
            <div className="flex items-center justify-center py-16">
              <div
                className="w-7 h-7 rounded-full border-2 border-transparent animate-spin"
                style={{
                  borderTopColor: 'var(--ios-blue)',
                  borderRightColor: 'rgba(255,255,255,0.15)',
                }}
              />
            </div>
          )}

          {meetingsError && (
            <div className="text-center py-10 px-6">
              <p className="text-[13px]" style={{ color: 'var(--ios-label-secondary)' }}>
                {meetingsError}
              </p>
              <button
                type="button"
                onClick={() => loadMeetings(year)}
                className="mt-3 text-[13px] font-semibold"
                style={{ color: 'var(--ios-blue)' }}
              >
                Retry
              </button>
            </div>
          )}

          {!meetingsLoading && !meetingsError && meetings.length === 0 && (
            <div className="text-center py-10">
              <p className="text-[13px]" style={{ color: 'var(--ios-label-tertiary)' }}>
                No races found for {year}
              </p>
            </div>
          )}

          {meetings.map((meeting) => {
            const isExpanded = expandedMeetingKey === meeting.meeting_key;
            const sessions = sessionsByMeeting.get(meeting.meeting_key);
            const isLoadingSessions = sessionsLoading.has(meeting.meeting_key);
            const round = getRound(meetings, meeting);

            return (
              <div key={meeting.meeting_key}>
                {/* Meeting row */}
                <button
                  type="button"
                  onClick={() => toggleMeeting(meeting.meeting_key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:opacity-70"
                  style={{ borderBottom: '0.5px solid var(--ios-separator)' }}
                >
                  {/* Round badge */}
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: 'var(--ios-fill)', color: 'var(--ios-label-secondary)' }}
                  >
                    R{round}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white truncate">
                      {meeting.meeting_name}
                    </p>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--ios-label-secondary)' }}>
                      {meeting.location} · {meeting.country_name} · {formatDate(meeting.date_start)}
                    </p>
                  </div>

                  <span
                    className="text-[12px] font-medium shrink-0 transition-transform duration-200"
                    style={{
                      color: 'var(--ios-label-tertiary)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}
                  >
                    ▾
                  </span>
                </button>

                {/* Sessions list (expanded) */}
                {isExpanded && (
                  <div style={{ background: 'var(--ios-grouped-secondary)' }}>
                    {isLoadingSessions && (
                      <div className="flex items-center justify-center py-4">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
                          style={{
                            borderTopColor: 'var(--ios-blue)',
                            borderRightColor: 'rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>
                    )}
                    {sessions?.length === 0 && !isLoadingSessions && (
                      <p className="text-center py-4 text-[12px]" style={{ color: 'var(--ios-label-tertiary)' }}>
                        No session data available
                      </p>
                    )}
                    {sessions?.map((session) => {
                      const { label, accent } = sessionBadge(session);
                      const isCurrent = session.session_key === currentSessionKey;
                      return (
                        <button
                          key={session.session_key}
                          type="button"
                          onClick={() => {
                            onSelect(session.session_key);
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left transition-opacity active:opacity-60"
                          style={{ borderBottom: '0.5px solid var(--ios-separator)' }}
                        >
                          {/* Session type badge */}
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                            style={{ background: `${accent}22`, color: accent, minWidth: 36, textAlign: 'center' }}
                          >
                            {label}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-white truncate">
                              {session.session_name}
                            </p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--ios-label-tertiary)' }}>
                              {formatDate(session.date_start)}
                              {session.status && (
                                <span
                                  className="ml-2 font-semibold"
                                  style={{ color: session.status === 'started' ? 'var(--ios-green)' : 'var(--ios-label-tertiary)' }}
                                >
                                  {session.status === 'started' ? '● Live' : session.status}
                                </span>
                              )}
                            </p>
                          </div>

                          {isCurrent && (
                            <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--ios-blue)' }}>
                              ✓ Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
