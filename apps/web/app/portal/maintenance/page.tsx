'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { AttachmentLinks } from '@/components/AttachmentLinks';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { PhotoAttachField } from '@/components/PhotoAttachField';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, uploadPhotos } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type PropertyOpt = { id: string; name: string; address: string; unitLabel?: string | null };

type MaintRow = {
  id: string;
  number: string;
  description: string;
  category: string | null;
  urgency: string;
  status: string;
  createdAt: string;
  photoUrls?: string[] | null;
  property: { id: string; name: string };
  workOrders: {
    id: string;
    number: string;
    status: string;
    artisanName: string | null;
  }[];
};

export default function PortalMaintenancePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyOpt[]>([]);
  const [rows, setRows] = useState<MaintRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    propertyId: '',
    unitLabel: '',
    category: 'Plumbing',
    component: '',
    description: '',
    urgency: 'MEDIUM',
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<MaintRow>({
    items: rows,
    searchKeys: ['number', 'description', 'category', 'status', 'property.name'],
  });

  const load = () => {
    api<PropertyOpt[]>('/client-portal/maintenance/properties')
      .then((list) => {
        setProperties(list);
        if (list[0] && !form.propertyId) {
          setForm((f) => ({
            ...f,
            propertyId: list[0].id,
            unitLabel: list[0].unitLabel ?? '',
          }));
        }
      })
      .catch(console.error);
    api<MaintRow[]>('/client-portal/maintenance').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (!photos.length) {
        setError('Please attach at least one photo of the issue.');
        return;
      }
      const photoUrls = await uploadPhotos(photos);
      await api('/client-portal/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: form.propertyId,
          unitLabel: form.unitLabel || undefined,
          category: form.category,
          component: form.component || undefined,
          description: form.description,
          urgency: form.urgency,
          photoUrls,
        }),
      });
      setShowForm(false);
      setPhotos([]);
      setForm((f) => ({ ...f, description: '', component: '' }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    }
  }

  async function confirmWo(woId: string) {
    const ratingRaw = window.prompt('Satisfaction rating 1–5', '5');
    const tenantRating = ratingRaw ? Number(ratingRaw) : 5;
    const tenantFeedback = window.prompt('Optional feedback') || undefined;
    await api(`/client-portal/maintenance/work-orders/${woId}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({
        tenantSatisfied: true,
        tenantRating: Number.isFinite(tenantRating) ? tenantRating : 5,
        tenantFeedback,
      }),
    });
    load();
  }

  return (
    <PortalShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Tenant / client portal
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Maintenance</h1>
              <p className="mt-2 text-sm text-slate-200/90">
                Report issues with photos, track work orders, and confirm completion.
              </p>
            </div>
            <button
              type="button"
              disabled={!properties.length}
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {showForm ? 'Cancel' : 'New request'}
            </button>
          </div>
        </header>

        {!properties.length && (
          <div className={`${CARD} p-6 text-sm text-slate-600`}>
            No managed property is linked to this account yet. Staff can link a tenancy (email /
            phone match) or a client project that became a property asset.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {showForm && properties.length > 0 && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Property</label>
              <SearchableSelect
                required
                value={form.propertyId}
                onChange={(v) => {
                  const p = properties.find((x) => x.id === v);
                  setForm({
                    ...form,
                    propertyId: v,
                    unitLabel: p?.unitLabel ?? '',
                  });
                }}
                options={properties.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select property…"
              />
            </div>
            <div>
              <label className={LABEL}>Unit / location</label>
              <input
                className={INPUT}
                value={form.unitLabel}
                onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <SearchableSelect
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                options={['Plumbing', 'Electrical', 'HVAC', 'Civil', 'Carpentry', 'Security', 'Other'].map(
                  (c) => ({ value: c, label: c }),
                )}
              />
            </div>
            <div>
              <label className={LABEL}>Urgency</label>
              <SearchableSelect
                value={form.urgency}
                onChange={(v) => setForm({ ...form, urgency: v })}
                options={['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].map((u) => ({
                  value: u,
                  label: u,
                }))}
              />
            </div>
            <div>
              <label className={LABEL}>Component</label>
              <input
                className={INPUT}
                placeholder="e.g. Kitchen sink"
                value={form.component}
                onChange={(e) => setForm({ ...form, component: e.target.value })}
              />
            </div>
            <div>
              <PhotoAttachField
                label="Photos"
                required
                accept="image/*"
                files={photos}
                onChange={setPhotos}
                maxFiles={6}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Description</label>
              <textarea
                className={INPUT}
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white">
                Submit request
              </button>
            </div>
          </form>
        )}

        {rows.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search maintenance…"
          />
        )}

        <div className="space-y-3">
          {pageItems.map((r) => (
            <div key={r.id} className={`${CARD} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1a2744]">
                    {r.number} · {r.property.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                  <AttachmentLinks urls={r.photoUrls} label="Photos" />
                  <p className="mt-2 text-xs text-slate-500">
                    {r.category ?? 'General'} · {r.urgency} · {r.status} ·{' '}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {r.workOrders?.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
                  {r.workOrders.map((wo) => (
                    <li key={wo.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {wo.number} · {wo.status}
                        {wo.artisanName ? ` · ${wo.artisanName}` : ''}
                      </span>
                      {(wo.status === 'COMPLETED_PENDING_CONFIRM' ||
                        wo.status === 'IN_PROGRESS' ||
                        wo.status === 'ASSIGNED') && (
                        <button
                          type="button"
                          className="text-[#e87722] hover:underline"
                          onClick={() => confirmWo(wo.id)}
                        >
                          Confirm complete
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {!rows.length && properties.length > 0 && (
            <div className={`${CARD} p-6 text-sm text-slate-500`}>No maintenance requests yet.</div>
          )}
        </div>
        {rows.length > 0 && (
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            filteredCount={filteredCount}
            onPageChange={setPage}
          />
        )}
      </div>
    </PortalShell>
  );
}
