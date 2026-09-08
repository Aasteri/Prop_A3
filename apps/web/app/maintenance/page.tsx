'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type PropertyOption = { id: string; name: string };

type MaintenanceRow = {
  id: string;
  number: string;
  description: string;
  category: string | null;
  urgency: string;
  status: string;
  tenantName: string | null;
  unitLabel: string | null;
  createdAt: string;
  property: { id: string; name: string };
  workOrders: { id: string; number: string; status: string; artisanName: string | null }[];
};

export default function MaintenancePage() {
  const router = useRouter();
  const [rows, setRows] = useState<MaintenanceRow[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [woBusy, setWoBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyId: '',
    unitLabel: '',
    tenantName: '',
    tenantPhone: '',
    category: 'Plumbing',
    component: '',
    description: '',
    urgency: 'MEDIUM',
  });

  const load = () => {
    const q = status ? `?status=${status}` : '';
    api<MaintenanceRow[]>(`/maintenance${q}`).then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<PropertyOption[]>('/properties').then(setProperties).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, status]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: form.propertyId,
          unitLabel: form.unitLabel || undefined,
          tenantName: form.tenantName || undefined,
          tenantPhone: form.tenantPhone || undefined,
          category: form.category || undefined,
          component: form.component || undefined,
          description: form.description,
          urgency: form.urgency,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    }
  }

  async function triage(id: string, next: string) {
    await api(`/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function assignWorkOrder(id: string) {
    setWoBusy(id);
    try {
      const artisanName = window.prompt('Artisan name') || undefined;
      await api(`/maintenance/${id}/work-orders`, {
        method: 'POST',
        body: JSON.stringify({
          artisanName,
          withinServiceCharge: true,
          labourAmount: 0,
          materialsAmount: 0,
        }),
      });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create work order');
    } finally {
      setWoBusy(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Properties · Maintenance
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Maintenance requests
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Intake → triage → work order → tenant confirmation (SC spend gate next).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
            >
              {showForm ? 'Cancel' : 'Log request'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Property</label>
              <select
                className={INPUT}
                required
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              >
                <option value="">Select…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Urgency</label>
              <select
                className={INPUT}
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <input
                className={INPUT}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Unit / area</label>
              <input
                className={INPUT}
                value={form.unitLabel}
                onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Tenant name</label>
              <input
                className={INPUT}
                value={form.tenantName}
                onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Tenant phone</label>
              <input
                className={INPUT}
                value={form.tenantPhone}
                onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Description</label>
              <textarea
                className={INPUT}
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#243a5e]"
              >
                Submit request
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="TRIAGING">Triaging</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="CLOSED">Closed</option>
          </select>
          <Link href="/properties-hub" className="self-center text-sm font-medium text-[#e87722] hover:underline">
            ← Properties hub
          </Link>
        </div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">{r.number}</p>
                  <h2 className="mt-1 text-base font-semibold text-[#1a2744]">{r.property.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.urgency} · {r.status}
                    {r.tenantName ? ` · ${r.tenantName}` : ''}
                    {r.unitLabel ? ` · ${r.unitLabel}` : ''}
                    {r.category ? ` · ${r.category}` : ''}
                  </p>
                  {r.workOrders[0] && (
                    <p className="mt-1 text-xs text-slate-500">
                      WO {r.workOrders[0].number}: {r.workOrders[0].status}
                      {r.workOrders[0].artisanName ? ` · ${r.workOrders[0].artisanName}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === 'SUBMITTED' && (
                    <button
                      type="button"
                      onClick={() => triage(r.id, 'TRIAGING')}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Start triage
                    </button>
                  )}
                  {(r.status === 'SUBMITTED' || r.status === 'TRIAGING') && (
                    <button
                      type="button"
                      disabled={woBusy === r.id}
                      onClick={() => assignWorkOrder(r.id)}
                      className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#243a5e] disabled:opacity-50"
                    >
                      Assign WO
                    </button>
                  )}
                  {r.status === 'ASSIGNED' && (
                    <button
                      type="button"
                      onClick={() => triage(r.id, 'IN_PROGRESS')}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Mark in progress
                    </button>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      onClick={() => triage(r.id, 'CLOSED')}
                      className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No maintenance requests yet. Log one against a managed property.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
