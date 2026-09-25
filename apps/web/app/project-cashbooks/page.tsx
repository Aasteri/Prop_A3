'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyProjectGate } from '@/components/EmptyEntityGate';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = {
  id: string;
  name: string;
  location: string | null;
  projectNumber?: string | null;
  site?: { code: string };
};

type CashbookLine = {
  id?: string;
  sn: number;
  entryDate: string | null;
  description: string | null;
  received: string | number | null;
  balanceInAcc: string | number | null;
  qty: string | number | null;
  unit: string | null;
  rate: string | number | null;
  amount: string | number | null;
  total: string | number | null;
  remark: string | null;
};

type Cashbook = {
  id: string;
  number: string;
  projectId: string;
  projectCode: string | null;
  title: string | null;
  notes: string | null;
  project: { id: string; name: string; projectNumber?: string | null; site?: { code: string } };
  lines: CashbookLine[];
};

type LineForm = {
  sn: string;
  entryDate: string;
  received: string;
  balanceInAcc: string;
  description: string;
  qty: string;
  unit: string;
  rate: string;
  amount: string;
  total: string;
  remark: string;
};

function emptyLine(sn: number): LineForm {
  return {
    sn: String(sn),
    entryDate: '',
    received: '',
    balanceInAcc: '',
    description: '',
    qty: '',
    unit: '',
    rate: '',
    amount: '',
    total: '',
    remark: '',
  };
}

function lineFromApi(l: CashbookLine): LineForm {
  return {
    sn: String(l.sn),
    entryDate: (l.entryDate ?? '').slice(0, 10),
    received: l.received != null ? String(l.received) : '',
    balanceInAcc: l.balanceInAcc != null ? String(l.balanceInAcc) : '',
    description: l.description ?? '',
    qty: l.qty != null ? String(l.qty) : '',
    unit: l.unit ?? '',
    rate: l.rate != null ? String(l.rate) : '',
    amount: l.amount != null ? String(l.amount) : '',
    total: l.total != null ? String(l.total) : '',
    remark: l.remark ?? '',
  };
}

function num(v: string) {
  if (v === '' || v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineSummaries(items: LineForm[]) {
  let running = 0;
  let totalReceived = 0;
  let totalSpent = 0;
  const withBalance = items.map((l) => {
    const received = num(l.received);
    const amount = num(l.amount);
    totalReceived += received;
    totalSpent += amount;
    running += received - amount;
    return { ...l, runningBalance: running };
  });
  return {
    lines: withBalance,
    totalReceived,
    totalSpent,
    net: totalReceived - totalSpent,
  };
}

export default function ProjectCashbooksPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<Cashbook[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Cashbook | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    projectCode: '',
    title: '',
    notes: '',
  });
  const [createLines, setCreateLines] = useState<LineForm[]>([emptyLine(1)]);
  const [editLines, setEditLines] = useState<LineForm[]>([emptyLine(1)]);

  const canManage =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'FINANCE';

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'Select…' },
      ...projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    ],
    [projects],
  );

  const createSummary = useMemo(() => lineSummaries(createLines), [createLines]);
  const editSummary = useMemo(() => lineSummaries(editLines), [editLines]);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<Cashbook>({
    items: rows,
    searchKeys: ['number', 'projectCode', 'title', 'project.name', 'notes'],
  });

  const load = () => {
    api<Cashbook[]>('/project-cashbooks').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
    api<Project[]>('/projects').then(setProjects).catch(console.error);
  }, [router]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    api<Cashbook>(`/project-cashbooks/${selectedId}`)
      .then((row) => {
        setDetail(row);
        setEditLines(row.lines.length ? row.lines.map(lineFromApi) : [emptyLine(1)]);
      })
      .catch(console.error);
  }, [selectedId]);

  function updateCreateLine(i: number, patch: Partial<LineForm>) {
    setCreateLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function updateEditLine(i: number, patch: Partial<LineForm>) {
    setEditLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function serializeLines(items: LineForm[]) {
    return items
      .filter(
        (l) =>
          l.description.trim() ||
          l.received ||
          l.amount ||
          l.entryDate ||
          l.qty ||
          l.rate,
      )
      .map((l, i) => ({
        sn: Number(l.sn) || i + 1,
        entryDate: l.entryDate || undefined,
        description: l.description.trim() || undefined,
        received: l.received ? Number(l.received) : undefined,
        balanceInAcc: l.balanceInAcc !== '' ? Number(l.balanceInAcc) : undefined,
        qty: l.qty ? Number(l.qty) : undefined,
        unit: l.unit || undefined,
        rate: l.rate ? Number(l.rate) : undefined,
        amount: l.amount ? Number(l.amount) : undefined,
        total: l.total !== '' ? Number(l.total) : undefined,
        remark: l.remark || undefined,
      }));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const created = await api<Cashbook>('/project-cashbooks', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          projectCode: form.projectCode || undefined,
          title: form.title || undefined,
          notes: form.notes || undefined,
          lines: serializeLines(createLines),
        }),
      });
      setShowForm(false);
      setForm({ projectId: '', projectCode: '', title: '', notes: '' });
      setCreateLines([emptyLine(1)]);
      load();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cashbook');
    } finally {
      setBusy(false);
    }
  }

  async function saveLines() {
    if (!detail || !canManage) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api<Cashbook>(`/project-cashbooks/${detail.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          projectCode: detail.projectCode ?? undefined,
          title: detail.title ?? undefined,
          notes: detail.notes ?? undefined,
          lines: serializeLines(editLines),
        }),
      });
      setDetail(updated);
      setEditLines(
        updated.lines.length ? updated.lines.map(lineFromApi) : [emptyLine(1)],
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lines');
    } finally {
      setBusy(false);
    }
  }

  function openDetail(row: Cashbook) {
    setSelectedId(row.id);
    setError('');
  }

  function renderSummaryBar(summary: ReturnType<typeof lineSummaries>) {
    return (
      <div className="grid gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm sm:grid-cols-3">
        <p>
          <span className="text-slate-500">Total received · </span>
          <span className="font-medium text-[#1a2744]">
            {formatMoney(summary.totalReceived)}
          </span>
        </p>
        <p>
          <span className="text-slate-500">Total spent · </span>
          <span className="font-medium text-[#1a2744]">
            {formatMoney(summary.totalSpent)}
          </span>
        </p>
        <p>
          <span className="text-slate-500">Net · </span>
          <span
            className={`font-medium ${summary.net < 0 ? 'text-red-600' : 'text-[#1a2744]'}`}
          >
            {formatMoney(summary.net)}
          </span>
        </p>
      </div>
    );
  }

  function renderLineFields(
    line: LineForm & { runningBalance?: number },
    i: number,
    update: (i: number, patch: Partial<LineForm>) => void,
    opts?: { requiredFirst?: boolean; compact?: boolean },
  ) {
    const cols = opts?.compact ? 'sm:grid-cols-3' : 'sm:grid-cols-6';
    return (
      <div key={i} className={`grid gap-2 rounded-lg border border-slate-200 p-3 ${cols}`}>
        <div>
          <label className={LABEL}>S/N</label>
          <input
            className={INPUT}
            value={line.sn}
            onChange={(e) => update(i, { sn: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>ITEM No./DATE</label>
          <input
            type="date"
            className={INPUT}
            value={line.entryDate}
            onChange={(e) => update(i, { entryDate: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>RECEIVED</label>
          <input
            type="number"
            min={0}
            step="any"
            className={INPUT}
            value={line.received}
            onChange={(e) => update(i, { received: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>BALANCE IN ACC</label>
          <input
            type="number"
            step="any"
            className={INPUT}
            value={line.balanceInAcc}
            onChange={(e) => update(i, { balanceInAcc: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>JOB/ITEM DESCRIPTION</label>
          <input
            className={INPUT}
            required={opts?.requiredFirst && i === 0}
            value={line.description}
            onChange={(e) => update(i, { description: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>Qty</label>
          <input
            type="number"
            min={0}
            step="any"
            className={INPUT}
            value={line.qty}
            onChange={(e) => update(i, { qty: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>Unit</label>
          <input
            className={INPUT}
            value={line.unit}
            onChange={(e) => update(i, { unit: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>Rate</label>
          <input
            type="number"
            min={0}
            step="any"
            className={INPUT}
            value={line.rate}
            onChange={(e) => update(i, { rate: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>Amount</label>
          <input
            type="number"
            min={0}
            step="any"
            className={INPUT}
            value={line.amount}
            onChange={(e) => update(i, { amount: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>Total</label>
          <input
            type="number"
            step="any"
            className={INPUT}
            value={line.total}
            onChange={(e) => update(i, { total: e.target.value })}
          />
        </div>
        <div>
          <label className={LABEL}>Running balance</label>
          <input
            className={INPUT}
            readOnly
            value={
              line.runningBalance != null ? formatMoney(line.runningBalance) : ''
            }
          />
        </div>
        <div className={opts?.compact ? 'sm:col-span-3' : 'sm:col-span-2'}>
          <label className={LABEL}>Remark</label>
          <input
            className={INPUT}
            value={line.remark}
            onChange={(e) => update(i, { remark: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Cashbook
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Project cashbooks
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Site expenses and inflow record: received, spend lines, and running balance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/projects-hub"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
              >
                Projects hub
              </Link>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
                >
                  {showForm ? 'Cancel' : 'New cashbook'}
                </button>
              )}
            </div>
          </div>
        </header>

        {!projects.length ? (
          <EmptyProjectGate moduleLabel="project cashbooks" />
        ) : (
          <>
            {showForm && canManage && (
              <form onSubmit={onCreate} className={`${CARD} space-y-4 p-6`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Project</label>
                    <SearchableSelect
                      className={INPUT}
                      required
                      options={projectOptions}
                      value={form.projectId}
                      onChange={(id) => {
                        const p = projects.find((x) => x.id === id);
                        setForm({
                          ...form,
                          projectId: id,
                          projectCode:
                            p?.projectNumber ?? p?.site?.code ?? form.projectCode,
                          title: form.title || (p ? `Expenses & inflow — ${p.name}` : ''),
                        });
                      }}
                      emptyLabel="Select…"
                      placeholder="Search projects…"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Project code</label>
                    <input
                      className={INPUT}
                      value={form.projectCode}
                      onChange={(e) => setForm({ ...form, projectCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Title</label>
                    <input
                      className={INPUT}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#1a2744]">Line rows</h2>
                    <button
                      type="button"
                      className="text-sm text-[#e87722] hover:underline"
                      onClick={() =>
                        setCreateLines((prev) => [...prev, emptyLine(prev.length + 1)])
                      }
                    >
                      Add row
                    </button>
                  </div>
                  {renderSummaryBar(createSummary)}
                  <div className="mt-3 space-y-3">
                    {createSummary.lines.map((line, i) =>
                      renderLineFields(line, i, updateCreateLine, { requiredFirst: true }),
                    )}
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Create cashbook'}
                </button>
              </form>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                {rows.length > 0 && (
                  <ListToolbar
                    query={query}
                    onQueryChange={setQuery}
                    searchPlaceholder="Search project cashbooks…"
                  />
                )}
                <div className={`${CARD} divide-y divide-slate-100`}>
                  {pageItems.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => openDetail(r)}
                      className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${
                        selectedId === r.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <p className="font-medium text-[#1a2744]">{r.number}</p>
                      <p className="text-sm text-slate-600">
                        {r.title ?? r.project.name}
                        {r.projectCode ? ` · ${r.projectCode}` : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.lines?.length ?? 0} line{(r.lines?.length ?? 0) === 1 ? '' : 's'}
                      </p>
                    </button>
                  ))}
                  {!rows.length && (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">
                      No project cashbooks yet.
                    </p>
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

              <div className={`${CARD} p-5`}>
                {!detail ? (
                  <p className="text-sm text-slate-500">Select a cashbook to view lines.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1a2744]">{detail.number}</h2>
                      <p className="text-sm text-slate-600">
                        {detail.title ?? detail.project.name}
                        {detail.projectCode ? ` · ${detail.projectCode}` : ''}
                      </p>
                    </div>

                    {canManage ? (
                      <>
                        {renderSummaryBar(editSummary)}
                        <div className="space-y-3">
                          {editSummary.lines.map((line, i) =>
                            renderLineFields(line, i, updateEditLine, { compact: true }),
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-sm text-[#e87722] hover:underline"
                            onClick={() =>
                              setEditLines((prev) => [...prev, emptyLine(prev.length + 1)])
                            }
                          >
                            Add row
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={saveLines}
                            className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                          >
                            {busy ? 'Saving…' : 'Save lines'}
                          </button>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                      </>
                    ) : (
                      <>
                        {renderSummaryBar(
                          lineSummaries(detail.lines.map(lineFromApi)),
                        )}
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead className="border-b text-xs uppercase text-slate-500">
                              <tr>
                                <th className="py-2 pr-3">S/N</th>
                                <th className="py-2 pr-3">Date</th>
                                <th className="py-2 pr-3">Description</th>
                                <th className="py-2 pr-3">Received</th>
                                <th className="py-2 pr-3">Amount</th>
                                <th className="py-2">Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lineSummaries(detail.lines.map(lineFromApi)).lines.map(
                                (l) => (
                                  <tr
                                    key={l.sn}
                                    className="border-b border-slate-100"
                                  >
                                    <td className="py-2 pr-3">{l.sn}</td>
                                    <td className="py-2 pr-3">
                                      {l.entryDate || '—'}
                                    </td>
                                    <td className="py-2 pr-3">
                                      {l.description || '—'}
                                    </td>
                                    <td className="py-2 pr-3">
                                      {l.received ? formatMoney(num(l.received)) : '—'}
                                    </td>
                                    <td className="py-2 pr-3">
                                      {l.amount ? formatMoney(num(l.amount)) : '—'}
                                    </td>
                                    <td className="py-2">
                                      {formatMoney(l.runningBalance)}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
