import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CircuitMeta, GeoCircuit } from '../hooks/useCircuitData';
import type { ReplayPoint } from '../hooks/useLapReplay';
import type { DriverWithData, Location } from '../types/openf1';
import {
  boundsFromLocations,
  buildTelemetryToLatLngProjector,
  localToLatLngBbox,
} from '../lib/telemetryGeoAlign';

// Fix Leaflet's broken default icon paths when bundled with Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  meta: CircuitMeta | null;
  geo: GeoCircuit | null;
  isLoading: boolean;
  error: string | null;
  drivers: DriverWithData[];
  /** Reference lap from OpenF1 — aligns telemetry x/y to the GeoJSON circuit. */
  trackOutline: Location[];
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
  /** Driver numbers to omit from the map (markers and replay trails). */
  driversHiddenOnTrack?: Set<number>;
  /** When set, markers use replay positions instead of live GPS. */
  replayPositions?: Map<number, { x: number; y: number }>;
  replayTrails?: Map<number, ReplayPoint[]>;
}

type LocalBounds = { minX: number; maxX: number; minY: number; maxY: number };

const EMPTY_HIDDEN = new Set<number>();

/** Leaflet circle radii are in screen px; scale down as the user zooms in (like map features staying map-sized). */
const MAP_ZOOM_STYLE_REF = 16;

function mapZoomScale(zoom: number): number {
  return Math.pow(2, MAP_ZOOM_STYLE_REF - zoom);
}

function scaledMarkerRadius(basePx: number, zoom: number): number {
  const s = mapZoomScale(zoom);
  return Math.max(2, Math.min(22, basePx * s));
}

function scaledOutlineWeight(basePx: number, zoom: number): number {
  const s = mapZoomScale(zoom);
  return Math.max(0.5, Math.min(6, basePx * s));
}

function scaledTrailWeight(basePx: number, zoom: number): number {
  const s = mapZoomScale(zoom);
  return Math.max(0.35, Math.min(5, basePx * s));
}

function computeTelemetryBounds(
  drivers: DriverWithData[],
  replayPositions: Map<number, { x: number; y: number }> | undefined,
  replayTrails: Map<number, ReplayPoint[]> | undefined
): LocalBounds | null {
  const xs: number[] = [];
  const ys: number[] = [];

  if (replayPositions !== undefined) {
    replayPositions.forEach((p) => {
      xs.push(p.x);
      ys.push(p.y);
    });
    replayTrails?.forEach((pts) => {
      for (const p of pts) {
        xs.push(p.x);
        ys.push(p.y);
      }
    });
  } else {
    for (const d of drivers) {
      if (d.currentLocation) {
        xs.push(d.currentLocation.x);
        ys.push(d.currentLocation.y);
      }
    }
  }

  if (xs.length === 0) return null;
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function mergeBounds(a: LocalBounds | null, b: LocalBounds | null): LocalBounds | null {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  };
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
}: MapViewProps) {
  const hiddenOnTrack = driversHiddenOnTrack ?? EMPTY_HIDDEN;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapZoom, setMapZoom] = useState(MAP_ZOOM_STYLE_REF);
  const trackGroupRef = useRef<L.LayerGroup | null>(null);
  const trailsGroupRef = useRef<L.LayerGroup | null>(null);
  const driverLayersRef = useRef<Map<number, L.CircleMarker>>(new Map());

  const isReplayMode = replayPositions !== undefined;

  const localBounds = useMemo(
    () => computeTelemetryBounds(drivers, replayPositions, replayTrails),
    [drivers, replayPositions, replayTrails]
  );

  const outlineBounds = useMemo(() => boundsFromLocations(trackOutline), [trackOutline]);

  const mergedBounds = useMemo(
    () => mergeBounds(localBounds, outlineBounds),
    [localBounds, outlineBounds]
  );

  /** Affine fit to circuit when outline is available; else axis-aligned bbox vs GeoJSON. */
  const projectXY = useMemo((): ((x: number, y: number) => [number, number]) | null => {
    if (!geo) return null;
    if (trackOutline.length >= 10) {
      const aff = buildTelemetryToLatLngProjector(trackOutline, geo.coordinates);
      if (aff) return aff;
    }
    if (mergedBounds) {
      const b = mergedBounds;
      return (x, y) =>
        localToLatLngBbox(x, y, b.minX, b.maxX, b.minY, b.maxY, geo.coordinates);
    }
    return null;
  }, [geo, trackOutline, mergedBounds]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    const syncMapZoom = () => setMapZoom(map.getZoom());
    map.on('zoom zoomend', syncMapZoom);
    syncMapZoom();

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    ).addTo(map);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.6 }
    ).addTo(map);

    mapRef.current = map;
    return () => {
      map.off('zoom zoomend', syncMapZoom);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Click empty map to clear driver selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onMapClick = () => onSelectDriver(null);
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [onSelectDriver]);

  // Draw circuit from GeoJSON (not car telemetry)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geo) return;

    if (trackGroupRef.current) {
      trackGroupRef.current.remove();
      trackGroupRef.current = null;
    }

    const latLngs = geo.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

    const group = L.layerGroup([
      L.polyline(latLngs, { color: '#ffffff', weight: 12, opacity: 0.08 }),
      L.polyline(latLngs, { color: '#cccccc', weight: 6, opacity: 0.5 }),
      L.polyline(latLngs, { color: '#e8e8e8', weight: 3, opacity: 0.95 }),
    ]);
    group.addTo(map);
    trackGroupRef.current = group;

    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [geo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !meta || geo) return;
    map.setView([meta.lat, meta.lng], 15);
  }, [meta, geo]);

  // Replay: recent telemetry trails on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geo || !projectXY) return;

    if (trailsGroupRef.current) {
      trailsGroupRef.current.remove();
      trailsGroupRef.current = null;
    }

    if (!isReplayMode || !replayTrails || replayTrails.size === 0) return;

    const group = L.layerGroup();
    const toMap = projectXY;

    for (const [driverNumber, trail] of replayTrails) {
      if (hiddenOnTrack.has(driverNumber)) continue;
      if (trail.length < 2) continue;
      const driver = drivers.find((d) => d.driver_number === driverNumber);
      const color = `#${driver?.team_colour ?? 'ffffff'}`;
      const latlngs = trail.map((p) => toMap(p.x, p.y));
      L.polyline(latlngs, {
        color,
        weight: scaledTrailWeight(2, mapZoom),
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(group);
    }

    group.addTo(map);
    trailsGroupRef.current = group;
  }, [geo, projectXY, replayTrails, drivers, isReplayMode, hiddenOnTrack, mapZoom]);

  // Driver markers (live or replay)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geo || !projectXY) return;

    const toMap = projectXY;
    const existing = driverLayersRef.current;
    const seen = new Set<number>();

    for (const driver of drivers) {
      if (hiddenOnTrack.has(driver.driver_number)) continue;

      let x: number;
      let y: number;
      if (isReplayMode) {
        const rp = replayPositions!.get(driver.driver_number);
        if (!rp) continue;
        x = rp.x;
        y = rp.y;
      } else {
        if (!driver.currentLocation) continue;
        x = driver.currentLocation.x;
        y = driver.currentLocation.y;
      }

      const [lat, lng] = toMap(x, y);
      const color = `#${driver.team_colour || 'ffffff'}`;
      const isSelected = driver.driver_number === selectedDriverNumber;

      const radius = scaledMarkerRadius(isSelected ? 8 : 5, mapZoom);
      const strokeW = scaledOutlineWeight(isSelected ? 3 : 1, mapZoom);

      if (existing.has(driver.driver_number)) {
        const marker = existing.get(driver.driver_number)!;
        marker.setLatLng([lat, lng]);
        marker.setStyle({
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: strokeW,
          radius,
        });
      } else {
        const marker = L.circleMarker([lat, lng], {
          radius,
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: strokeW,
          fillOpacity: 1,
        });
        marker.bindTooltip(driver.name_acronym, {
          permanent: false,
          direction: 'top',
          className: 'driver-tooltip',
        });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectDriver(
            driver.driver_number === selectedDriverNumber ? null : driver.driver_number
          );
        });
        marker.addTo(map);
        existing.set(driver.driver_number, marker);
      }
      seen.add(driver.driver_number);
    }

    for (const [num, marker] of existing) {
      if (!seen.has(num)) {
        marker.remove();
        existing.delete(num);
      }
    }
  }, [
    drivers,
    geo,
    selectedDriverNumber,
    projectXY,
    isReplayMode,
    replayPositions,
    onSelectDriver,
    hiddenOnTrack,
    mapZoom,
  ]);

  return (
    <div className="relative w-full h-full bg-[#0a0a14]">
      <div ref={containerRef} className="w-full h-full" />

      {isLoading && !geo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Loading circuit map…</span>
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
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none">
          <p className="text-white text-xs font-semibold tracking-wide">{geo.bacingerName}</p>
        </div>
      )}
    </div>
  );
}
