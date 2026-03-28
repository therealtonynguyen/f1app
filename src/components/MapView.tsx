import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CircuitMeta, GeoCircuit } from '../hooks/useCircuitData';
import type { DriverWithData } from '../types/openf1';

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
  selectedDriverNumber: number | null;
  onSelectDriver: (n: number | null) => void;
}

// Convert OpenF1 local XY to approximate lat/lng using the circuit's geographic
// bounding box derived from the GeoJSON coordinates.
function localToLatLng(
  x: number,
  y: number,
  trackMinX: number,
  trackMaxX: number,
  trackMinY: number,
  trackMaxY: number,
  geoCoords: [number, number][] // [lng, lat]
): [number, number] {
  const lngs = geoCoords.map((c) => c[0]);
  const lats = geoCoords.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const tX = (x - trackMinX) / (trackMaxX - trackMinX || 1);
  const tY = (y - trackMinY) / (trackMaxY - trackMinY || 1);

  // OpenF1 Y axis is typically inverted relative to lat (north-up)
  const lat = minLat + tY * (maxLat - minLat);
  const lng = minLng + tX * (maxLng - minLng);
  return [lat, lng];
}

export function MapView({
  meta,
  geo,
  isLoading,
  error,
  drivers,
  selectedDriverNumber,
  onSelectDriver,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const trackLayerRef = useRef<L.Polyline | null>(null);
  const driverLayersRef = useRef<Map<number, L.CircleMarker>>(new Map());

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    ).addTo(map);

    // Labels overlay on top of satellite imagery
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.6 }
    ).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw / update circuit track when GeoJSON changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geo) return;

    if (trackLayerRef.current) {
      trackLayerRef.current.remove();
    }

    // GeoJSON coords are [lng, lat]; Leaflet wants [lat, lng]
    const latLngs = geo.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

    // Outer glow / shadow
    L.polyline(latLngs, { color: '#ffffff', weight: 12, opacity: 0.08 }).addTo(map);
    // Track border
    L.polyline(latLngs, { color: '#cccccc', weight: 6, opacity: 0.5 }).addTo(map);
    // Main racing surface
    const track = L.polyline(latLngs, { color: '#e8e8e8', weight: 3, opacity: 0.95 });
    track.addTo(map);
    trackLayerRef.current = track;

    // Fit map to circuit bounds with padding
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [geo]);

  // Centre map when meta changes (no geo yet)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !meta || geo) return;
    map.setView([meta.lat, meta.lng], 15);
  }, [meta, geo]);

  // Compute OpenF1 local coordinate bounds for driver projection
  const localBounds = (() => {
    const xs = drivers.map((d) => d.currentLocation?.x ?? 0).filter(Boolean);
    const ys = drivers.map((d) => d.currentLocation?.y ?? 0).filter(Boolean);
    if (!xs.length) return null;
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  })();

  // Update driver markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geo || !localBounds) return;

    const existing = driverLayersRef.current;
    const seen = new Set<number>();

    for (const driver of drivers) {
      if (!driver.currentLocation) continue;
      const { x, y } = driver.currentLocation;
      const [lat, lng] = localToLatLng(
        x, y,
        localBounds.minX, localBounds.maxX,
        localBounds.minY, localBounds.maxY,
        geo.coordinates
      );

      const color = `#${driver.team_colour || 'ffffff'}`;
      const isSelected = driver.driver_number === selectedDriverNumber;

      if (existing.has(driver.driver_number)) {
        const marker = existing.get(driver.driver_number)!;
        marker.setLatLng([lat, lng]);
        marker.setStyle({
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1,
          radius: isSelected ? 8 : 5,
        });
      } else {
        const marker = L.circleMarker([lat, lng], {
          radius: isSelected ? 8 : 5,
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1,
          fillOpacity: 1,
        });
        marker.bindTooltip(driver.name_acronym, {
          permanent: false,
          direction: 'top',
          className: 'driver-tooltip',
        });
        marker.on('click', () => {
          onSelectDriver(
            driver.driver_number === selectedDriverNumber ? null : driver.driver_number
          );
        });
        marker.addTo(map);
        existing.set(driver.driver_number, marker);
      }
      seen.add(driver.driver_number);
    }

    // Remove stale markers
    for (const [num, marker] of existing) {
      if (!seen.has(num)) {
        marker.remove();
        existing.delete(num);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers, geo, selectedDriverNumber]);

  return (
    <div className="relative w-full h-full bg-[#0a0a14]">
      {/* Leaflet map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {isLoading && !geo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Loading circuit map…</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-xl px-5 py-3 text-center max-w-xs">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-1">Map unavailable for this circuit</p>
          </div>
        </div>
      )}

      {/* Circuit name badge */}
      {geo && (
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none">
          <p className="text-white text-xs font-semibold tracking-wide">{geo.bacingerName}</p>
        </div>
      )}
    </div>
  );
}
