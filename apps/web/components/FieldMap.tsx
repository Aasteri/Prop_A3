'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

export type FieldMarker = {
  type: 'site' | 'artisan' | 'inspection';
  id: string;
  label: string;
  lat: number;
  lng: number;
  meta?: string | null;
};

const COLORS: Record<FieldMarker['type'], string> = {
  site: '#e87722',
  artisan: '#2563eb',
  inspection: '#16a34a',
};

export function FieldMap({ markers }: { markers: FieldMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || !markers.length) return;

    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current).setView([9.05, 7.49], 11);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      for (const m of markers) {
        const color = COLORS[m.type];
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #1a2744;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${m.label}</strong><br/><span style="text-transform:capitalize">${m.type}</span>${m.meta ? `<br/>${m.meta}` : ''}`,
          );
      }

      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      if (markers.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
      else if (markers[0]) map.setView([markers[0].lat, markers[0].lng], 13);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [markers]);

  if (!markers.length) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No mapped locations yet. Set site coordinates, pin artisans, or log inspection GPS.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full rounded-xl border border-slate-200"
      aria-label="Field map of sites, artisans, and inspections"
    />
  );
}
