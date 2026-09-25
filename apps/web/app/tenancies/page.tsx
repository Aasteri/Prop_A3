'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyPropertyGate } from '@/components/EmptyEntityGate';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken } from '@/lib/api';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

const TENANCY_STATUSES = [
  'PENDING_MOVE_IN',
  'ACTIVE',
  'DRAFT',
  'RENEWAL_PENDING',
  'EXPIRED',
  'TERMINATED',
] as const;

function tenancyStatusLabel(s: string) {
  const labels: Record<string, string> = {
    PENDING_MOVE_IN: 'Pending move-in',
    ACTIVE: 'Active',
    DRAFT: 'Draft',
    RENEWAL_PENDING: 'Renewal pending',
    EXPIRED: 'Expired',
    TERMINATED: 'Terminated',
  };
  return labels[s] ?? s;
}

type PropertyOption = { id: string; name: string; units: { id: string; unitCode: string }[] };

type Tenancy = {
  id: string;
  agreementNo: string | null;
  tenantName: string;
  tenantPhone: string | null;
  startDate: string;
  endDate: string;
  rentAnnual: string | number;
  status: string;
  property: { id: string; name: string; code: string | null };
  unit: { id: string; unitCode: string } | null;
  renewalNotices?: { kind: string; sentAt: string | null }[];
  _count?: { inventories: number };
  maintenanceRequests?: { id: string; number: string; status: string }[];
};

export default function TenanciesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Tenancy[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    propertyId: '',
    unitId: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    agreementNo: '',
    startDate: '',
    endDate: '',
    rentAnnual: '',
    cautionAmount: '',
    serviceCharge: '',
  });

  const load = () => {
    api<Tenancy[]>('/tenancies').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<PropertyOption[]>('/properties').then(setProperties).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const selectedUnits = properties.find((p) => p.id === form.propertyId)?.units ?? [];

  const propertyOptions = useMemo(
    () => properties.map((p) => ({ value: p.id, label: p.name })),
    [properties],
  );
  const unitOptions = useMemo(
    () => selectedUnits.map((u) => ({ value: u.id, label: u.unitCode })),
    [selectedUnits],
  );

  const statusFilter: FilterDef = useMemo(
    () => ({
      key: 'status',
      label: 'Status',
      options: TENANCY_STATUSES.map((s) => ({ value: s, label: tenancyStatusLabel(s) })),
      getValue: (item) => (item as Tenancy).status,
    }),
    [],
  );

  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
  } = useFilteredList<Tenancy>({
    items: rows,
    searchKeys: [
      'tenantName',
      'tenantPhone',
      'agreementNo',
      'status',
      'property.name',
      (r) => r.unit?.unitCode ?? '',
    ],
    filters: [statusFilter],
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/tenancies', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: form.propertyId,
          unitId: form.unitId || undefined,
          tenantName: form.tenantName,
          tenantPhone: form.tenantPhone || undefined,
          tenantEmail: form.tenantEmail || undefined,
          agreementNo: form.agreementNo || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          rentAnnual: Number(form.rentAnnual),
          cautionAmount: form.cautionAmount ? Number(form.cautionAmount) : undefined,
          serviceCharge: form.serviceCharge ? Number(form.serviceCharge) : undefined,
          status: 'ACTIVE',
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenancy');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Properties · Tenancies
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tenancy register</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Active agreements, renewals, and rent terms linked to managed assets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              disabled={!properties.length}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-50"
            >
              {showForm ? 'Cancel' : 'New tenancy'}
            </button>
          </div>
        </header>

        {!properties.length ? (
          <EmptyPropertyGate moduleLabel="tenancies" />
        ) : (
          <>
        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Property</label>
              <SearchableSelect
                required
                options={propertyOptions}
                value={form.propertyId}
                emptyLabel="Select…"
                placeholder="Search property…"
                onChange={(v) => setForm({ ...form, propertyId: v, unitId: '' })}
              />
            </div>
            <div>
              <label className={LABEL}>Unit</label>
              <SearchableSelect
                options={unitOptions}
                value={form.unitId}
                emptyLabel="Whole property / n/a"
                placeholder="Search unit…"
                onChange={(v) => setForm({ ...form, unitId: v })}
              />
            </div>
            <div>
              <label className={LABEL}>Tenant name</label>
              <input
                className={INPUT}
                required
                value={form.tenantName}
                onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Phone</label>
              <input
                className={INPUT}
                value={form.tenantPhone}
                onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Start date</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>End date</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Annual rent (₦)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                required
                value={form.rentAnnual}
                onChange={(e) => setForm({ ...form, rentAnnual: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Caution (₦)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={form.cautionAmount}
                onChange={(e) => setForm({ ...form, cautionAmount: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#243a5e]"
              >
                Save tenancy
              </button>
            </div>
          </form>
        )}

        <ListToolbar
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="Search tenancies…"
          filters={[statusFilter]}
          filterValues={filterValues}
          onFilterChange={setFilter}
          rightSlot={
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  const r = await api<{ created: number }>('/tenancies/renewals/scan', {
                    method: 'POST',
                  });
                  alert(`Renewal scan: ${r.created} notice(s) created`);
                  load();
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 text-slate-900"
              >
                Run renewal scan
              </button>
              <Link href="/inventories" className="text-sm font-medium text-slate-600 hover:underline">
                Inventories
              </Link>
              <Link href="/properties-hub" className="text-sm font-medium text-[#e87722] hover:underline">
                ← Properties hub
              </Link>
            </div>
          }
        />

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Term</th>
                <th className="px-4 py-3">Rent / yr</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1a2744]">{r.tenantName}</p>
                    <p className="text-xs text-slate-500">{r.tenantPhone ?? r.agreementNo ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {r.property.name}
                    {r.unit ? ` · ${r.unit.unitCode}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {r.startDate.slice(0, 10)} → {r.endDate.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">₦{Number(r.rentAnnual).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{r.status}</span>
                    {r.renewalNotices?.length ? (
                      <span className="ml-1 text-xs text-amber-700">
                        · {r.renewalNotices.length} reminder(s)
                      </span>
                    ) : null}
                    {r._count?.inventories ? (
                      <span className="ml-1 text-xs text-slate-500">
                        · {r._count.inventories} inv
                      </span>
                    ) : null}
                    {r.maintenanceRequests?.length ? (
                      <span className="ml-1 text-xs text-red-700">
                        · {r.maintenanceRequests.length} pre-move
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap space-x-2">
                    <Link href="/inventories" className="text-xs text-[#e87722] hover:underline">
                      Inventory
                    </Link>
                    {(r.status === 'ACTIVE' || r.status === 'PENDING_MOVE_IN') && (
                      <button
                        type="button"
                        className="text-xs text-red-700 hover:underline"
                        onClick={async () => {
                          if (!window.confirm('Terminate this tenancy?')) return;
                          await api(`/tenancies/${r.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: 'TERMINATED' }),
                          });
                          load();
                        }}
                      >
                        End tenancy
                      </button>
                    )}
                    {(r.status === 'PENDING_MOVE_IN' || r.status === 'DRAFT') && (
                      <button
                        type="button"
                        className="text-xs text-green-700 hover:underline"
                        onClick={async () => {
                          try {
                            await api(`/tenancies/${r.id}/activate-move-in`, {
                              method: 'POST',
                              body: JSON.stringify({}),
                            });
                            load();
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : 'Blocked';
                            const waive = window.confirm(
                              `${msg}\n\nAuthorise waiver (exception) and activate anyway?`,
                            );
                            if (!waive) return;
                            const reason =
                              window.prompt('Waiver reason (required)') || '';
                            if (!reason.trim()) return;
                            await api(`/tenancies/${r.id}/activate-move-in`, {
                              method: 'POST',
                              body: JSON.stringify({ waiver: true, waiverReason: reason }),
                            });
                            load();
                          }
                        }}
                      >
                        Activate move-in
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredCount && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {rows.length === 0
                      ? 'No tenancies yet. Create a property asset first, then add an agreement.'
                      : 'No matching tenancies.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={page}
          pageCount={pageCount}
          pageSize={20}
          filteredCount={filteredCount}
          onPageChange={setPage}
        />
          </>
        )}
      </div>
    </AppShell>
  );
}
