import { useEffect, useMemo, useRef, useState } from 'react';
import { setOptions as setMapsOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { CircuitMeta, GeoCircuit } from '../hooks/useCircuitData';
import type { ReplayPoint, ReplayTelemetryBounds } from '../hooks/useLapReplay';
import type { DriverWithData, Location } from '../types/openf1';
import {
  boundsFromLocations,
  buildTelemetryToLatLngProjector,
  localToLatLngBbox,
} from '../lib/telemetryGeoAlign';
import { metersPerUnitFromTrackOutline, speedKmhFromReplayTrail } from '../lib/locationSpeed';

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? '';

// Configure the loader once — before any importLibrary call
if (MAPS_API_KEY) {
  setMapsOptions({ key: MAPS_API_KEY, v: 'weekly' });
}

interface MapViewProps {
  meta: CircuitMeta | null;
  geo: GeoCircuit | null;
  isLoading: boolean;
  error: string | null;
  drivers: DriverWithData[];
  trackOutline: Location[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  driversHiddenOnTrack?: Set<number>;
  replayPositions?: Map<number, { x: number; y: number }>;
  replayTrails?: Map<number, ReplayPoint[]>;
  replayTelemetryBounds?: ReplayTelemetryBounds | null;
}

type LocalBounds = { minX: number; maxX: number; minY: number; maxY: number };

const EMPTY_HIDDEN = new Set<number>();
const LIVE_TRAIL_MIN_STEP_DEG = 2e-5;
const LIVE_TRAIL_MAX_POINTS = 2500;

function computeTelemetryBounds(
  drivers: DriverWithData[],
  replayPositions: Map<number, { x: number; y: number }> | undefined,
  replayTrails: Map<number, ReplayPoint[]> | undefined
): LocalBounds | null {
  const xs: number[] = [];
  const ys: number[] = [];
  if (replayPositions !== undefined) {
    replayPositions.forEach((p) => { xs.push(p.x); ys.push(p.y); });
    replayTrails?.forEach((pts) => { for (const p of pts) { xs.push(p.x); ys.push(p.y); } });
  } else {
    for (const d of drivers) {
      if (d.currentLocation) { xs.push(d.currentLocation.x); ys.push(d.currentLocation.y); }
    }
  }
  if (xs.length === 0) return null;
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
}

function mergeBounds(a: LocalBounds | null, b: LocalBounds | null): LocalBounds | null {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY), maxY: Math.max(a.maxY, b.maxY),
  };
}

function buildInfoWindowHtml(opts: {
  acronym: string;
  speedText: string;
  headshotUrl?: string;
  teamColourHex: string;
}): string {
  const { acronym, speedText, headshotUrl, teamColourHex } = opts;
  const color = `#${teamColourHex || 'ffffff'}`;
  const photo = headshotUrl
    ? `<img src="${headshotUrl}" referrerpolicy="no-referrer" onerror="this.style.display='none'"
         style="width:36px;height:36px;border-radius:50%;border:2px solid ${color};margin:0 auto 6px;display:block;object-fit:cover;" />`
    : '';
  return `<div style="background:rgba(18,18,20,0.96);border:1.5px solid ${color};border-radius:10px;
      padding:10px 14px;min-width:80px;text-align:center;
      font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;">
      ${photo}
      <div style="color:#fff;font-size:13px;font-weight:600;letter-spacing:0.5px;">${acronym}</div>
      <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:3px;">${speedText}</div>
    </div>`;
}

export function MapView({
  meta,
  geo,
  isLoading,
  error,
  drivers,
  trackOutline,
  selectedDriverNumber,
  onSelectDriver,
  driversHiddenOnTrack,
  replayPositions,
  replayTrails,
  replayTelemetryBounds,
}: MapViewProps) {
  const hiddenOnTrack = driversHiddenOnTrack ?? EMPTY_HIDDEN;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Stable refs so event listeners always call the latest prop
  const onSelectDriverRef = useRef(onSelectDriver);
  useEffect(() => { onSelectDriverRef.current = onSelectDriver; }, [onSelectDriver]);
  const selectedDriverNumberRef = useRef(selectedDriverNumber);
  useEffect(() => { selectedDriverNumberRef.current = selectedDriverNumber; }, [selectedDriverNumber]);

  const circuitPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const driverMarkersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const livePathHistoryRef = useRef<Map<number, { lat: number; lng: number }[]>>(new Map());
  const livePathPolylinesRef = useRef<Map<number, google.maps.Polyline>>(new Map());
  const replayTrailPolylinesRef = useRef<Map<number, google.maps.Polyline>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const isReplayMode = replayPositions !== undefined;

  const outlineBounds = useMemo(() => boundsFromLocations(trackOutline), [trackOutline]);

  const boundsForProjector = useMemo(() => {
    if (isReplayMode && replayPositions) {
      const rb = replayTelemetryBounds ?? computeTelemetryBounds([], replayPositions, replayTrails);
      return mergeBounds(outlineBounds, rb);
    }
    return outlineBounds;
  }, [isReplayMode, replayPositions, replayTelemetryBounds, replayTrails, outlineBounds]);

  const metersPerUnit = useMemo(() => metersPerUnitFromTrackOutline(trackOutline), [trackOutline]);

  const projectXY = useMemo((): ((x: number, y: number) => [number, number]) | null => {
    if (!geo) return null;
    if (trackOutline.length >= 10) {
      const aff = buildTelemetryToLatLngProjector(trackOutline, geo.coordinates);
      if (aff) return aff;
    }
    if (boundsForProjector) {
      const b = boundsForProjector;
      return (x, y) => localToLatLngBbox(x, y, b.minX, b.maxX, b.minY, b.maxY, geo.coordinates);
    }
    return null;
  }, [geo, trackOutline, boundsForProjector]);

  // ── Init Google Maps ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !MAPS_API_KEY) return;
    let cancelled = false;

    importLibrary('maps')
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          mapTypeId: 'satellite',
          zoom: 16,
          center: { lat: 0, lng: 0 },
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          tilt: 0, // keep top-down for accurate circuit overlay alignment
          gestureHandling: 'greedy',
        });

        map.addListener('click', () => onSelectDriverRef.current(null));

        const iw = new google.maps.InfoWindow({ disableAutoPan: true });
        iw.addListener('closeclick', () => onSelectDriverRef.current(null));
        infoWindowRef.current = iw;

        mapRef.current = map;
        setMapReady(true);
      })
      .catch((err: unknown) => {
        console.error('[MapView] Failed to load Google Maps:', err);
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clear live paths on circuit change ───────────────────────────────────
  useEffect(() => {
    livePathHistoryRef.current.clear();
    for (const p of livePathPolylinesRef.current.values()) p.setMap(null);
    livePathPolylinesRef.current.clear();
  }, [geo?.bacingerName]);

  useEffect(() => {
    if (isReplayMode) {
      livePathHistoryRef.current.clear();
      for (const p of livePathPolylinesRef.current.values()) p.setMap(null);
      livePathPolylinesRef.current.clear();
    }
  }, [isReplayMode]);

  // ── Circuit GeoJSON overlay ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !geo) return;

    for (const p of circuitPolylinesRef.current) p.setMap(null);
    circuitPolylinesRef.current = [];

    const path = geo.coordinates.map(([lng, lat]) => ({ lat, lng }));

    // Three-layer glow: wide soft glow → medium halo → sharp centre line
    circuitPolylinesRef.current = [
      new google.maps.Polyline({ path, map, clickable: false, strokeColor: '#ffffff', strokeWeight: 14, strokeOpacity: 0.07, zIndex: 1 }),
      new google.maps.Polyline({ path, map, clickable: false, strokeColor: '#cccccc', strokeWeight: 7, strokeOpacity: 0.45, zIndex: 2 }),
      new google.maps.Polyline({ path, map, clickable: false, strokeColor: '#f0f0f0', strokeWeight: 3, strokeOpacity: 0.95, zIndex: 3 }),
    ];

    const bounds = new google.maps.LatLngBounds();
    for (const pt of path) bounds.extend(pt);
    map.fitBounds(bounds, 56);
  }, [mapReady, geo, meta]);

  // ── Fall back to meta centre (no GeoJSON yet) ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !meta || geo) return;
    map.setCenter({ lat: meta.lat, lng: meta.lng });
    map.setZoom(15);
  }, [mapReady, meta, geo]);

  // ── Replay trail polylines ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !geo || !projectXY) return;

    for (const p of replayTrailPolylinesRef.current.values()) p.setMap(null);
    replayTrailPolylinesRef.current.clear();

    if (!isReplayMode || !replayTrails || replayTrails.size === 0) return;

    for (const [driverNumber, trail] of replayTrails) {
      if (hiddenOnTrack.has(driverNumber) || trail.length < 2) continue;
      const driver = drivers.find((d) => d.driver_number === driverNumber);
      const color = `#${driver?.team_colour ?? 'ffffff'}`;
      const path = trail.map((p) => {
        const [lat, lng] = projectXY(p.x, p.y);
        return { lat, lng };
      });
      replayTrailPolylinesRef.current.set(
        driverNumber,
        new google.maps.Polyline({ path, map, clickable: false, strokeColor: color, strokeWeight: 2, strokeOpacity: 0.45, zIndex: 10 })
      );
    }
  }, [mapReady, geo, projectXY, replayTrails, drivers, isReplayMode, hiddenOnTrack]);

  // ── Driver markers, live trails, InfoWindow ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !geo || !projectXY) return;

    const existing = driverMarkersRef.current;
    const seen = new Set<number>();

    for (const driver of drivers) {
      if (hiddenOnTrack.has(driver.driver_number)) continue;

      let x: number, y: number;
      if (isReplayMode) {
        const rp = replayPositions!.get(driver.driver_number);
        if (!rp) continue;
        ({ x, y } = rp);
      } else {
        if (!driver.currentLocation) continue;
        ({ x, y } = driver.currentLocation);
      }

      const [lat, lng] = projectXY(x, y);
      const color = `#${driver.team_colour || 'ffffff'}`;
      const isSelected = driver.driver_number === selectedDriverNumber;

      const icon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 14 : 7,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: isSelected ? '#ffffff' : color,
        strokeWeight: isSelected ? 3 : 1.5,
      };

      // Accumulate live trail history
      if (!isReplayMode) {
        const hist = livePathHistoryRef.current.get(driver.driver_number) ?? [];
        const last = hist[hist.length - 1];
        if (!last || Math.hypot(lat - last.lat, lng - last.lng) >= LIVE_TRAIL_MIN_STEP_DEG) {
          const next = [...hist, { lat, lng }];
          livePathHistoryRef.current.set(
            driver.driver_number,
            next.length > LIVE_TRAIL_MAX_POINTS ? next.slice(-LIVE_TRAIL_MAX_POINTS) : next
          );
        }
      }

      if (existing.has(driver.driver_number)) {
        const marker = existing.get(driver.driver_number)!;
        marker.setPosition({ lat, lng });
        marker.setIcon(icon);
        marker.setZIndex(isSelected ? 200 : 100);
      } else {
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          icon,
          zIndex: isSelected ? 200 : 100,
          title: driver.name_acronym,
        });
        // Marker clicks do NOT propagate to the map in Google Maps — no stopPropagation needed
        marker.addListener('click', () => {
          onSelectDriverRef.current(
            driver.driver_number === selectedDriverNumberRef.current ? null : driver.driver_number
          );
        });
        existing.set(driver.driver_number, marker);
      }
      seen.add(driver.driver_number);

      // Update InfoWindow for the selected driver
      if (isSelected) {
        const iw = infoWindowRef.current;
        const marker = existing.get(driver.driver_number);
        if (iw && marker) {
          const speedKm = isReplayMode
            ? speedKmhFromReplayTrail(replayTrails?.get(driver.driver_number) ?? [], metersPerUnit)
            : driver.trackSpeedKmh ?? null;
          const speedLabel =
            speedKm != null && Number.isFinite(speedKm) ? `${Math.round(speedKm)} km/h` : '—';
          iw.setContent(buildInfoWindowHtml({
            acronym: driver.name_acronym,
            speedText: speedLabel,
            headshotUrl: driver.headshot_url || undefined,
            teamColourHex: driver.team_colour || 'ffffff',
          }));
          iw.open(map, marker);
        }
      }
    }

    // Close InfoWindow when nothing is selected
    if (selectedDriverNumber === null || !seen.has(selectedDriverNumber)) {
      infoWindowRef.current?.close();
    }

    // Remove stale markers
    for (const [num, marker] of existing) {
      if (!seen.has(num)) { marker.setMap(null); existing.delete(num); }
    }

    // Live trail polylines
    if (!isReplayMode) {
      const livePaths = livePathPolylinesRef.current;
      for (const [num, pathHistory] of livePathHistoryRef.current) {
        if (hiddenOnTrack.has(num) || pathHistory.length < 2) continue;
        const driver = drivers.find((d) => d.driver_number === num);
        const color = `#${driver?.team_colour ?? 'ffffff'}`;
        if (livePaths.has(num)) {
          livePaths.get(num)!.setPath(pathHistory);
        } else {
          livePaths.set(num, new google.maps.Polyline({
            path: pathHistory, map, clickable: false,
            strokeColor: color, strokeWeight: 1.5, strokeOpacity: 0.42, zIndex: 50,
          }));
        }
      }
      const validNums = new Set(drivers.map((d) => d.driver_number));
      for (const [num, poly] of livePaths) {
        if (!validNums.has(num) || hiddenOnTrack.has(num)) { poly.setMap(null); livePaths.delete(num); }
      }
    } else {
      for (const p of livePathPolylinesRef.current.values()) p.setMap(null);
      livePathPolylinesRef.current.clear();
    }
  }, [
    mapReady, drivers, geo, selectedDriverNumber, projectXY,
    isReplayMode, replayPositions, replayTrails, metersPerUnit, hiddenOnTrack,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-[#0a0a14]">
      <div ref={containerRef} className="w-full h-full" />

      {!MAPS_API_KEY && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 rounded-xl px-5 py-3 text-center max-w-xs">
            <p className="text-red-400 text-sm font-medium">Google Maps API key missing</p>
            <p className="text-gray-500 text-xs mt-1">Add VITE_GOOGLE_MAPS_KEY to .env.local</p>
          </div>
        </div>
      )}

      {isLoading && !geo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-xl px-5 py-3.5 flex items-center gap-4">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-white text-sm leading-snug">Loading circuit map…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-xl px-5 py-3 text-center max-w-xs">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-1">Map unavailable for this circuit</p>
          </div>
        </div>
      )}

      {geo && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/60 px-3.5 py-2 backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-wide text-white leading-snug">
            {geo.bacingerName}
          </p>
        </div>
      )}
    </div>
  );
}
