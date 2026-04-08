/**
 * Jolpica Ergast API — season calendars & weekend structure for 2006–2022 (and fallback).
 * OpenF1 covers detailed telemetry from 2023+; Ergast fills historical race weekends.
 */
import type { Meeting, Session } from '@/types/openf1';
import { getCached, setCached, meetingsTTL } from '@/db/cache';
import {
  ergastMeetingKey,
  ergastSessionKey,
  parseErgastMeetingKey,
  parseErgastSessionKey,
} from '@/lib/ergastKeys';

const JOLPICA_SEASON = (year: number) => `https://api.jolpi.ca/ergast/f1/${year}.json`;

interface ErgastLocation {
  locality?: string;
  country?: string;
}

interface ErgastCircuit {
  circuitName?: string;
  Location?: ErgastLocation;
}

interface ErgastSessionDate {
  date?: string;
  time?: string;
}

interface ErgastRace {
  season: string;
  round: string;
  raceName: string;
  Circuit?: ErgastCircuit;
  date: string;
  time?: string;
  FirstPractice?: ErgastSessionDate;
  SecondPractice?: ErgastSessionDate;
  ThirdPractice?: ErgastSessionDate;
  Qualifying?: ErgastSessionDate;
  Sprint?: ErgastSessionDate;
  SprintQualifying?: ErgastSessionDate;
}

interface ErgastSeasonResponse {
  MRData?: {
    RaceTable?: {
      Races?: ErgastRace[];
    };
  };
}

function isoFromErgastDate(date?: string, time?: string): string {
  if (!date) return new Date(0).toISOString();
  const t = time?.trim();
  if (t) {
    try {
      return new Date(`${date}T${t}`).toISOString();
    } catch {
      return new Date(`${date}T12:00:00Z`).toISOString();
    }
  }
  return new Date(`${date}T12:00:00Z`).toISOString();
}

function circuitShort(name: string): string {
  return name
    .replace(/\s+International\s+Circuit/i, '')
    .replace(/\s+Circuit$/i, '')
    .trim()
    .slice(0, 40);
}

async function fetchErgastSeasonJson(year: number): Promise<ErgastRace[]> {
  const cacheKey = `ergast:season:${year}`;
  const cached = await getCached<ErgastRace[]>(cacheKey, meetingsTTL(year));
  if (cached) return cached;

  const res = await fetch(JOLPICA_SEASON(year));
  if (!res.ok) {
    throw new Error(`Ergast season ${year} failed (HTTP ${res.status}).`);
  }
  const json = (await res.json()) as ErgastSeasonResponse;
  const races = json.MRData?.RaceTable?.Races ?? [];
  await setCached(cacheKey, races);
  return races;
}

export async function fetchErgastMeetings(year: number): Promise<Meeting[]> {
  const races = await fetchErgastSeasonJson(year);
  const y = year;
  return races.map((r) => {
    const round = parseInt(r.round, 10) || 0;
    const loc = r.Circuit?.Location;
    const circuitName = r.Circuit?.circuitName ?? 'Circuit';
    const start =
      r.FirstPractice?.date ??
      r.SecondPractice?.date ??
      r.date;
    return {
      meeting_key: ergastMeetingKey(y, round),
      meeting_name: `Round ${round}`,
      meeting_official_name: r.raceName,
      circuit_short_name: circuitShort(circuitName),
      date_start: isoFromErgastDate(start, r.FirstPractice?.time),
      country_name: loc?.country ?? '—',
      location: loc?.locality ?? '—',
      year: y,
    } satisfies Meeting;
  });
}

type SlotDef = {
  slot: number;
  session_name: string;
  session_type: string;
  src?: ErgastSessionDate;
};

function sessionDefsFromRace(r: ErgastRace): SlotDef[] {
  const out: SlotDef[] = [
    { slot: 1, session_name: 'Practice 1', session_type: 'Practice', src: r.FirstPractice },
    { slot: 2, session_name: 'Practice 2', session_type: 'Practice', src: r.SecondPractice },
    { slot: 3, session_name: 'Practice 3', session_type: 'Practice', src: r.ThirdPractice },
    { slot: 4, session_name: 'Qualifying', session_type: 'Qualifying', src: r.Qualifying },
    { slot: 5, session_name: 'Sprint', session_type: 'Race', src: r.Sprint ?? r.SprintQualifying },
    { slot: 6, session_name: 'Race', session_type: 'Race', src: { date: r.date, time: r.time } },
  ];
  return out.filter((d) => d.src?.date);
}

export async function fetchErgastSessionsForMeeting(meetingKey: number): Promise<Session[]> {
  const parsed = parseErgastMeetingKey(meetingKey);
  if (!parsed) return [];

  const cacheKey = `sessions:ergast:${meetingKey}`;
  const cached = await getCached<Session[]>(cacheKey);
  if (cached) return cached;

  const races = await fetchErgastSeasonJson(parsed.year);
  const race = races.find((r) => parseInt(r.round, 10) === parsed.round);
  if (!race) {
    await setCached(cacheKey, []);
    return [];
  }

  const loc = race.Circuit?.Location;
  const circuitName = race.Circuit?.circuitName ?? 'Circuit';
  const locality = loc?.locality ?? '—';
  const country = loc?.country ?? '—';
  const year = parsed.year;

  const sessions: Session[] = sessionDefsFromRace(race).map((def) => ({
    session_key: ergastSessionKey(year, parsed.round, def.slot),
    session_name: def.session_name,
    session_type: def.session_type,
    status: 'finished',
    date_start: isoFromErgastDate(def.src!.date, def.src!.time),
    date_end: null,
    gmt_offset: '',
    location: locality,
    country_name: country,
    circuit_short_name: circuitShort(circuitName),
    circuit_key: 0,
    year,
  }));

  sessions.sort((a, b) => a.date_start.localeCompare(b.date_start));
  await setCached(cacheKey, sessions);
  return sessions;
}

export async function fetchErgastSessionByKey(sessionKey: number): Promise<Session | null> {
  const parsed = parseErgastSessionKey(sessionKey);
  if (!parsed) return null;

  const cacheKey = `session:ergast:${sessionKey}`;
  const cached = await getCached<Session>(cacheKey);
  if (cached) return cached;

  const list = await fetchErgastSessionsForMeeting(ergastMeetingKey(parsed.year, parsed.round));
  const session = list.find((s) => s.session_key === sessionKey) ?? null;
  if (session) await setCached(cacheKey, session);
  return session;
}
