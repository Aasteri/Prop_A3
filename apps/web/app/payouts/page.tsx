'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, ApiError, downloadPdf, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type CalcStep = {
  step: string;
  formula: string;
  inputs: string;
  result: string;
  notes?: string;
};

type PayoutLine = {
  id: string;
  earnerType: string;
  earnerName: string;
  earnerRef: string | null;
  category: string | null;
  calcDetail: string;
  sharePct: number | null;
  grossBase: number | null;
  amount: number;
  sortOrder: number;
};

type PayoutBatch = {
  id: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  calculationJson: CalcStep[];
  calculation?: CalcStep[];
  grossInflows: number;
  totalAttributions: number;
  totalPayable: number;
  companyRetain: number;
  preparedBy: string | null;
  financeReviewedBy: string | null;
  financeReviewedAt: string | null;
  execApprovedBy: string | null;
  execApprovedAt: string | null;
  paidAt: string | null;
  paidBy: string | null;
  nextApproverRole: string | null;
  nextApproverLabel: string;
  notes: string | null;
  lines: PayoutLine[];
};

type Preview = {
  periodStart: string;
  periodEnd: string;
  calculationJson: CalcStep[];
  grossInflows: number;
  totalAttributions: number;
  companyRetain: number;
  totalPayable: number;
  inflowCount: number;
  attributionCount: number;
  lines: Array<{
    earnerType: string;
    earnerName: string;
    category: string | null;
    calcDetail: string;
    sharePct: number;
    amount: number;
  }>;
};

const money = (n: number) =>
  `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const dateOnly = (v: string) => v.slice(0, 10);

export default function PayoutsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<PayoutBatch[]>([]);
  const [selected, setSelected] = useState<PayoutBatch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [form, setForm] = useState({ periodStart: '', periodEnd: '', notes: '' });

  const canMutate =
    user?.role === 'FINANCE' || user?.role === 'CEO' || user?.role === 'ADMIN';
  const canExec = user?.role === 'CEO' || user?.role === 'ADMIN';

  const load = () =>
    api<PayoutBatch[]>('/payouts')
      .then((data) => {
        setRows(data);
        if (selected) {
          const refreshed = data.find((r) => r.id === selected.id);
          if (refreshed) setSelected(refreshed);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function runPreview() {
    if (!form.periodStart || !form.periodEnd) {
      setError('Select period start and end');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const data = await api<Preview>('/payouts/preview', {
        method: 'POST',
        body: JSON.stringify({
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
        }),
      });
      setPreview(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Preview failed');
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function saveBatch(e: FormEvent) {
    e.preventDefault();
    if (!preview) {
      setError('Run preview before saving');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await api<PayoutBatch>('/payouts', {
        method: 'POST',
        body: JSON.stringify({
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          notes: form.notes || undefined,
        }),
      });
      setShowForm(false);
      setPreview(null);
      setForm({ periodStart: '', periodEnd: '', notes: '' });
      await load();
      setSelected(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function act(path: string) {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api<PayoutBatch>(`/payouts/${selected.id}/${path}`, {
        method: 'PATCH',
      });
      setSelected(updated);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function openDetail(id: string) {
    setError('');
    try {
      const row = await api<PayoutBatch>(`/payouts/${id}`);
      setSelected(row);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load batch');
    }
  }

  const steps = selected?.calculation ?? selected?.calculationJson ?? [];
  const previewSteps = preview?.calculationJson ?? [];

  const statusFilter: FilterDef = useMemo(() => {
    const statuses = [...new Set(rows.map((r) => r.status))].sort();
    return {
      key: 'status',
      label: 'Status',
      options: statuses.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
      getValue: (item) => (item as PayoutBatch).status,
    };
  }, [rows]);

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
  } = useFilteredList<PayoutBatch>({
    items: rows,
    searchKeys: ['number', 'status', 'preparedBy', 'notes', 'periodStart', 'periodEnd'],
    filters: statusFilter.options.length ? [statusFilter] : [],
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Finance · Payouts
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Period payouts
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                System aggregates money attributions for the period, documents fee defaults, and
                routes approval Finance → CEO or Admin → mark paid.
              </p>
            </div>
            {canMutate && (
              <button
                type="button"
                onClick={() => {
                  setShowForm((v) => !v);
                  setPreview(null);
                  setError('');
                }}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'New payout period'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {showForm && canMutate && (
          <form onSubmit={saveBatch} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Period start</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.periodStart}
                onChange={(e) => {
                  setForm({ ...form, periodStart: e.target.value });
                  setPreview(null);
                }}
              />
            </div>
            <div>
              <label className={LABEL}>Period end</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.periodEnd}
                onChange={(e) => {
                  setForm({ ...form, periodEnd: e.target.value });
                  setPreview(null);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Notes</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={runPreview}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-[#1a2744] disabled:opacity-50"
              >
                {busy && !preview ? 'Calculating…' : 'Preview calculation'}
              </button>
              <button
                type="submit"
                disabled={busy || !preview}
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Save draft
              </button>
            </div>

            {preview && (
              <div className="sm:col-span-2 space-y-4">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Preview · {preview.inflowCount} inflow(s) · {preview.attributionCount}{' '}
                  attribution(s) · payable {money(preview.totalPayable)} · company retain{' '}
                  {money(preview.companyRetain)}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-2 py-1">Step</th>
                        <th className="px-2 py-1">Formula</th>
                        <th className="px-2 py-1">Inputs</th>
                        <th className="px-2 py-1">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewSteps.map((s) => (
                        <tr key={s.step} className="border-b border-slate-100 align-top">
                          <td className="px-2 py-2 font-medium text-[#1a2744]">{s.step}</td>
                          <td className="px-2 py-2 text-slate-600">{s.formula}</td>
                          <td className="px-2 py-2 text-slate-600">{s.inputs}</td>
                          <td className="px-2 py-2 text-slate-800">{s.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-2 py-1">Earner</th>
                        <th className="px-2 py-1">Category</th>
                        <th className="px-2 py-1">Share %</th>
                        <th className="px-2 py-1">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.lines.map((l, i) => (
                        <tr key={i} className="border-b border-slate-100 align-top">
                          <td className="px-2 py-2">
                            <div className="font-medium">{l.earnerName}</div>
                            <div className="text-xs text-slate-500">{l.earnerType}</div>
                          </td>
                          <td className="px-2 py-2 text-xs">{l.category ?? '—'}</td>
                          <td className="px-2 py-2">{l.sharePct.toFixed(4)}%</td>
                          <td className="px-2 py-2">{money(l.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <ListToolbar
              query={query}
              onQueryChange={setQuery}
              searchPlaceholder="Search payout batches…"
              filters={statusFilter.options.length ? [statusFilter] : []}
              filterValues={filterValues}
              onFilterChange={setFilter}
            />
            {pageItems.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openDetail(r.id)}
                className={`${CARD} w-full p-4 text-left transition hover:ring-1 hover:ring-[#e87722] ${
                  selected?.id === r.id ? 'ring-1 ring-[#e87722]' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#e87722]">{r.number}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1a2744]">
                      {dateOnly(r.periodStart)} → {dateOnly(r.periodEnd)}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Payable {money(r.totalPayable)} · Retain {money(r.companyRetain)}
                    </p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {r.status}
                  </span>
                </div>
                {r.nextApproverRole && r.nextApproverRole !== 'DONE' && (
                  <p className="mt-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-900">
                    Next: {r.nextApproverLabel}
                  </p>
                )}
              </button>
            ))}
            {!filteredCount && (
              <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
                {rows.length === 0
                  ? 'No payout batches yet. Preview a period to create one.'
                  : 'No matching payout batches.'}
              </div>
            )}
            <PaginationBar
              page={page}
              pageCount={pageCount}
              pageSize={20}
              filteredCount={filteredCount}
              onPageChange={setPage}
            />
          </div>

          <div className={`${CARD} p-5`}>
            {!selected ? (
              <p className="text-sm text-slate-500">Select a batch to see the full worksheet.</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1a2744]">{selected.number}</h2>
                      <p className="text-sm text-slate-600">
                        {dateOnly(selected.periodStart)} → {dateOnly(selected.periodEnd)} ·{' '}
                        {selected.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadPdf(`/payouts/${selected.id}/pdf`, `${selected.number}.pdf`)
                      }
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-[#1a2744]"
                    >
                      PDF
                    </button>
                  </div>
                  {selected.nextApproverRole && selected.nextApproverRole !== 'DONE' && (
                    <p className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
                      Next: {selected.nextApproverLabel}
                      {selected.nextApproverRole === 'FINANCE' && selected.status === 'APPROVED'
                        ? ' (mark paid)'
                        : ''}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">Gross inflows</p>
                    <p className="font-medium">{money(selected.grossInflows)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">Attributions</p>
                    <p className="font-medium">{money(selected.totalAttributions)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">Company retain</p>
                    <p className="font-medium">{money(selected.companyRetain)}</p>
                  </div>
                  <div className="rounded-md bg-[#fff8f2] p-2">
                    <p className="text-xs text-slate-500">Total payable</p>
                    <p className="font-semibold text-[#1a2744]">{money(selected.totalPayable)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-[#1a2744]">
                    Calculation worksheet
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-2 py-1">Step</th>
                          <th className="px-2 py-1">Formula</th>
                          <th className="px-2 py-1">Inputs</th>
                          <th className="px-2 py-1">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {steps.map((s) => (
                          <tr key={s.step} className="border-b border-slate-100 align-top">
                            <td className="px-2 py-2 font-medium text-[#1a2744]">{s.step}</td>
                            <td className="px-2 py-2 text-slate-600">{s.formula}</td>
                            <td className="px-2 py-2 text-slate-600">
                              {s.inputs}
                              {s.notes ? (
                                <p className="mt-1 text-slate-400">{s.notes}</p>
                              ) : null}
                            </td>
                            <td className="px-2 py-2 text-slate-800">{s.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-[#1a2744]">Line items</h3>
                  <div className="space-y-3">
                    {selected.lines.map((l) => (
                      <div
                        key={l.id}
                        className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <p className="font-medium text-[#1a2744]">{l.earnerName}</p>
                            <p className="text-xs text-slate-500">
                              {l.earnerType}
                              {l.category ? ` · ${l.category}` : ''}
                              {l.sharePct != null ? ` · ${l.sharePct.toFixed(4)}%` : ''}
                            </p>
                          </div>
                          <p className="font-semibold">{money(l.amount)}</p>
                        </div>
                        <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
                          {l.calcDetail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-[#1a2744]">Approver trail</h3>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>Prepared: {selected.preparedBy ?? '—'}</li>
                    <li>
                      Finance: {selected.financeReviewedBy ?? '—'}
                      {selected.financeReviewedAt
                        ? ` · ${new Date(selected.financeReviewedAt).toLocaleString()}`
                        : ''}
                    </li>
                    <li>
                      CEO/Admin: {selected.execApprovedBy ?? '—'}
                      {selected.execApprovedAt
                        ? ` · ${new Date(selected.execApprovedAt).toLocaleString()}`
                        : ''}
                    </li>
                    <li>
                      Paid: {selected.paidBy ?? '—'}
                      {selected.paidAt
                        ? ` · ${new Date(selected.paidAt).toLocaleString()}`
                        : ''}
                    </li>
                  </ul>
                </div>

                {canMutate && (
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'DRAFT' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act('submit')}
                        className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white disabled:opacity-50"
                      >
                        Submit to Finance
                      </button>
                    )}
                    {selected.status === 'PENDING_FINANCE' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act('finance-approve')}
                        className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white disabled:opacity-50"
                      >
                        Finance approve
                      </button>
                    )}
                    {selected.status === 'PENDING_EXEC' && canExec && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act('exec-approve')}
                        className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white disabled:opacity-50"
                      >
                        CEO/Admin approve
                      </button>
                    )}
                    {selected.status === 'APPROVED' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => act('mark-paid')}
                        className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white disabled:opacity-50"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
