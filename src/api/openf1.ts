import type { Session, Meeting, Driver, Location, Position, Interval, Lap, CarData } from '../types/openf1';

/**
 * Production: call OpenF1 directly. Dev: same-origin `/api/openf1` (Vite proxy) avoids some CORS/network quirks.
 * Override with `VITE_OPENF1_BASE` (e.g. your own proxy URL) if the API is blocked on your network.
 */
function openF1Base(): string {
  const env = import.meta.env.VITE_OPENF1_BASE?.trim();
  if (env) return env.replace(/\/$/, '');
  if (import.meta.env.DEV) return '/api/openf1';
  return 'https://api.openf1.org/v1';
}

export class OpenF1Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenF1Error';
  }
}

async function apiFetch<T>(path: string): Promise<T[]> {
  const url = `${openF1Base()}${path}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const hint =
      raw === 'Failed to fetch' || raw.includes('fetch')
        ? ' The browser could not reach the API. Try: different network or VPN off, disable ad blockers for this app, allow api.openf1.org in firewall, or run `npm run dev` (uses a local proxy).'
        : '';
    throw new OpenF1Error(`Network error: ${raw}.${hint}`);
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

  // OpenF1 returns { detail: "..." } for some errors (e.g. live session auth restriction)
  if (!Array.isArray(data)) {
    const detail = (data as { detail?: string }).detail;
    throw new OpenF1Error(detail ?? `Unexpected response from OpenF1 (${res.status})`);
  }

  return data as T[];
}

function msAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

export async function fetchLatestSession(): Promise<Session | null> {
  const data = await apiFetch<Session>('/sessions?session_key=latest');
  return data[0] ?? null;
}

export async function fetchSessionByKey(sessionKey: number): Promise<Session | null> {
  const data = await apiFetch<Session>(`/sessions?session_key=${sessionKey}`);
  return data[0] ?? null;
}

export async function fetchMeetings(year: number): Promise<Meeting[]> {
  const data = await apiFetch<Meeting>(`/meetings?year=${year}`);
  return data.sort((a, b) => a.date_start.localeCompare(b.date_start));
}

export async function fetchSessionsForMeeting(meetingKey: number): Promise<Session[]> {
  const data = await apiFetch<Session>(`/sessions?meeting_key=${meetingKey}`);
  // Sort by date so Practice 1 → Practice 2 → Qualifying → Race order
  return data.sort((a, b) => a.date_start.localeCompare(b.date_start));
}

export async function fetchDrivers(sessionKey: number): Promise<Driver[]> {
  return apiFetch<Driver>(`/drivers?session_key=${sessionKey}`);
}

// Fetch location data for one clean representative lap to build the track outline.
// Falls back to full session data if no lap info is available.
export async function fetchCleanTrackLap(
  sessionKey: number,
  driverNumber: number
): Promise<Location[]> {
  try {
    const laps = await apiFetch<Lap>(
      `/laps?session_key=${sessionKey}&driver_number=${driverNumber}`
    );
    const valid = laps
      .filter((l) => l.lap_duration != null && !l.is_pit_out_lap && l.lap_number > 2)
      .sort((a, b) => (a.lap_duration ?? 0) - (b.lap_duration ?? 0));

    if (valid.length > 0) {
      // Pick the 25th-percentile lap: fast but not an outlier hotlap
      const lap = valid[Math.floor(valid.length * 0.25)];
      const dateEnd = new Date(
        new Date(lap.date_start).getTime() + (lap.lap_duration! + 2) * 1000
      ).toISOString();
      return apiFetch<Location>(
        `/location?session_key=${sessionKey}&driver_number=${driverNumber}&date>${lap.date_start}&date<${dateEnd}`
      );
    }
  } catch {
    // fall through
  }
  // Fallback: all session location data for this driver
  return apiFetch<Location>(
    `/location?session_key=${sessionKey}&driver_number=${driverNumber}`
  );
}

// Fetch latest positions for all drivers — uses session timing to handle historical data
export async function fetchLatestLocations(
  sessionKey: number,
  session: Session
): Promise<Location[]> {
  const now = new Date();
  const sessionEnd = session.date_end ? new Date(session.date_end) : null;

  if (!sessionEnd || now <= new Date(sessionEnd.getTime() + 30 * 60 * 1000)) {
    // Live session: get data from the last 5 seconds
    return apiFetch<Location>(
      `/location?session_key=${sessionKey}&date>${msAgo(5000)}`
    );
  }

  // Historical session: get last 30 seconds of the session
  const windowStart = new Date(sessionEnd.getTime() - 30 * 1000).toISOString();
  return apiFetch<Location>(
    `/location?session_key=${sessionKey}&date>${windowStart}`
  );
}

export async function fetchPositions(
  sessionKey: number,
  session: Session
): Promise<Position[]> {
  const now = new Date();
  const sessionEnd = session.date_end ? new Date(session.date_end) : null;

  if (!sessionEnd || now <= new Date(sessionEnd.getTime() + 30 * 60 * 1000)) {
    return apiFetch<Position>(
      `/position?session_key=${sessionKey}&date>${msAgo(60 * 1000)}`
    );
  }

  const windowStart = new Date(sessionEnd.getTime() - 60 * 1000).toISOString();
  return apiFetch<Position>(
    `/position?session_key=${sessionKey}&date>${windowStart}`
  );
}

export async function fetchIntervals(
  sessionKey: number,
  session: Session
): Promise<Interval[]> {
  const now = new Date();
  const sessionEnd = session.date_end ? new Date(session.date_end) : null;

  if (!sessionEnd || now <= new Date(sessionEnd.getTime() + 30 * 60 * 1000)) {
    return apiFetch<Interval>(
      `/intervals?session_key=${sessionKey}&date>${msAgo(30 * 1000)}`
    );
  }

  const windowStart = new Date(sessionEnd.getTime() - 30 * 1000).toISOString();
  return apiFetch<Interval>(
    `/intervals?session_key=${sessionKey}&date>${windowStart}`
  );
}

export async function fetchLaps(sessionKey: number, driverNumber: number): Promise<Lap[]> {
  return apiFetch<Lap>(
    `/laps?session_key=${sessionKey}&driver_number=${driverNumber}`
  );
}

// All laps for every driver in a session (used by replay mode)
export async function fetchAllLaps(sessionKey: number): Promise<Lap[]> {
  return apiFetch<Lap>(`/laps?session_key=${sessionKey}`);
}

// Location data for a specific driver within a time window (used by replay mode)
export async function fetchLocationRange(
  sessionKey: number,
  driverNumber: number,
  dateStart: string,
  dateEnd: string
): Promise<Location[]> {
  return apiFetch<Location>(
    `/location?session_key=${sessionKey}&driver_number=${driverNumber}&date>${dateStart}&date<${dateEnd}`
  );
}

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

/** Car telemetry samples for a lap window (replay / sync with location). */
export async function fetchCarDataRange(
  sessionKey: number,
  driverNumber: number,
  dateStart: string,
  dateEnd: string
): Promise<CarData[]> {
  return apiFetch<CarData>(
    `/car_data?session_key=${sessionKey}&driver_number=${driverNumber}&date>${dateStart}&date<${dateEnd}`
  );
}
