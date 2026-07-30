'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

export type SiteMarker = {
  code: string;
  name: string;
  location: string | null;
  lat: number;
  lng: number;
  activeProjects: number;
  projectNames: string[];
};

export function SitesMap({ sites }: { sites: SiteMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || !sites.length) return;

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

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#e87722;width:14px;height:14px;border-radius:50%;border:2px solid #1a2744;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      for (const site of sites) {
        const projects =
          site.projectNames.length > 0
            ? `<ul style="margin:4px 0 0;padding-left:16px">${site.projectNames.map((n) => `<li>${n}</li>`).join('')}</ul>`
            : '<p style="margin:4px 0 0;color:#666">No active projects listed</p>';

        L.marker([site.lat, site.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${site.code} — ${site.name}</strong><br/>${site.location ?? ''}<br/>${site.activeProjects} active project(s)${projects}`,
          );
      }

      const bounds = L.latLngBounds(sites.map((s) => [s.lat, s.lng] as [number, number]));
      if (sites.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sites]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full rounded-xl border border-slate-200"
      aria-label="Map of Triple A development sites in Abuja"
    />
  );
}
