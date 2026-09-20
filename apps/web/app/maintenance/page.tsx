'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect, optionsFromValues } from '@/components/SearchableSelect';
import { api, getToken } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
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
  property: {
    id: string;
    name: string;
    serviceChargeAccount?: { balanceAvailable: number; balanceReserved: number } | null;
  };
  workOrders: {
    id: string;
    number: string;
    status: string;
    artisanName: string | null;
    withinServiceCharge?: boolean | null;
  }[];
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

  const propertyOptions = useMemo(
    () => [
      { value: '', label: 'Select…' },
      ...properties.map((p) => ({ value: p.id, label: p.name, keywords: p.name })),
    ],
    [properties],
  );

  const urgencyOptions = useMemo(
    () =>
      optionsFromValues(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'], (v) =>
        v.charAt(0) + v.slice(1).toLowerCase(),
      ),
    [],
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: '', label: 'All statuses' },
      ...optionsFromValues(
        ['SUBMITTED', 'TRIAGING', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED'],
        (v) => v.replace(/_/g, ' '),
      ),
    ],
    [],
  );

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<MaintenanceRow>({
    items: rows,
    searchKeys: [
      'number',
      'description',
      'category',
      'tenantName',
      'unitLabel',
      'property.name',
      'status',
    ],
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
      const labourRaw = window.prompt('Labour amount (₦)', '0') || '0';
      const materialsRaw = window.prompt('Materials amount (₦)', '0') || '0';
      const labourAmount = Number(labourRaw) || 0;
      const materialsAmount = Number(materialsRaw) || 0;
      const result = await api<{ gated?: boolean; gateReason?: string | null }>(
        `/maintenance/${id}/work-orders`,
        {
          method: 'POST',
          body: JSON.stringify({
            artisanName,
            labourAmount,
            materialsAmount,
          }),
        },
      );
      if (result.gated && result.gateReason) {
        alert(result.gateReason);
      }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create work order');
    } finally {
      setWoBusy(null);
    }
  }

  async function confirmWorkOrder(woId: string) {
    await api(`/maintenance/work-orders/${woId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONFIRMED', tenantSatisfied: true }),
    });
    load();
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
                Intake → triage → SC spend gate → work order → tenant confirm. Platform fee is 2.5%
                of labour (materials excluded).
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
              <SearchableSelect
                className={INPUT}
                required
                options={propertyOptions}
                value={form.propertyId}
                onChange={(v) => setForm({ ...form, propertyId: v })}
                emptyLabel="Select…"
                placeholder="Search properties…"
              />
            </div>
            <div>
              <label className={LABEL}>Urgency</label>
              <SearchableSelect
                className={INPUT}
                options={urgencyOptions}
                value={form.urgency}
                onChange={(v) => setForm({ ...form, urgency: v })}
                placeholder="Urgency…"
              />
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

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full min-w-[160px] sm:w-56">
            <SearchableSelect
              options={statusFilterOptions}
              value={status}
              onChange={setStatus}
              emptyLabel="All statuses"
              placeholder="Filter status…"
            />
          </div>
          <Link href="/properties-hub" className="self-center text-sm font-medium text-[#e87722] hover:underline">
            ← Properties hub
          </Link>
        </div>

        {rows.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search maintenance…"
          />
        )}

        <div className="space-y-3">
          {pageItems.map((r) => (
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
                    {r.property.serviceChargeAccount
                      ? ` · SC ₦${r.property.serviceChargeAccount.balanceAvailable.toLocaleString()}`
                      : ''}
                  </p>
                  {r.workOrders[0] && (
                    <p className="mt-1 text-xs text-slate-500">
                      WO {r.workOrders[0].number}: {r.workOrders[0].status}
                      {r.workOrders[0].artisanName ? ` · ${r.workOrders[0].artisanName}` : ''}
                      {r.workOrders[0].withinServiceCharge === false
                        ? ' · landlord / SC gate'
                        : ''}
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
                  {(r.status === 'SUBMITTED' ||
                    r.status === 'TRIAGING' ||
                    r.status === 'ESCALATED_LANDLORD') && (
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
                  {r.workOrders[0] &&
                    (r.workOrders[0].status === 'ASSIGNED' ||
                      r.workOrders[0].status === 'IN_PROGRESS' ||
                      r.workOrders[0].status === 'COMPLETED_PENDING_CONFIRM') && (
                      <button
                        type="button"
                        onClick={() => confirmWorkOrder(r.workOrders[0].id)}
                        className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Confirm & debit SC
                      </button>
                    )}
                  {r.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      onClick={() => triage(r.id, 'CLOSED')}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      Close request
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
    </AppShell>
  );
}
