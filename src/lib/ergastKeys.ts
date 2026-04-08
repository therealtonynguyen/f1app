/** Negative OpenF1 keys: Ergast-derived meetings & sessions (no OpenF1 telemetry — API is 2023+). */

export function ergastMeetingKey(year: number, round: number): number {
  return -(year * 10000 + round);
}

export function parseErgastMeetingKey(key: number): { year: number; round: number } | null {
  if (key >= 0) return null;
  const n = -key;
  return { year: Math.floor(n / 10000), round: n % 10000 };
}

/** slot: 1=FP1 … 4=Q, 5=Sprint, 6=Race */
export function ergastSessionKey(year: number, round: number, slot: number): number {
  return -(year * 10000000 + round * 1000 + slot);
}

export function parseErgastSessionKey(key: number): { year: number; round: number; slot: number } | null {
  if (key >= 0) return null;
  const n = -key;
  const year = Math.floor(n / 10000000);
  const rem = n % 10000000;
  const round = Math.floor(rem / 1000);
  const slot = rem % 1000;
  return { year, round, slot };
}

export function isErgastSessionKey(sessionKey: number): boolean {
  return sessionKey < 0;
}
