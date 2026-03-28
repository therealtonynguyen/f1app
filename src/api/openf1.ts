import type { Session, Driver, Location, Position, Interval, Lap, CarData } from '../types/openf1';

const BASE = 'https://api.openf1.org/v1';

export class OpenF1Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenF1Error';
  }
}

async function apiFetch<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();

  // OpenF1 returns { detail: "..." } for errors (e.g. live session auth restriction)
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
