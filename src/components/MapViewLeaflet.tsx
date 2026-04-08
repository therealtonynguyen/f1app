/**
 * Satellite-style map without Google Maps API — Esri World Imagery + circuit overlay.
 * Used when VITE_GOOGLE_MAPS_KEY is not set.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CircuitMeta, GeoCircuit } from '../hooks/useCircuitData';
import type { ReplayPoint, ReplayTelemetryBounds } from '../hooks/useLapReplay';
import type { DriverWithData, Location } from '../types/openf1';
import {
  boundsFromLocations,
  buildTelemetryToLatLngProjector,
  localToLatLngBbox,
} from '../lib/telemetryGeoAlign';
import { metersPerUnitFromTrackOutline, speedKmhFromReplayTrail } from '../lib/locationSpeed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewLeafletProps {
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
const MAP_ZOOM_STYLE_REF = 16;
const ZOOM_SIZE_CURVE = 0.1;

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

function mapZoomScale(zoom: number): number {
  const dz = MAP_ZOOM_STYLE_REF - zoom;
  return Math.pow(2, dz * ZOOM_SIZE_CURVE);
}

function scaledMarkerRadius(basePx: number, zoom: number): number {
  const s = mapZoomScale(zoom);
  return Math.max(4.5, Math.min(22, basePx * s));
}

function scaledOutlineWeight(basePx: number, zoom: number): number {
  const s = mapZoomScale(zoom);
  return Math.max(0.75, Math.min(3.5, basePx * s));
}

function scaledTrailWeight(basePx: number, zoom: number): number {
  const s = mapZoomScale(zoom);
  return Math.max(0.5, Math.min(3.5, basePx * s));
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

export function MapViewLeaflet({
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
}: MapViewLeafletProps) {
  const hiddenOnTrack = driversHiddenOnTrack ?? EMPTY_HIDDEN;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapZoom, setMapZoom] = useState(MAP_ZOOM_STYLE_REF);
  const trackGroupRef = useRef<L.LayerGroup | null>(null);
  const trailsGroupRef = useRef<L.LayerGroup | null>(null);
  const driverLayersRef = useRef<Map<number, L.CircleMarker>>(new Map());
  const livePathHistoryRef = useRef<Map<number, [number, number][]>>(new Map());
  const livePathGroupRef = useRef<L.LayerGroup | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const skipNextMapDeselectRef = useRef(false);

  const onSelectDriverRef = useRef(onSelectDriver);
  useEffect(() => {
    onSelectDriverRef.current = onSelectDriver;
  }, [onSelectDriver]);
  const selectedDriverNumberRef = useRef(selectedDriverNumber);
  useEffect(() => {
    selectedDriverNumberRef.current = selectedDriverNumber;
  }, [selectedDriverNumber]);

  const isReplayMode = replayPositions !== undefined;

  const outlineBounds = useMemo(() => boundsFromLocations(trackOutline), [trackOutline]);

  const boundsForProjector = useMemo(() => {
    if (isReplayMode && replayPositions) {
      const rb = replayTelemetryBounds ?? computeTelemetryBounds([], replayPositions, replayTrails);
      return mergeBounds(outlineBounds, rb);
    }
    return outlineBounds;
  }, [isReplayMode, replayPositions, replayTrails, replayTelemetryBounds, outlineBounds]);

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

  // Init Leaflet + Esri imagery
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    const syncZoom = () => setMapZoom(map.getZoom());
    map.on('zoom zoomend', syncZoom);
    syncZoom();

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
        maxZoom: 19,
      }
    ).addTo(map);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.6 }
    ).addTo(map);

    map.on('click', () => {
      if (skipNextMapDeselectRef.current) {
        skipNextMapDeselectRef.current = false;
        return;
      }
      onSelectDriverRef.current(null);
    });

    mapRef.current = map;
    return () => {
      map.off('zoom zoomend', syncZoom);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    livePathHistoryRef.current.clear();
    livePathGroupRef.current?.clearLayers();
  }, [geo?.bacingerName]);

  useEffect(() => {
    if (isReplayMode) {
      livePathHistoryRef.current.clear();
      livePathGroupRef.current?.clearLayers();
    }
  }, [isReplayMode]);

  // Circuit overlay
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

    map.fitBounds(L.latLngBounds(latLngs), { padding: [48, 48] });
  }, [geo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !meta || geo) return;
    map.setView([meta.lat, meta.lng], 15);
  }, [meta, geo]);

  // Replay trails
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
      if (hiddenOnTrack.has(driverNumber) || trail.length < 2) continue;
      const driver = drivers.find((d) => d.driver_number === driverNumber);
      const color = `#${driver?.team_colour ?? 'ffffff'}`;
      const latlngs = trail.map((p) => {
        const [lat, lng] = toMap(p.x, p.y);
        return [lat, lng] as [number, number];
      });
      L.polyline(latlngs, {
        color,
        weight: scaledTrailWeight(2, mapZoom),
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(group);
    }

    group.addTo(map);
    group.eachLayer((ly) => {
      (ly as L.Polyline).bringToBack();
    });
    trailsGroupRef.current = group;
  }, [geo, projectXY, replayTrails, drivers, isReplayMode, hiddenOnTrack, mapZoom]);

  // Drivers + live trails + popup
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

      const radius = scaledMarkerRadius(isSelected ? 15 : 7, mapZoom);
      const strokeW = scaledOutlineWeight(isSelected ? 4 : 1, mapZoom);

      if (!isReplayMode) {
        const hist = livePathHistoryRef.current.get(driver.driver_number) ?? [];
        const last = hist[hist.length - 1];
        if (!last || Math.hypot(lat - last[0], lng - last[1]) >= LIVE_TRAIL_MIN_STEP_DEG) {
          const next = [...hist, [lat, lng] as [number, number]];
          livePathHistoryRef.current.set(
            driver.driver_number,
            next.length > LIVE_TRAIL_MAX_POINTS ? next.slice(-LIVE_TRAIL_MAX_POINTS) : next
          );
        }
      }

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
        marker.on('click', (e) => {
          if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
          skipNextMapDeselectRef.current = true;
          onSelectDriverRef.current(
            driver.driver_number === selectedDriverNumberRef.current ? null : driver.driver_number
          );
        });
        marker.addTo(map);
        existing.set(driver.driver_number, marker);
      }
      seen.add(driver.driver_number);

      if (isSelected) {
        const speedKm = isReplayMode
          ? speedKmhFromReplayTrail(replayTrails?.get(driver.driver_number) ?? [], metersPerUnit)
          : driver.trackSpeedKmh ?? null;
        const speedLabel =
          speedKm != null && Number.isFinite(speedKm)
            ? `${Math.round(speedKm * 0.621371)} mph · ${Math.round(speedKm)} km/h`
            : '—';
        const marker = existing.get(driver.driver_number)!;
        const html = buildInfoWindowHtml({
          acronym: driver.name_acronym,
          speedText: speedLabel,
          headshotUrl: driver.headshot_url || undefined,
          teamColourHex: driver.team_colour || 'ffffff',
        });
        if (!popupRef.current) {
          popupRef.current = L.popup({ closeButton: false, className: 'driver-leaflet-popup', maxWidth: 320 });
        }
        popupRef.current.setContent(html).setLatLng(marker.getLatLng()).openOn(map);
      }
    }

    if (selectedDriverNumber === null || !seen.has(selectedDriverNumber)) {
      map.closePopup();
    }

    for (const [num, marker] of existing) {
      if (!seen.has(num)) {
        marker.remove();
        existing.delete(num);
      }
    }

    const validNums = new Set(drivers.map((d) => d.driver_number));
    for (const num of [...livePathHistoryRef.current.keys()]) {
      if (!validNums.has(num)) livePathHistoryRef.current.delete(num);
    }

    if (isReplayMode) {
      livePathGroupRef.current?.clearLayers();
    } else {
      let group = livePathGroupRef.current;
      if (!group) {
        group = L.layerGroup().addTo(map);
        livePathGroupRef.current = group;
      } else {
        group.clearLayers();
      }
      for (const [num, path] of livePathHistoryRef.current) {
        if (hiddenOnTrack.has(num) || path.length < 2) continue;
        const driver = drivers.find((d) => d.driver_number === num);
        const c = `#${driver?.team_colour ?? 'ffffff'}`;
        L.polyline(path, {
          color: c,
          weight: scaledTrailWeight(1.25, mapZoom),
          opacity: 0.42,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        }).addTo(group);
      }
      group.eachLayer((ly) => {
        (ly as L.Polyline).bringToBack();
      });
    }

    for (const m of existing.values()) {
      m.bringToFront();
    }
  }, [
    drivers,
    geo,
    selectedDriverNumber,
    projectXY,
    isReplayMode,
    replayPositions,
    replayTrails,
    metersPerUnit,
    hiddenOnTrack,
    mapZoom,
  ]);

  return (
    <div className="relative w-full h-full bg-[#0a0a14]">
      <div ref={containerRef} className="w-full h-full" />

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
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/60 px-3.5 py-2 backdrop-blur-sm max-w-[min(100%-24px,280px)]">
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/60 mb-0.5">
            Esri satellite (no Google key)
          </p>
          <p className="text-xs font-semibold tracking-wide text-white leading-snug">{geo.bacingerName}</p>
        </div>
      )}
    </div>
  );
}
