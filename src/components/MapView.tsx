import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CircuitMeta, GeoCircuit } from '../hooks/useCircuitData';
import type { ReplayPoint } from '../hooks/useLapReplay';
import type { DriverWithData, Location } from '../types/openf1';
import {
  boundsFromLocations,
  boundsFromXYPoints,
  buildTelemetryToLatLngProjector,
  localToLatLngBbox,
} from '../lib/telemetryGeoAlign';
import { metersPerUnitFromTrackOutline, speedKmhFromReplayTrail } from '../lib/locationSpeed';

function buildDriverHighlightBubble(opts: {
  acronym: string;
  speedText: string;
  headshotUrl?: string;
  teamColourHex: string;
}): HTMLElement {
  const { acronym, speedText, headshotUrl, teamColourHex } = opts;
  const root = document.createElement('div');
  root.className = 'driver-speed-bubble-inner';

  const topRow = document.createElement('div');
  topRow.className = 'driver-speed-bubble-top';

  const nameEl = document.createElement('span');
  nameEl.className = 'driver-speed-bubble-acronym';
  nameEl.textContent = acronym;

  const photoRing = document.createElement('div');
  photoRing.className = 'driver-speed-bubble-photo-ring';
  photoRing.style.borderColor = `#${teamColourHex || 'ffffff'}`;

  if (headshotUrl) {
    const img = document.createElement('img');
    img.className = 'driver-speed-bubble-photo';
    img.src = headshotUrl;
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      photoRing.classList.add('driver-speed-bubble-photo-ring--empty');
      img.remove();
    });
    photoRing.appendChild(img);
  } else {
    photoRing.classList.add('driver-speed-bubble-photo-ring--empty');
  }

  topRow.appendChild(nameEl);
  topRow.appendChild(photoRing);

  const speedEl = document.createElement('div');
  speedEl.className = 'driver-speed-bubble-speedline';
  speedEl.textContent = speedText;

  root.appendChild(topRow);
  root.appendChild(speedEl);

  return root;
}

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
  /**
   * Replay variant: draw a track from averaged driver GPS (not the GeoJSON circuit)
   * and fit/projection use only telemetry bounds.
   */
  ogTrackMode?: boolean;
  ogTrackPoints?: { x: number; y: number }[];
}

type LocalBounds = { minX: number; maxX: number; minY: number; maxY: number };

const EMPTY_HIDDEN = new Set<number>();

/** Reference zoom for mild size tweaks only (markers stay nearly fixed on screen). */
const MAP_ZOOM_STYLE_REF = 16;

/** Very gentle zoom scaling so dots barely grow/shrink. */
const ZOOM_SIZE_CURVE = 0.1;

/** Min distance (deg ≈ lat/lng) before appending a live trail point — ~2 m */
const LIVE_TRAIL_MIN_STEP_DEG = 2e-5;

const LIVE_TRAIL_MAX_POINTS = 2500;

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

function updateSpeedBubble(marker: L.CircleMarker, content: HTMLElement, offsetY: number) {
  const tt = marker.getTooltip();
  if (tt) {
    tt.setContent(content);
    tt.options.offset = L.point(0, offsetY);
    tt.update();
    return;
  }
  marker.bindTooltip(content, {
    permanent: true,
    direction: 'top',
    className: 'driver-speed-bubble',
    offset: L.point(0, offsetY),
    opacity: 1,
  });
}

function clearSpeedBubble(marker: L.CircleMarker) {
  marker.unbindTooltip();
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
  ogTrackMode = false,
  ogTrackPoints = [],
}: MapViewProps) {
  const hiddenOnTrack = driversHiddenOnTrack ?? EMPTY_HIDDEN;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapZoom, setMapZoom] = useState(MAP_ZOOM_STYLE_REF);
  const trackGroupRef = useRef<L.LayerGroup | null>(null);
  const trailsGroupRef = useRef<L.LayerGroup | null>(null);
  const driverLayersRef = useRef<Map<number, L.CircleMarker>>(new Map());
  const livePathHistoryRef = useRef<Map<number, [number, number][]>>(new Map());
  const livePathGroupRef = useRef<L.LayerGroup | null>(null);

  const isReplayMode = replayPositions !== undefined;

  const outlineBounds = useMemo(() => boundsFromLocations(trackOutline), [trackOutline]);

  const ogBounds = useMemo(() => boundsFromXYPoints(ogTrackPoints), [ogTrackPoints]);

  /**
   * Never fold live car GPS into the projector bounds — that was shifting the whole map
   * every poll (“following” drivers). Replay still merges replay extents for fallback fit.
   * OG mode: only telemetry (+ consensus track), no reference outline bbox.
   */
  const boundsForProjector = useMemo(() => {
    if (isReplayMode && replayPositions) {
      const rb = computeTelemetryBounds([], replayPositions, replayTrails);
      if (ogTrackMode && ogBounds) {
        return mergeBounds(rb, ogBounds);
      }
      return mergeBounds(outlineBounds, rb);
    }
    return outlineBounds;
  }, [isReplayMode, replayPositions, replayTrails, outlineBounds, ogTrackMode, ogBounds]);

  const metersPerUnit = useMemo(() => {
    if (ogTrackMode && ogTrackPoints.length >= 4) {
      let L = 0;
      for (let i = 1; i < ogTrackPoints.length; i++) {
        const a = ogTrackPoints[i - 1]!;
        const b = ogTrackPoints[i]!;
        L += Math.hypot(b.x - a.x, b.y - a.y);
      }
      if (L > 1e-6) return 5000 / L;
    }
    return metersPerUnitFromTrackOutline(trackOutline);
  }, [ogTrackMode, ogTrackPoints, trackOutline]);

  /** Affine fit to circuit when outline is available; else axis-aligned bbox vs GeoJSON. */
  const projectXY = useMemo((): ((x: number, y: number) => [number, number]) | null => {
    if (!geo) return null;
    if (!ogTrackMode && trackOutline.length >= 10) {
      const aff = buildTelemetryToLatLngProjector(trackOutline, geo.coordinates);
      if (aff) return aff;
    }
    if (boundsForProjector) {
      const b = boundsForProjector;
      return (x, y) =>
        localToLatLngBbox(x, y, b.minX, b.maxX, b.minY, b.maxY, geo.coordinates);
    }
    return null;
  }, [geo, trackOutline, boundsForProjector, ogTrackMode]);

  const ogTrackLatLngs = useMemo((): [number, number][] => {
    if (!projectXY || ogTrackPoints.length < 2) return [];
    return ogTrackPoints.map((p) => projectXY(p.x, p.y));
  }, [projectXY, ogTrackPoints]);

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

  // Live mode: accumulated paths are tied to this circuit; replay uses API trails only.
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

  // Draw circuit: GeoJSON outline (live / replay) or GPS-derived OG track
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geo) return;

    if (trackGroupRef.current) {
      trackGroupRef.current.remove();
      trackGroupRef.current = null;
    }

    if (ogTrackMode) {
      if (ogTrackLatLngs.length >= 3) {
        const group = L.layerGroup([
          L.polyline(ogTrackLatLngs, { color: '#ffffff', weight: 14, opacity: 0.1 }),
          L.polyline(ogTrackLatLngs, { color: '#6b7280', weight: 7, opacity: 0.55 }),
          L.polyline(ogTrackLatLngs, { color: '#d1d5db', weight: 3.5, opacity: 0.95 }),
        ]);
        group.addTo(map);
        trackGroupRef.current = group;
        map.fitBounds(L.latLngBounds(ogTrackLatLngs), { padding: [52, 52] });
      } else if (meta) {
        map.setView([meta.lat, meta.lng], 15);
      }
      return;
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
  }, [geo, meta, ogTrackMode, ogTrackLatLngs]);

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
        interactive: false,
      }).addTo(group);
    }

    group.addTo(map);
    group.eachLayer((ly) => {
      (ly as L.Polyline).bringToBack();
    });
    trailsGroupRef.current = group;
  }, [geo, projectXY, replayTrails, drivers, isReplayMode, hiddenOnTrack, mapZoom]);

  // Driver markers (live or replay), live painted trails, speed bubbles
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

      const radius = scaledMarkerRadius(isSelected ? 12 : 8, mapZoom);
      const strokeW = scaledOutlineWeight(isSelected ? 3 : 1, mapZoom);

      const speedKm = isReplayMode
        ? speedKmhFromReplayTrail(replayTrails?.get(driver.driver_number) ?? [], metersPerUnit)
        : driver.trackSpeedKmh ?? null;
      const speedLabel =
        speedKm != null && Number.isFinite(speedKm) ? `${Math.round(speedKm)} km/h` : '—';
      const bubbleOffsetY = Math.round(-(radius + 28));
      const highlightBubble =
        isSelected
          ? buildDriverHighlightBubble({
              acronym: driver.name_acronym,
              speedText: speedLabel,
              headshotUrl: driver.headshot_url || undefined,
              teamColourHex: driver.team_colour || 'ffffff',
            })
          : null;

      if (!isReplayMode) {
        const hist = livePathHistoryRef.current.get(driver.driver_number) ?? [];
        const last = hist[hist.length - 1];
        if (
          !last ||
          Math.hypot(lat - last[0], lng - last[1]) >= LIVE_TRAIL_MIN_STEP_DEG
        ) {
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
        if (isSelected && highlightBubble) {
          updateSpeedBubble(marker, highlightBubble, bubbleOffsetY);
        } else clearSpeedBubble(marker);
      } else {
        const marker = L.circleMarker([lat, lng], {
          radius,
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: strokeW,
          fillOpacity: 1,
        });
        if (isSelected && highlightBubble) {
          updateSpeedBubble(marker, highlightBubble, bubbleOffsetY);
        } else clearSpeedBubble(marker);
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
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-xs font-semibold tracking-wide text-white">
            {ogTrackMode ? 'OG track (driver GPS)' : geo.bacingerName}
          </p>
        </div>
      )}
    </div>
  );
}
