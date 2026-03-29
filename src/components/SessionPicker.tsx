import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, CheckCircle2, Radio } from 'lucide-react';
import * as api from '@/api/openf1';
import type { Meeting, Session } from '@/types/openf1';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SessionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionKey: number | undefined;
  onSelect: (sessionKey: number) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].filter((y) => y >= 2023);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] flex flex-col sm:max-w-lg sm:mx-auto">
        <SheetHeader>
          <SheetTitle>Select Session</SheetTitle>
        </SheetHeader>

        {/* Year tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-border/60 shrink-0">
          {YEARS.map((y) => (
            <Button
              key={y}
              variant={year === y ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setYear(y)}
              className={year === y ? 'text-foreground' : ''}
            >
              {y}
            </Button>
          ))}
        </div>

        {/* Meeting list */}
        <ScrollArea className="flex-1">
          {meetingsLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-transparent border-t-accent animate-spin" />
            </div>
          )}
          {meetingsError && (
            <div className="text-center py-10 px-6 space-y-3">
              <p className="text-sm text-muted-foreground">{meetingsError}</p>
              <Button variant="ghost" size="sm" onClick={() => loadMeetings(year)}>
                Retry
              </Button>
            </div>
          )}
          {!meetingsLoading && !meetingsError && meetings.length === 0 && (
            <p className="text-center py-10 text-sm text-muted-foreground">
              No races found for {year}
            </p>
          )}

          {meetings.map((meeting, idx) => {
            const isExpanded = expandedKey === meeting.meeting_key;
            const sessions = sessionsByMeeting.get(meeting.meeting_key);
            const isLoadingSessions = sessionsLoading.has(meeting.meeting_key);

            return (
              <div key={meeting.meeting_key}>
                {idx > 0 && <Separator />}

                {/* Meeting row */}
                <button
                  type="button"
                  onClick={() => toggleMeeting(meeting.meeting_key)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-secondary/40 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                    R{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                      {meeting.meeting_name}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                      {meeting.location} · {meeting.country_name} · {formatDate(meeting.date_start)}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                {/* Expanded sessions */}
                {isExpanded && (
                  <div className="bg-secondary/20">
                    {isLoadingSessions && (
                      <div className="flex justify-center py-4">
                        <div className="h-5 w-5 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                      </div>
                    )}
                    {sessions?.length === 0 && !isLoadingSessions && (
                      <p className="text-center py-4 text-xs text-muted-foreground">
                        No session data available
                      </p>
                    )}
                    {sessions?.map((session, si) => {
                      const { label, variant } = sessionStyle(session);
                      const isCurrent = session.session_key === currentSessionKey;
                      const isLive = session.status === 'started';
                      return (
                        <div key={session.session_key}>
                          {si > 0 && <Separator className="ml-14" />}
                          <button
                            type="button"
                            onClick={() => { onSelect(session.session_key); onOpenChange(false); }}
                            className={cn(
                              'w-full flex items-center gap-3 px-5 py-3 text-left transition-colors',
                              isCurrent
                                ? 'bg-accent/10'
                                : 'hover:bg-secondary/40'
                            )}
                          >
                            <Badge variant={isLive ? 'live' : variant} className="w-10 justify-center shrink-0">
                              {isLive ? <Radio className="h-2.5 w-2.5" /> : label}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-foreground truncate">
                                {session.session_name}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {formatDate(session.date_start)}
                                {isLive && (
                                  <span className="ml-2 text-green-400 font-semibold">● Live now</span>
                                )}
                              </p>
                            </div>
                            {isCurrent && (
                              <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
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
      </SheetContent>
    </Sheet>
  );
}
