'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Line = {
  id: string;
  monthIndex: number;
  pctDue: number;
  amountDue: number;
  amountCollected: number;
  status: string;
  dueDate: string | null;
};
type Plan = {
  id: string;
  number: string;
  purchaserName: string;
  unitPlotNo: string;
  contractPrice: number;
  totalCollected: number;
  balanceOutstanding: number;
  status: string;
  lines: Line[];
  project: { id: string; name: string } | null;
};
type Summary = {
  planCount: number;
  contractTotal: number;
  collectedTotal: number;
  outstandingTotal: number;
  monthlyInflow: number[];
  defaultSchedulePcts: number[];
};
type Client = { id: string; clientRef: string; firstName: string; lastName: string };
type Project = { id: string; name: string };

export default function InstalmentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Plan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    purchaserName: '',
    unitPlotNo: '',
    contractPrice: '',
    clientId: '',
    projectId: '',
    startDate: '',
  });

  const clientOptions = useMemo(
    () => [
      { value: '', label: 'Optional…' },
      ...clients.map((c) => ({
        value: c.id,
        label: `${c.clientRef} · ${c.firstName} ${c.lastName}`,
        keywords: `${c.clientRef} ${c.firstName} ${c.lastName}`,
      })),
    ],
    [clients],
  );

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'Optional…' },
      ...projects.map((p) => ({ value: p.id, label: p.name, keywords: p.name })),
    ],
    [projects],
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
  } = useFilteredList<Plan>({
    items: rows,
    searchKeys: [
      'number',
      'purchaserName',
      'unitPlotNo',
      'status',
      'project.name',
    ],
  });

  const load = () => {
    api<Plan[]>('/instalments').then(setRows).catch(console.error);
    api<Summary>('/instalments/summary').then(setSummary).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<Client[]>('/crm/clients').then(setClients).catch(() => setClients([]));
    api<Project[]>('/projects').then(setProjects).catch(() => setProjects([]));
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/instalments', {
        method: 'POST',
        body: JSON.stringify({
          purchaserName: form.purchaserName,
          unitPlotNo: form.unitPlotNo,
          contractPrice: Number(form.contractPrice),
          clientId: form.clientId || undefined,
          projectId: form.projectId || undefined,
          startDate: form.startDate || undefined,
        }),
      });
      setShowForm(false);
      setForm({
        purchaserName: '',
        unitPlotNo: '',
        contractPrice: '',
        clientId: '',
        projectId: '',
        startDate: '',
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    }
  }

  async function recordPay(lineId: string, amountDue: number, collected: number) {
    const remaining = Math.round((amountDue - collected) * 100) / 100;
    const raw = window.prompt(`Amount to record (remaining NGN ${remaining.toLocaleString()})`, String(remaining));
    if (!raw) return;
    const amount = Number(raw);
    if (!(amount > 0)) return;
    const paymentRef = window.prompt('Payment reference (optional)') || undefined;
    await api(`/instalments/lines/${lineId}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, paymentRef }),
    });
    load();
  }

  async function flagMissed() {
    const res = await api<{ flagged: number }>('/instalments/flag-missed', { method: 'POST' });
    window.alert(`Flagged ${res.flagged} missed instalment(s)`);
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Finance · Instalments
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Purchaser instalment inflow
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Sheet 2 six-month schedule (default 20/15/15/15/15/20%) against contract price —
                US-MON-09 / US-MON-10.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={flagMissed}
                className="rounded-lg border border-white/30 px-4 py-2 text-sm text-white"
              >
                Flag missed
              </button>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'New plan'}
              </button>
            </div>
          </div>
        </header>

        {summary && (
          <div className="grid gap-3 sm:grid-cols-4">
            <div className={`${CARD} p-4`}>
              <p className="text-xs text-slate-500">Plans</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2744]">{summary.planCount}</p>
            </div>
            <div className={`${CARD} p-4`}>
              <p className="text-xs text-slate-500">Contract total</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2744]">
                NGN {summary.contractTotal.toLocaleString()}
              </p>
            </div>
            <div className={`${CARD} p-4`}>
              <p className="text-xs text-slate-500">Collected</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2744]">
                NGN {summary.collectedTotal.toLocaleString()}
              </p>
            </div>
            <div className={`${CARD} p-4`}>
              <p className="text-xs text-slate-500">Outstanding</p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2744]">
                NGN {summary.outstandingTotal.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Purchaser name</label>
              <input
                className={INPUT}
                required
                value={form.purchaserName}
                onChange={(e) => setForm({ ...form, purchaserName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Unit / plot no.</label>
              <input
                className={INPUT}
                required
                value={form.unitPlotNo}
                onChange={(e) => setForm({ ...form, unitPlotNo: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Contract price (NGN)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                required
                value={form.contractPrice}
                onChange={(e) => setForm({ ...form, contractPrice: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Schedule start</label>
              <input
                type="date"
                className={INPUT}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>CRM client (portal link)</label>
              <SearchableSelect
                className={INPUT}
                options={clientOptions}
                value={form.clientId}
                onChange={(v) => setForm({ ...form, clientId: v })}
                emptyLabel="Optional…"
                placeholder="Search clients…"
              />
            </div>
            <div>
              <label className={LABEL}>Project</label>
              <SearchableSelect
                className={INPUT}
                options={projectOptions}
                value={form.projectId}
                onChange={(v) => setForm({ ...form, projectId: v })}
                emptyLabel="Optional…"
                placeholder="Search projects…"
              />
            </div>
            <p className="sm:col-span-2 text-xs text-slate-500">
              Default schedule %: {(summary?.defaultSchedulePcts ?? [20, 15, 15, 15, 15, 20]).join(' / ')}
            </p>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white"
              >
                Create 6-month plan
              </button>
            </div>
          </form>
        )}

        <Link href="/invoices" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Invoices
        </Link>

        {rows.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search instalment plans…"
          />
        )}

        <div className="space-y-3">
          {pageItems.map((r) => (
            <div key={r.id} className={`${CARD} p-4 space-y-3`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">
                    {r.number} · {r.status}
                  </p>
                  <h2 className="mt-1 font-semibold text-[#1a2744]">
                    {r.purchaserName} · {r.unitPlotNo}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Contract NGN {r.contractPrice.toLocaleString()} · Collected NGN{' '}
                    {r.totalCollected.toLocaleString()} · Outstanding NGN{' '}
                    {r.balanceOutstanding.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-1 pr-2">Month</th>
                      <th className="py-1 pr-2">%</th>
                      <th className="py-1 pr-2">Due</th>
                      <th className="py-1 pr-2">Collected</th>
                      <th className="py-1 pr-2">Status</th>
                      <th className="py-1">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.lines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-100">
                        <td className="py-1.5 pr-2">M{l.monthIndex}</td>
                        <td className="py-1.5 pr-2">{l.pctDue}%</td>
                        <td className="py-1.5 pr-2">{l.amountDue.toLocaleString()}</td>
                        <td className="py-1.5 pr-2">{l.amountCollected.toLocaleString()}</td>
                        <td className="py-1.5 pr-2">{l.status}</td>
                        <td className="py-1.5">
                          {l.status !== 'PAID' && r.status === 'ACTIVE' && (
                            <button
                              type="button"
                              className="text-[#e87722] hover:underline"
                              onClick={() =>
                                recordPay(l.id, l.amountDue, l.amountCollected)
                              }
                            >
                              Record pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No purchaser instalment plans yet.
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
