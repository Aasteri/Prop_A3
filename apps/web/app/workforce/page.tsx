'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyProjectGate } from '@/components/EmptyEntityGate';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type Entry = {
  id: string;
  workDate: string;
  workerName: string;
  trade: string | null;
  hoursWorked: string | number;
  ratePerHour: string | number;
  amountPaid: string | number;
  paymentRef: string | null;
  notes: string | null;
};

const empty = {
  workDate: new Date().toISOString().slice(0, 10),
  workerName: '',
  trade: '',
  hoursWorked: '8',
  ratePerHour: '',
  amountPaid: '',
  paymentRef: '',
  notes: '',
};

function naira(n: number) {
  return `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function WorkforceInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(search.get('projectId') ?? '');
  const [rows, setRows] = useState<Entry[]>([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canManage =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'FOREMAN' ||
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

  const load = (pid: string) => {
    if (!pid) {
      setRows([]);
      return;
    }
    api<Entry[]>(`/project-ops/projects/${pid}/workforce`)
      .then(setRows)
      .catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<Project[]>('/projects')
      .then((list) => {
        setProjects(list);
        const initial = search.get('projectId') || list[0]?.id || '';
        setProjectId(initial);
        if (initial) load(initial);
      })
      .catch(console.error);
  }, [router, search]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setError('');
    setBusy(true);
    try {
      await api(`/project-ops/projects/${projectId}/workforce`, {
        method: 'POST',
        body: JSON.stringify({
          workDate: form.workDate,
          workerName: form.workerName,
          trade: form.trade || undefined,
          hoursWorked: Number(form.hoursWorked),
          ratePerHour: Number(form.ratePerHour),
          amountPaid: form.amountPaid ? Number(form.amountPaid) : undefined,
          paymentRef: form.paymentRef || undefined,
          notes: form.notes || undefined,
        }),
      });
      setForm(empty);
      setShowForm(false);
      load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this workforce entry?')) return;
    await api(`/project-ops/workforce/${id}`, { method: 'DELETE' });
    load(projectId);
  }

  const totalPaid = rows.reduce((s, r) => s + Number(r.amountPaid), 0);

  return (
    <div className="space-y-6">
      <header className={PAGE_HEADER}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
          Projects · Execute · Workforce
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Workforce time & pay
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
              Person-day capture separate from labour schedule planning. Feeds cost trackers and
              project finance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/cost-trackers"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
            >
              Cost trackers
            </Link>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'Add entry'}
              </button>
            )}
          </div>
        </div>
      </header>

        {!projects.length ? (
          <EmptyProjectGate moduleLabel="workforce entries" />
        ) : (
          <>

      <div className={`${CARD} p-4 sm:p-5`}>
        <label className={LABEL}>Project</label>
        <SearchableSelect
          className={INPUT}
          options={projectOptions}
          value={projectId}
          onChange={(v) => {
            setProjectId(v);
            load(v);
          }}
          emptyLabel="Select…"
          placeholder="Search projects…"
        />
        {projectId && (
          <p className="mt-2 text-sm text-slate-500">
            {rows.length} entries · paid {naira(totalPaid)}
          </p>
        )}
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
          <label className="block text-sm">
            <span className={LABEL}>Work date</span>
            <input
              type="date"
              required
              value={form.workDate}
              onChange={(e) => setForm({ ...form, workDate: e.target.value })}
              className={INPUT}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Worker name</span>
            <input
              required
              value={form.workerName}
              onChange={(e) => setForm({ ...form, workerName: e.target.value })}
              className={INPUT}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Trade</span>
            <input
              value={form.trade}
              onChange={(e) => setForm({ ...form, trade: e.target.value })}
              className={INPUT}
              placeholder="Mason, carpenter…"
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Hours worked</span>
            <input
              type="number"
              min={0.25}
              step={0.25}
              required
              value={form.hoursWorked}
              onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
              className={INPUT}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Rate per hour (₦)</span>
            <input
              type="number"
              min={0}
              step={1}
              required
              value={form.ratePerHour}
              onChange={(e) => setForm({ ...form, ratePerHour: e.target.value })}
              className={INPUT}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Amount paid (optional)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.amountPaid}
              onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
              className={INPUT}
              placeholder="Defaults to hours × rate"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className={LABEL}>Payment ref</span>
            <input
              value={form.paymentRef}
              onChange={(e) => setForm({ ...form, paymentRef: e.target.value })}
              className={INPUT}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className={LABEL}>Notes</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={INPUT}
            />
          </label>
          {error && (
            <p className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={busy} className={BTN_PRIMARY}>
              {busy ? 'Saving…' : 'Save entry'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={BTN_SECONDARY}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={`${CARD} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Worker</th>
              <th className="px-3 py-2">Trade</th>
              <th className="px-3 py-2">Hours</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Paid</th>
              <th className="px-3 py-2">Ref</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-3 py-2">{new Date(r.workDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{r.workerName}</td>
                <td className="px-3 py-2">{r.trade ?? '—'}</td>
                <td className="px-3 py-2">{Number(r.hoursWorked)}</td>
                <td className="px-3 py-2">{naira(Number(r.ratePerHour))}</td>
                <td className="px-3 py-2">{naira(Number(r.amountPaid))}</td>
                <td className="px-3 py-2">{r.paymentRef ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  No workforce entries for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
          </>
        )}
    </div>
  );
}

export default function WorkforcePage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <WorkforceInner />
      </Suspense>
    </AppShell>
  );
}
