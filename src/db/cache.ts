/**
 * cache.ts — Cache helpers used by the API layer
 *
 * USAGE (in any API function)
 * ───────────────────────────
 *   // 1. Try the cache first
 *   const cached = await getCached<Meeting[]>('meetings:2024');
 *   if (cached) return cached;
 *
 *   // 2. Cache miss → fetch from the real API
 *   const data = await apiFetch<Meeting>('/meetings?year=2024');
 *
 *   // 3. Store it so next time we skip the network call
 *   await setCached('meetings:2024', data);
 *   return data;
 *
 * TTL (time-to-live)
 * ──────────────────
 * Most F1 data is immutable once a session ends — once you have it, it never
 * changes. The only exception is the *list of meetings for the current year*,
 * because new races get added during the season. We give that a 24-hour TTL.
 * Everything else is stored indefinitely.
 *
 * KEY NAMING CONVENTION
 * ─────────────────────
 *   meetings:<year>               list of rounds for a season
 *   sessions:<meetingKey>         sessions within one meeting
 *   session:<sessionKey>          a single session object
 *   drivers:<sessionKey>          all drivers in a session
 *   allLaps:<sessionKey>          all laps for every driver in a session
 *   trackOutline:<sessionKey>:<driverNumber>   one driver's lap for track shape
 *   locationRange:<sessionKey>:<driverNumber>:<dateStart>   replay telemetry
 *   carDataRange:<sessionKey>:<driverNumber>:<dateStart>    replay car data
 *   geoJSON                       bacinger f1-circuits GeoJSON (whole file)
 *   circuitMeta:<year>            Jolpica circuit list for a year
 */

import { db } from './f1db';

// 24 hours in milliseconds — only used for the current-year meetings list
const TTL_24H = 24 * 60 * 60 * 1000;

/**
 * Look up a value in the local database.
 * Returns null if not found or if it's expired.
 */
export async function getCached<T>(
  key: string,
  ttlMs?: number  // if provided, return null when data is older than ttlMs
): Promise<T | null> {
  try {
    const row = await db.cache.get(key);
    if (!row) return null;
    if (ttlMs && Date.now() - row.cachedAt > ttlMs) return null;
    return row.value as T;
  } catch (err) {
    // If IndexedDB is unavailable (private browsing, storage full) just skip
    console.warn('[cache] read error', key, err);
    return null;
  }
}

/**
 * Store a value in the local database.
 * Silently ignores errors (e.g. storage quota exceeded in private browsing).
 */
export async function setCached<T>(key: string, value: T): Promise<void> {
  try {
    await db.cache.put({ key, value, cachedAt: Date.now() });
  } catch (err) {
    console.warn('[cache] write error', key, err);
  }
}

/**
 * Remove a single entry — useful if you know data has gone stale.
 */
export async function bustCache(key: string): Promise<void> {
  try {
    await db.cache.delete(key);
  } catch { /* ignore */ }
}

/**
 * Wipe the entire cache — exposed in DevTools via window.__f1ClearCache()
 * so developers can reset state without clearing all of IndexedDB manually.
 */
export async function clearAllCache(): Promise<void> {
  await db.cache.clear();
  console.log('[cache] cleared');
}

// Make it easy to clear from the browser console during development
if (typeof window !== 'undefined') {
  (window as Window & { __f1ClearCache?: () => Promise<void> }).__f1ClearCache = clearAllCache;
}

// Convenience: only meetings for the current year need a TTL.
// Past years are complete, so their data never changes.
export function meetingsTTL(year: number): number | undefined {
  return year === new Date().getFullYear() ? TTL_24H : undefined;
}
