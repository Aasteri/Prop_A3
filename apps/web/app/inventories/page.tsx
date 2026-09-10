'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type TenancyOption = {
  id: string;
  tenantName: string;
  property: { name: string };
  unit: { unitCode: string } | null;
};

type Inventory = {
  id: string;
  number: string;
  kind: string;
  status: string;
  inspectedAt: string;
  discrepancyDeadline: string | null;
  frontDoorKeys: number | null;
  backDoorKeys: number | null;
  electricReading: string | null;
  waterReading: string | null;
  photoEvidence: boolean;
  tenancy: {
    tenantName: string;
    property: { name: string };
    unit: { unitCode: string } | null;
  };
};

export default function InventoriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Inventory[]>([]);
  const [tenancies, setTenancies] = useState<TenancyOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    tenancyId: '',
    kind: 'MOVE_IN',
    inspectedAt: new Date().toISOString().slice(0, 10),
    inspectedBy: '',
    moveDate: '',
    frontDoorKeys: '2',
    backDoorKeys: '1',
    electricReading: '',
    waterReading: '',
    photoEvidence: true,
    notes: '',
  });

  const load = () => {
    api<Inventory[]>('/inventories').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<TenancyOption[]>('/tenancies').then(setTenancies).catch(console.error);
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const created = await api<{ id: string }>('/inventories', {
        method: 'POST',
        body: JSON.stringify({
          tenancyId: form.tenancyId,
          kind: form.kind,
          inspectedAt: form.inspectedAt,
          inspectedBy: form.inspectedBy || undefined,
          moveDate: form.moveDate || undefined,
          frontDoorKeys: Number(form.frontDoorKeys) || undefined,
          backDoorKeys: Number(form.backDoorKeys) || undefined,
          electricReading: form.electricReading || undefined,
          waterReading: form.waterReading || undefined,
          photoEvidence: form.photoEvidence,
          notes: form.notes || undefined,
        }),
      });
      router.push(`/inventories/${created.id}`);
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function complete(id: string) {
    await api(`/inventories/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ landlordSigned: true, tenantSigned: true }),
    });
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Properties · Inventories
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Move-in / move-out inventory
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Doc 9 condition report: keys, meters, evidence, room matrix. Move-out completion
                unlocks deposit settlement (G.14).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
            >
              {showForm ? 'Cancel' : 'New inventory'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Tenancy</label>
              <select
                className={INPUT}
                required
                value={form.tenancyId}
                onChange={(e) => setForm({ ...form, tenancyId: e.target.value })}
              >
                <option value="">Select…</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenantName} · {t.property.name}
                    {t.unit ? ` · ${t.unit.unitCode}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Kind</label>
              <select
                className={INPUT}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="MOVE_IN">Move-in</option>
                <option value="MOVE_OUT">Move-out</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Inspected at</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.inspectedAt}
                onChange={(e) => setForm({ ...form, inspectedAt: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Inspected by</label>
              <input
                className={INPUT}
                value={form.inspectedBy}
                onChange={(e) => setForm({ ...form, inspectedBy: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Front door keys</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={form.frontDoorKeys}
                onChange={(e) => setForm({ ...form, frontDoorKeys: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Back door keys</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={form.backDoorKeys}
                onChange={(e) => setForm({ ...form, backDoorKeys: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Electric reading</label>
              <input
                className={INPUT}
                value={form.electricReading}
                onChange={(e) => setForm({ ...form, electricReading: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Water reading</label>
              <input
                className={INPUT}
                value={form.waterReading}
                onChange={(e) => setForm({ ...form, waterReading: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.photoEvidence}
                onChange={(e) => setForm({ ...form, photoEvidence: e.target.checked })}
              />
              Photographic evidence taken
            </label>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white">
                Save draft
              </button>
            </div>
          </form>
        )}

        <div className="flex gap-3 text-sm">
          <Link href="/tenancies" className="font-medium text-[#e87722] hover:underline">
            ← Tenancies
          </Link>
          <Link href="/properties-hub" className="font-medium text-slate-600 hover:underline">
            Properties hub
          </Link>
        </div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/inventories/${r.id}`}
                    className="text-xs font-semibold text-[#e87722] hover:underline"
                  >
                    {r.number}
                  </Link>
                  <p className="mt-1 font-medium text-[#1a2744]">
                    {r.kind.replace(/_/g, ' ')} · {r.tenancy.tenantName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {r.tenancy.property.name}
                    {r.tenancy.unit ? ` · ${r.tenancy.unit.unitCode}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.status} · inspected {r.inspectedAt.slice(0, 10)}
                    {r.discrepancyDeadline
                      ? ` · discrepancy deadline ${r.discrepancyDeadline.slice(0, 10)}`
                      : ''}
                    {r.photoEvidence ? ' · photos' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/inventories/${r.id}`}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                  >
                    Room matrix
                  </Link>
                  {r.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => complete(r.id)}
                      className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                    >
                      Complete & sign
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No inventories yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
