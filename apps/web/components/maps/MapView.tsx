'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LMap, LayerGroup, Marker as LMarker } from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  kind?: 'start' | 'end' | 'job' | 'driver';
  popupHtml?: string;
  onClick?: () => void;
}

export interface MapViewProps {
  markers?: MapMarker[];
  route?: [number, number][];
  /** A live-updating driver position, moved imperatively (no full redraw). */
  live?: { lat: number; lng: number } | null;
  height?: number | string;
  className?: string;
  interactive?: boolean;
  fit?: boolean;
  center?: [number, number];
  zoom?: number;
}

function pinIcon(L: typeof import('leaflet'), kind: string) {
  if (kind === 'driver') {
    return L.divIcon({
      className: 'map-pin',
      html: `<div class="map-driver"><span class="map-driver__ring"></span><span class="map-driver__truck">🚚</span></div>`,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  }
  const color = kind === 'start' ? '#16a34a' : kind === 'end' ? '#1d4ed8' : '#2563eb';
  return L.divIcon({
    className: 'map-pin',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 5px rgba(2,6,23,.45)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/**
 * Imperative Leaflet wrapper (client-only). Renders branded pins + an optional
 * route polyline over free OpenStreetMap tiles. No API key required.
 */
export function MapView({
  markers = [],
  route,
  live,
  height = 320,
  className,
  interactive = true,
  fit = true,
  center = [31.9, 34.9],
  zoom = 8,
}: MapViewProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const driverRef = useRef<LMarker | null>(null);
  const [ready, setReady] = useState(false);

  // Initialise the map once.
  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (disposed || !elRef.current || mapRef.current) return;
      const map = L.map(elRef.current, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      void draw(L);
      setReady(true);
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers / route when they change.
  useEffect(() => {
    (async () => {
      const L = (await import('leaflet')).default;
      void draw(L);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), JSON.stringify(route)]);

  // Move the live driver marker imperatively (cheap — no full redraw per frame).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (cancelled || !map) return;
      if (!live) {
        if (driverRef.current) {
          map.removeLayer(driverRef.current);
          driverRef.current = null;
        }
        return;
      }
      if (!driverRef.current) {
        driverRef.current = L.marker([live.lat, live.lng], { icon: pinIcon(L, 'driver'), zIndexOffset: 1000 }).addTo(map);
      } else {
        driverRef.current.setLatLng([live.lat, live.lng]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [live?.lat, live?.lng, ready]);

  function draw(L: typeof import('leaflet')) {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();

    const bounds: [number, number][] = [];

    if (route && route.length > 1) {
      L.polyline(route, { color: '#ffffff', weight: 8, opacity: 0.9, lineJoin: 'round' }).addTo(group);
      L.polyline(route, { color: '#2563eb', weight: 4.5, opacity: 1, lineJoin: 'round' }).addTo(group);
      for (const p of route) bounds.push(p);
    }

    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(L, m.kind ?? 'job') }).addTo(group);
      if (m.popupHtml) marker.bindPopup(m.popupHtml);
      if (m.onClick) marker.on('click', m.onClick);
      bounds.push([m.lat, m.lng]);
    }

    if (fit && bounds.length) {
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14 });
    }
  }

  return (
    <div
      ref={elRef}
      className={className}
      style={{ height, width: '100%', borderRadius: 'inherit', zIndex: 0 }}
    />
  );
}
