/**
 * f1db.ts — Local IndexedDB database via Dexie.js
 *
 * WHY THIS EXISTS
 * ───────────────
 * OpenF1's free tier allows only 3 requests/second. Most of the data we use
 * (driver info, lap times, track outlines, circuit shapes) is historical and
 * never changes once a session ends. Without caching, the app re-downloads
 * the same data on every page load.
 *
 * This file sets up a local browser database (IndexedDB). Think of it like
 * localStorage but with much more space (~50 MB+) and the ability to store
 * structured data. Dexie.js is just a friendly wrapper around IndexedDB.
 *
 * HOW IT WORKS
 * ────────────
 * We use a single "cache" table. Every row has:
 *   key       — a string that identifies what's stored (e.g. "drivers:9999")
 *   value     — the actual data (JSON — anything from a number to a big array)
 *   cachedAt  — when we stored it (milliseconds since epoch)
 *
 * Before hitting the OpenF1 API, the app checks: "do we already have this?"
 *   YES → return it immediately (fast, no network, no rate-limit burn)
 *   NO  → fetch from OpenF1 → store here → return
 *
 * FUTURE: when you host this app, swap the Dexie calls in cache.ts for calls
 * to your own backend/database. The rest of the app doesn't need to change.
 */

import Dexie, { type Table } from 'dexie';

// Every row in the cache table has this shape
export interface CacheEntry {
  key: string;       // e.g. "drivers:9999" or "allLaps:9999"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;        // the stored data — typed by the callers in cache.ts
  cachedAt: number;  // Date.now() when it was stored
}

class F1Database extends Dexie {
  cache!: Table<CacheEntry, string>; // string = primary key type

  constructor() {
    super('F1AppDatabase'); // name shown in browser DevTools → Application → IndexedDB

    this.version(1).stores({
      // "key" is the primary key; "cachedAt" lets us query by age if needed
      cache: 'key, cachedAt',
    });
  }
}

// Single shared instance — imported everywhere that needs DB access
export const db = new F1Database();
