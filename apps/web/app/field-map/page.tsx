'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { FieldMap, type FieldMarker } from '@/components/FieldMap';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type FieldMapData = {
  sites: FieldMarker[];
  artisans: FieldMarker[];
  inspections: FieldMarker[];
};

type Artisan = {
  id: string;
  fullName: string;
  phone: string;
  latitude: number | string | null;
  longitude: number | string | null;
  status: string;
};

type SiteRow = {
  id: string;
  code: string;
  name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export default function FieldMapPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<FieldMapData | null>(null);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [error, setError] = useState('');
  const [artisanId, setArtisanId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [siteLat, setSiteLat] = useState('');
  const [siteLng, setSiteLng] = useState('');
  const [busy, setBusy] = useState(false);

  const canEdit =
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER';

  const markers = useMemo(() => {
    if (!data) return [];
    return [...data.sites, ...data.artisans, ...data.inspections];
  }, [data]);

  const artisanOptions = useMemo(
    () =>
      artisans
        .filter((a) => a.status === 'APPROVED')
        .map((a) => ({
          value: a.id,
          label: `${a.fullName}${a.latitude != null ? ' · pinned' : ''}`,
          keywords: a.fullName,
        })),
    [artisans],
  );

  const siteOptions = useMemo(
    () =>
      sites.map((s) => ({
        value: s.id,
        label: `${s.code} · ${s.name}`,
        keywords: s.name,
      })),
    [sites],
  );

  const load = () => {
    api<FieldMapData>('/project-ops/field-map')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load map'));
    api<Artisan[]>('/artisans')
      .then(setArtisans)
      .catch(console.error);
    api<SiteRow[]>('/sites')
      .then(setSites)
      .catch(() => {
        // sites endpoint may be under projects; ignore if missing
      });
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
  }, [router]);

  async function saveArtisanLocation(e: FormEvent) {
    e.preventDefault();
    if (!artisanId || !canEdit) return;
    setBusy(true);
    setError('');
    try {
      await api(`/artisans/${artisanId}/location`, {
        method: 'PATCH',
        body: JSON.stringify({
          latitude: Number(lat),
          longitude: Number(lng),
        }),
      });
      setLat('');
      setLng('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin artisan');
    } finally {
      setBusy(false);
    }
  }

  async function saveSiteCoords(e: FormEvent) {
    e.preventDefault();
    if (!siteId || !canEdit) return;
    setBusy(true);
    setError('');
    try {
      await api(`/project-ops/sites/${siteId}/coords`, {
        method: 'PATCH',
        body: JSON.stringify({
          latitude: Number(siteLat),
          longitude: Number(siteLng),
        }),
      });
      setSiteLat('');
      setSiteLng('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set site coordinates');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Field map
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Sites · Artisans · Inspections
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Map development sites, pinned artisans, and inspection GPS captures across Abuja.
              </p>
            </div>
            <Link
              href="/inspections"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
            >
              Log inspection GPS
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#e87722]" /> Sites
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#2563eb]" /> Artisans
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#16a34a]" /> Inspections
          </span>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <FieldMap markers={markers} />

        {data && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`${CARD} p-4`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Sites</p>
              <p className="text-xl font-semibold text-[#1a2744]">{data.sites.length}</p>
            </div>
            <div className={`${CARD} p-4`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Pinned artisans</p>
              <p className="text-xl font-semibold text-[#1a2744]">{data.artisans.length}</p>
            </div>
            <div className={`${CARD} p-4`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Inspections with GPS</p>
              <p className="text-xl font-semibold text-[#1a2744]">{data.inspections.length}</p>
            </div>
          </div>
        )}

        {canEdit && (
          <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={saveArtisanLocation} className={`${CARD} space-y-3 p-4`}>
              <h2 className="font-semibold text-[#1a2744]">Pin artisan location</h2>
              <label className="block text-sm">
                <span className={LABEL}>Artisan</span>
                <SearchableSelect
                  className={INPUT}
                  options={artisanOptions}
                  value={artisanId}
                  onChange={setArtisanId}
                  emptyLabel="Select…"
                  placeholder="Search…"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  <span className={LABEL}>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className={INPUT}
                    placeholder="9.05"
                  />
                </label>
                <label className="block text-sm">
                  <span className={LABEL}>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className={INPUT}
                    placeholder="7.49"
                  />
                </label>
              </div>
              <button type="submit" disabled={busy || !artisanId} className={BTN_PRIMARY}>
                Save artisan pin
              </button>
            </form>

            <form onSubmit={saveSiteCoords} className={`${CARD} space-y-3 p-4`}>
              <h2 className="font-semibold text-[#1a2744]">Set site coordinates</h2>
              <label className="block text-sm">
                <span className={LABEL}>Site</span>
                <SearchableSelect
                  className={INPUT}
                  options={siteOptions}
                  value={siteId}
                  onChange={setSiteId}
                  emptyLabel="Select…"
                  placeholder="Search…"
                />
              </label>
              {!siteOptions.length && (
                <p className="text-xs text-slate-500">
                  Sites load from the map payload when /sites is unavailable — use site IDs from
                  admin if the list is empty.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  <span className={LABEL}>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={siteLat}
                    onChange={(e) => setSiteLat(e.target.value)}
                    className={INPUT}
                  />
                </label>
                <label className="block text-sm">
                  <span className={LABEL}>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={siteLng}
                    onChange={(e) => setSiteLng(e.target.value)}
                    className={INPUT}
                  />
                </label>
              </div>
              <button type="submit" disabled={busy || !siteId} className={BTN_SECONDARY}>
                Save site coords
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
