/**
 * openf1.ts — OpenF1 API client
 *
 * CACHING STRATEGY
 * ────────────────
 * F1 data splits into two categories:
 *
 *   STATIC (cached locally forever)
 *     Meetings, sessions, drivers, lap times, track telemetry, replay data.
 *     Once a session ends this data never changes, so we store it in IndexedDB
 *     and skip the network on subsequent loads.
 *
 *   LIVE (never cached, always fresh)
 *     Current car positions, race intervals, live car telemetry.
 *     These change every few seconds during a session; caching them would show
 *     stale data on the map.
 *
 * See src/db/cache.ts for the get/set helpers and key naming convention.
 */

import type { Session, Meeting, Driver, Location, Position, Interval, Lap, CarData } from '../types/openf1';
import { RateLimiter } from '../lib/rateLimiter';
import { API_CONFIG } from '../config/api';
import { getCached, setCached, meetingsTTL } from '../db/cache';

function openF1Base(): string {
  const env = import.meta.env.VITE_OPENF1_BASE?.trim();
  if (env) return env.replace(/\/$/, '');
  if (import.meta.env.DEV) return '/api/openf1';
  return 'https://api.openf1.org/v1';
}

export class OpenF1Error extends Error {
  /** If true this is a retriable transient failure (rate limit / network blip). */
  readonly transient: boolean;

  constructor(message: string, transient = false) {
    super(message);
    this.name = 'OpenF1Error';
    this.transient = transient;
  }
}

// Shared rate limiter — keeps us under OpenF1's free-tier limit (3 req/s default)
const limiter = new RateLimiter(API_CONFIG.requestsPerSecond);

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Internal: fetch from OpenF1 with rate-limiting and exponential-backoff retry. */
async function apiFetch<T>(path: string, attempt = 0): Promise<T[]> {
  await limiter.acquire();

  const url = `${openF1Base()}${path}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    if (attempt < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryBaseDelayMs * 2 ** attempt;
      console.warn(`[OpenF1] Network error on attempt ${attempt + 1}, retrying in ${delay}ms…`, e);
      await sleep(delay);
      return apiFetch(path, attempt + 1);
    }
    const raw = e instanceof Error ? e.message : String(e);
    const hint =
      raw === 'Failed to fetch' || raw.includes('fetch')
        ? ' Check network, ad blockers, or run `npm run dev` (uses a local proxy).'
        : '';
    throw new OpenF1Error(`Network error: ${raw}.${hint}`, true);
  }

  if (res.status === 429) {
    if (attempt < API_CONFIG.maxRetries) {
      const delay = API_CONFIG.retryBaseDelayMs * 2 ** attempt;
      console.warn(`[OpenF1] Rate limited (429) on attempt ${attempt + 1}, retrying in ${delay}ms…`);
      await sleep(delay);
      return apiFetch(path, attempt + 1);
    }
    throw new OpenF1Error('Rate limit exceeded after retries. Skipping this request.', true);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new OpenF1Error(`OpenF1 returned a non-JSON body (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as { detail?: string }).detail)
        : undefined;
    throw new OpenF1Error(detail ?? `OpenF1 request failed (HTTP ${res.status}).`);
  }

  if (!Array.isArray(data)) {
    const detail = (data as { detail?: string }).detail;
    throw new OpenF1Error(detail ?? `Unexpected response from OpenF1 (${res.status})`);
  }

  return data as T[];
}

function msAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

// ─── LIVE (never cached) ──────────────────────────────────────────────────────

/** Always fetches fresh — used to find which session is currently active. */
export async function fetchLatestSession(): Promise<Session | null> {
  const data = await apiFetch<Session>('/sessions?session_key=latest');
  return data[0] ?? null;
}

/** Live driver positions (last 5 s during session, last 30 s for historical). */
export async function fetchLatestLocations(
  sessionKey: number,
  session: Session
): Promise<Location[]> {
  const now = new Date();
  const sessionEnd = session.date_end ? new Date(session.date_end) : null;
  if (!sessionEnd || now <= new Date(sessionEnd.getTime() + 30 * 60 * 1000)) {
    return apiFetch<Location>(`/location?session_key=${sessionKey}&date>${msAgo(5000)}`);
  }
  const windowStart = new Date(sessionEnd.getTime() - 30 * 1000).toISOString();
  return apiFetch<Location>(`/location?session_key=${sessionKey}&date>${windowStart}`);
}

/** Live race positions (polling). */
export async function fetchPositions(sessionKey: number, session: Session): Promise<Position[]> {
  const now = new Date();
  const sessionEnd = session.date_end ? new Date(session.date_end) : null;
  if (!sessionEnd || now <= new Date(sessionEnd.getTime() + 30 * 60 * 1000)) {
    return apiFetch<Position>(`/position?session_key=${sessionKey}&date>${msAgo(60 * 1000)}`);
  }
  const windowStart = new Date(sessionEnd.getTime() - 60 * 1000).toISOString();
  return apiFetch<Position>(`/position?session_key=${sessionKey}&date>${windowStart}`);
}

/** Live intervals / gaps (polling). */
export async function fetchIntervals(sessionKey: number, session: Session): Promise<Interval[]> {
  const now = new Date();
  const sessionEnd = session.date_end ? new Date(session.date_end) : null;
  if (!sessionEnd || now <= new Date(sessionEnd.getTime() + 30 * 60 * 1000)) {
    return apiFetch<Interval>(`/intervals?session_key=${sessionKey}&date>${msAgo(30 * 1000)}`);
  }
  const windowStart = new Date(sessionEnd.getTime() - 30 * 1000).toISOString();
  return apiFetch<Interval>(`/intervals?session_key=${sessionKey}&date>${windowStart}`);
}

/** Live car telemetry for the selected driver (polling). */
export async function fetchCarData(
  sessionKey: number,
  driverNumber: number,
  session: Session
): Promise<CarData[]> {
  const now = new Date();
  const sessionEnd = session.date_end ? new Date(session.date_end) : null;
  if (!sessionEnd || now <= new Date(sessionEnd.getTime() + 30 * 60 * 1000)) {
    return apiFetch<CarData>(
      `/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&date>${msAgo(5000)}`
    );
  }
  const windowStart = new Date(sessionEnd.getTime() - 10 * 1000).toISOString();
  return apiFetch<CarData>(
    `/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&date>${windowStart}`
  );
}

// ─── STATIC (cache-first) ─────────────────────────────────────────────────────

/** A single session by key — cached forever (sessions don't change). */
export async function fetchSessionByKey(sessionKey: number): Promise<Session | null> {
  const key = `session:${sessionKey}`;
  const cached = await getCached<Session>(key);
  if (cached) return cached;

  const data = await apiFetch<Session>(`/sessions?session_key=${sessionKey}`);
  const session = data[0] ?? null;
  if (session) await setCached(key, session);
  return session;
}

/**
 * All meetings (race rounds) for a year.
 * Current year: cached for 24 hours (new rounds get added mid-season).
 * Past years: cached forever (the calendar is complete and won't change).
 */
export async function fetchMeetings(year: number): Promise<Meeting[]> {
  const key = `meetings:${year}`;
  const cached = await getCached<Meeting[]>(key, meetingsTTL(year));
  if (cached) {
    console.log(`[cache] meetings:${year} — hit`);
    return cached;
  }

  console.log(`[cache] meetings:${year} — miss, fetching…`);
  const data = await apiFetch<Meeting>(`/meetings?year=${year}`);
  const sorted = data.sort((a, b) => a.date_start.localeCompare(b.date_start));
  await setCached(key, sorted);
  return sorted;
}

/** All sessions within one meeting — cached forever. */
export async function fetchSessionsForMeeting(meetingKey: number): Promise<Session[]> {
  const key = `sessions:${meetingKey}`;
  const cached = await getCached<Session[]>(key);
  if (cached) {
    console.log(`[cache] sessions:${meetingKey} — hit`);
    return cached;
  }

  console.log(`[cache] sessions:${meetingKey} — miss, fetching…`);
  const data = await apiFetch<Session>(`/sessions?meeting_key=${meetingKey}`);
  const sorted = data.sort((a, b) => a.date_start.localeCompare(b.date_start));
  await setCached(key, sorted);
  return sorted;
}

/** All drivers in a session — cached forever (roster doesn't change post-session). */
export async function fetchDrivers(sessionKey: number): Promise<Driver[]> {
  const key = `drivers:${sessionKey}`;
  const cached = await getCached<Driver[]>(key);
  if (cached) {
    console.log(`[cache] drivers:${sessionKey} — hit`);
    return cached;
  }

  console.log(`[cache] drivers:${sessionKey} — miss, fetching…`);
  const data = await apiFetch<Driver>(`/drivers?session_key=${sessionKey}`);
  if (data.length > 0) await setCached(key, data);
  return data;
}

/**
 * All laps for every driver in a session — cached forever.
 * This is the biggest single fetch (20 drivers × ~70 laps = ~1400 rows).
 * After the first load it's instant.
 */
export async function fetchAllLaps(sessionKey: number): Promise<Lap[]> {
  const key = `allLaps:${sessionKey}`;
  const cached = await getCached<Lap[]>(key);
  if (cached) {
    console.log(`[cache] allLaps:${sessionKey} — hit (${cached.length} laps)`);
    return cached;
  }

  console.log(`[cache] allLaps:${sessionKey} — miss, fetching…`);
  const data = await apiFetch<Lap>(`/laps?session_key=${sessionKey}`);
  if (data.length > 0) await setCached(key, data);
  return data;
}

/** One driver's laps — cached forever. */
export async function fetchLaps(sessionKey: number, driverNumber: number): Promise<Lap[]> {
  const key = `laps:${sessionKey}:${driverNumber}`;
  const cached = await getCached<Lap[]>(key);
  if (cached) return cached;

  const data = await apiFetch<Lap>(`/laps?session_key=${sessionKey}&driver_number=${driverNumber}`);
  if (data.length > 0) await setCached(key, data);
  return data;
}

/**
 * One clean representative lap for building the track outline.
 * Picks a mid-pack fast lap so the path covers the full circuit cleanly.
 * Cached forever per (session, driver).
 */
export async function fetchCleanTrackLap(
  sessionKey: number,
  driverNumber: number
): Promise<Location[]> {
  const key = `trackOutline:${sessionKey}:${driverNumber}`;
  const cached = await getCached<Location[]>(key);
  if (cached) {
    console.log(`[cache] trackOutline:${sessionKey}:${driverNumber} — hit (${cached.length} pts)`);
    return cached;
  }

  console.log(`[cache] trackOutline:${sessionKey}:${driverNumber} — miss, fetching…`);
  let locations: Location[];

  try {
    const laps = await apiFetch<Lap>(
      `/laps?session_key=${sessionKey}&driver_number=${driverNumber}`
    );
    const valid = laps
      .filter((l) => l.lap_duration != null && !l.is_pit_out_lap && l.lap_number > 2)
      .sort((a, b) => (a.lap_duration ?? 0) - (b.lap_duration ?? 0));

    if (valid.length > 0) {
      const lap = valid[Math.floor(valid.length * 0.25)];
      const dateEnd = new Date(
        new Date(lap.date_start).getTime() + (lap.lap_duration! + 2) * 1000
      ).toISOString();
      locations = await apiFetch<Location>(
        `/location?session_key=${sessionKey}&driver_number=${driverNumber}&date>${lap.date_start}&date<${dateEnd}`
      );
    } else {
      locations = await apiFetch<Location>(
        `/location?session_key=${sessionKey}&driver_number=${driverNumber}`
      );
    }
  } catch {
    locations = await apiFetch<Location>(
      `/location?session_key=${sessionKey}&driver_number=${driverNumber}`
    );
  }

  if (locations.length > 0) await setCached(key, locations);
  return locations;
}

/**
 * Telemetry for a specific time window — used by replay mode to animate
 * each driver's best lap. Cached forever (the lap already happened).
 */
export async function fetchLocationRange(
  sessionKey: number,
  driverNumber: number,
  dateStart: string,
  dateEnd: string
): Promise<Location[]> {
  const key = `locationRange:${sessionKey}:${driverNumber}:${dateStart}`;
  const cached = await getCached<Location[]>(key);
  if (cached) {
    console.log(`[cache] locationRange hit — ${cached.length} pts`);
    return cached;
  }

  const data = await apiFetch<Location>(
    `/location?session_key=${sessionKey}&driver_number=${driverNumber}&date>${dateStart}&date<${dateEnd}`
  );
  if (data.length > 0) await setCached(key, data);
  return data;
}

/**
 * Car telemetry for a replay lap window — cached forever.
 * (speed, throttle, brake, DRS, gear, RPM for each timestamp)
 */
export async function fetchCarDataRange(
  sessionKey: number,
  driverNumber: number,
  dateStart: string,
  dateEnd: string
): Promise<CarData[]> {
  const key = `carDataRange:${sessionKey}:${driverNumber}:${dateStart}`;
  const cached = await getCached<CarData[]>(key);
  if (cached) return cached;

  const data = await apiFetch<CarData>(
    `/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&date>${dateStart}&date<${dateEnd}`
  );
  if (data.length > 0) await setCached(key, data);
  return data;
}
