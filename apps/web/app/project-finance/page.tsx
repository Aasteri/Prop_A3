'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyProjectGate } from '@/components/EmptyEntityGate';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, downloadFile, downloadPdf, getToken, getUser, type AuthUser } from '@/lib/api';
import { BTN_GHOST_ON_DARK, BTN_PRIMARY, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type Finance = {
  project: {
    id: string;
    name: string;
    budgetAmount: number | null;
    budgetRange: string | null;
    processGroup: string;
    status: string;
    site: { code: string; name: string };
  };
  sections: { key: string; label: string; amount: number }[];
  spendTotal: number;
  budgetRemaining: number | null;
  invoiceBilled: number;
  invoicePaid: number;
};

function naira(n: number) {
  return `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function FinanceInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(search.get('projectId') ?? '');
  const [data, setData] = useState<Finance | null>(null);
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canBudget =
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER' ||
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
      setData(null);
      return;
    }
    api<Finance>(`/project-ops/projects/${pid}/finance`)
      .then((f) => {
        setData(f);
        setBudget(f.project.budgetAmount != null ? String(f.project.budgetAmount) : '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
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

  async function saveBudget(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !canBudget) return;
    setBusy(true);
    setError('');
    try {
      await api(`/project-ops/projects/${projectId}/budget`, {
        method: 'PATCH',
        body: JSON.stringify({
          budgetAmount: budget.trim() === '' ? null : Number(budget),
        }),
      });
      load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set budget');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className={PAGE_HEADER}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
          Projects · Monitor · Finance
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Project finance report
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
              Budget vs spend across materials, workforce, subcontractors, and client invoices.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/project-analysis" className={BTN_GHOST_ON_DARK}>
              Analysis
            </Link>
            {projectId && (
              <>
                <button
                  type="button"
                  className={BTN_GHOST_ON_DARK}
                  onClick={() =>
                    downloadPdf(
                      `/project-ops/projects/${projectId}/finance.pdf`,
                      `finance-${projectId}.pdf`,
                    )
                  }
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  className={BTN_GHOST_ON_DARK}
                  onClick={() =>
                    downloadFile(
                      `/project-ops/projects/${projectId}/finance.csv`,
                      `finance-${projectId}.csv`,
                    )
                  }
                >
                  Export CSV
                </button>
              </>
            )}
          </div>
        </div>
      </header>

        {!projects.length ? (
          <EmptyProjectGate moduleLabel="project finance" />
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
          </>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`${CARD} p-4`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget</p>
              <p className="mt-1 text-xl font-semibold text-[#1a2744]">
                {data.project.budgetAmount != null
                  ? naira(data.project.budgetAmount)
                  : data.project.budgetRange ?? 'Not set'}
              </p>
            </div>
            <div className={`${CARD} p-4`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Spend total
              </p>
              <p className="mt-1 text-xl font-semibold text-[#1a2744]">
                {naira(data.spendTotal)}
              </p>
            </div>
            <div className={`${CARD} p-4`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Remaining
              </p>
              <p className="mt-1 text-xl font-semibold text-[#1a2744]">
                {data.budgetRemaining != null ? naira(data.budgetRemaining) : '—'}
              </p>
            </div>
          </div>

          {canBudget && (
            <form onSubmit={saveBudget} className={`${CARD} flex flex-wrap items-end gap-3 p-4`}>
              <label className="block min-w-[12rem] flex-1 text-sm">
                <span className={LABEL}>Set budget amount (₦)</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={INPUT}
                  placeholder="Leave blank to clear"
                />
              </label>
              <button type="submit" disabled={busy} className={BTN_PRIMARY}>
                {busy ? 'Saving…' : 'Save budget'}
              </button>
            </form>
          )}

          <div className={`${CARD} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Section</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.sections.map((s) => (
                  <tr key={s.key} className="border-b last:border-0">
                    <td className="px-3 py-2">{s.label}</td>
                    <td className="px-3 py-2 text-right font-medium">{naira(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/cost-trackers" className={BTN_SECONDARY}>
              Cost trackers
            </Link>
            <Link href="/invoices" className={BTN_SECONDARY}>
              Client invoices
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectFinancePage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <FinanceInner />
      </Suspense>
    </AppShell>
  );
}
