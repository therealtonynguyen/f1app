import { useState, useEffect } from 'react';
import type { Session } from '../types/openf1';
import { getCached, setCached } from '../db/cache';

export interface CircuitMeta {
  circuitId: string;
  circuitName: string;
  lat: number;
  lng: number;
  locality: string;
  country: string;
  url: string;
}

export interface GeoCircuit {
  bacingerName: string;
  coordinates: [number, number][]; // [lng, lat] pairs from GeoJSON
}

export interface CircuitData {
  meta: CircuitMeta | null;
  geo: GeoCircuit | null;
  isLoading: boolean;
  error: string | null;
}

// Map Jolpica circuitId → bacinger feature name fragment for fuzzy matching
const JOLPICA_TO_BACINGER: Record<string, string> = {
  albert_park: 'Albert Park',
  americas: 'Americas',
  bahrain: 'Bahrain',
  baku: 'Baku',
  catalunya: 'Barcelona',
  hungaroring: 'Hungaroring',
  imola: 'Dino Ferrari',
  interlagos: 'Interlagos',
  jeddah: 'Jeddah',
  losail: 'Losail',
  marina_bay: 'Marina Bay',
  miami: 'Miami',
  monaco: 'Monaco',
  monza: 'Monza',
  red_bull_ring: 'Red Bull Ring',
  rodriguez: 'Hermanos',
  shanghai: 'Shanghai',
  silverstone: 'Silverstone',
  spa: 'Spa',
  suzuka: 'Suzuka',
  vegas: 'Las Vegas',
  villeneuve: 'Villeneuve',
  yas_marina: 'Yas Marina',
  zandvoort: 'Zandvoort',
  nurburgring: 'Nürburgring',
  istanbul: 'Istanbul',
  sepang: 'Sepang',
};

// Map OpenF1 circuit_short_name → Jolpica circuitId
const OPENF1_TO_JOLPICA: Record<string, string> = {
  albert_park: 'albert_park',
  bahrain: 'bahrain',
  jeddah: 'jeddah',
  suzuka: 'suzuka',
  shanghai: 'shanghai',
  miami: 'miami',
  imola: 'imola',
  monaco: 'monaco',
  montreal: 'villeneuve',
  barcelona: 'catalunya',
  red_bull_ring: 'red_bull_ring',
  silverstone: 'silverstone',
  hungaroring: 'hungaroring',
  spa: 'spa',
  zandvoort: 'zandvoort',
  monza: 'monza',
  baku: 'baku',
  marina_bay: 'marina_bay',
  americas: 'americas',
  rodriguez: 'rodriguez',
  interlagos: 'interlagos',
  las_vegas: 'vegas',
  losail: 'losail',
  yas_marina: 'yas_marina',
};

const BACINGER_GEOJSON_URL =
  'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson';

// In-memory cache so we don't even hit IndexedDB on the second call within
// the same page session (e.g. when switching between circuits).
let memGeoJSON: GeoJSON.FeatureCollection | null = null;

async function loadGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  // 1. In-memory (instant)
  if (memGeoJSON) return memGeoJSON;

  // 2. IndexedDB (fast, no network)
  const dbCached = await getCached<GeoJSON.FeatureCollection>('geoJSON');
  if (dbCached) {
    console.log('[cache] geoJSON — hit');
    memGeoJSON = dbCached;
    return dbCached;
  }

  // 3. Network (slow — only happens once ever)
  console.log('[cache] geoJSON — miss, fetching from GitHub…');
  const res = await fetch(BACINGER_GEOJSON_URL);
  if (!res.ok) throw new Error('Failed to load circuit GeoJSON');
  const data: GeoJSON.FeatureCollection = await res.json();

  memGeoJSON = data;
  await setCached('geoJSON', data);
  return data;
}

function resolveJolpikaId(session: Session): string | null {
  const shortName = session.circuit_short_name?.toLowerCase().replace(/\s+/g, '_') ?? '';
  return OPENF1_TO_JOLPICA[shortName] ?? null;
}

export function useCircuitData(session: Session | null): CircuitData {
  const [meta, setMeta] = useState<CircuitMeta | null>(null);
  const [geo, setGeo] = useState<GeoCircuit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // stable key to avoid spurious re-fetches
  const circuitKey = session?.circuit_short_name ?? null;

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMeta(null);
    setGeo(null);

    const jolpikaId = resolveJolpikaId(session);

    async function load() {
      try {
        // 1. Circuit metadata from Jolpica (lat/lng, circuit name, Wikipedia URL)
        //    Cached in IndexedDB — only fetched once per year, then instant.
        const year = session!.year ?? new Date().getFullYear();
        const metaCacheKey = `circuitMeta:${year}`;

        type JolpikaCircuit = {
          circuitId: string;
          circuitName: string;
          url: string;
          Location: { lat: string; long: string; locality: string; country: string };
        };

        let circuits = await getCached<JolpikaCircuit[]>(metaCacheKey);
        if (circuits) {
          console.log(`[cache] circuitMeta:${year} — hit`);
        } else {
          console.log(`[cache] circuitMeta:${year} — miss, fetching from Jolpica…`);
          const metaRes = await fetch(
            `https://api.jolpi.ca/ergast/f1/${year}/circuits.json?limit=30`
          );
          if (!metaRes.ok) throw new Error('Jolpica circuits fetch failed');
          const metaJson = await metaRes.json();
          circuits = metaJson.MRData.CircuitTable.Circuits as JolpikaCircuit[];
          await setCached(metaCacheKey, circuits);
        }

        let found = jolpikaId ? circuits.find((c) => c.circuitId === jolpikaId) : null;
        if (!found) {
          // fuzzy match by location name
          const locLower = session!.location?.toLowerCase() ?? '';
          found =
            circuits.find((c) => c.circuitName.toLowerCase().includes(locLower)) ??
            circuits.find((c) => c.Location.locality.toLowerCase().includes(locLower)) ??
            null;
        }

        if (!cancelled && found) {
          setMeta({
            circuitId: found.circuitId,
            circuitName: found.circuitName,
            lat: parseFloat(found.Location.lat),
            lng: parseFloat(found.Location.long),
            locality: found.Location.locality,
            country: found.Location.country,
            url: found.url,
          });
        }

        // 2. Fetch and match GeoJSON
        const geojson = await loadGeoJSON();
        const id = jolpikaId ?? found?.circuitId ?? null;
        const nameHint = id ? (JOLPICA_TO_BACINGER[id] ?? '') : (session!.location ?? '');

        const feature = geojson.features.find((f) => {
          const name: string = (f.properties as { Name?: string }).Name ?? '';
          return name.toLowerCase().includes(nameHint.toLowerCase());
        }) ?? geojson.features.find((f) => {
          const name: string = (f.properties as { Name?: string }).Name ?? '';
          const loc = session!.location?.toLowerCase() ?? '';
          return name.toLowerCase().includes(loc);
        });

        if (!cancelled && feature && feature.geometry.type === 'LineString') {
          const coords = (feature.geometry as GeoJSON.LineString).coordinates as [number, number][];
          setGeo({
            bacingerName: (feature.properties as { Name?: string }).Name ?? '',
            coordinates: coords,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circuitKey]);

  return { meta, geo, isLoading, error };
}
