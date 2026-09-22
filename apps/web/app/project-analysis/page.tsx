'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, downloadPdf, getToken } from '@/lib/api';
import { BTN_GHOST_ON_DARK, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type Analysis = {
  project: {
    id: string;
    name: string;
    processGroup: string;
    status: string;
    site: { code: string; name: string };
  };
  milestones: { stage: string; progressPct: number; certifiedAt: string | null }[];
  dailyLogCount: number;
  openChanges: number;
  recentChanges: {
    changeId: string;
    status: string;
    impactLevel: string | null;
    description: string;
  }[];
  inspections: {
    total: number;
    fail: number;
    recent: {
      number: string;
      category: string;
      result: string;
      inspectedAt: string;
    }[];
  };
  qcPlans: { number: string; title: string; status: string; itemCount: number }[];
  progressReports: { number: string; status: string; createdAt: string }[];
  finance: {
    spendTotal: number;
    budgetRemaining: number | null;
    invoiceBilled: number;
    invoicePaid: number;
    project: { budgetAmount: number | null };
  };
};

function naira(n: number) {
  return `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function AnalysisInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(search.get('projectId') ?? '');
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState('');

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
    setError('');
    api<Analysis>(`/project-ops/projects/${pid}/analysis`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Project[]>('/projects')
      .then((list) => {
        setProjects(list);
        const initial = search.get('projectId') || list[0]?.id || '';
        setProjectId(initial);
        if (initial) load(initial);
      })
      .catch(console.error);
  }, [router, search]);

  return (
    <div className="space-y-6">
      <header className={PAGE_HEADER}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
          Projects · Monitor · Analysis
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Project analysis
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
              Plan vs actual snapshot: milestones, changes, QC, progress, and finance in one view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/project-finance" className={BTN_GHOST_ON_DARK}>
              Finance
            </Link>
            {projectId && (
              <button
                type="button"
                className={BTN_GHOST_ON_DARK}
                onClick={() =>
                  downloadPdf(
                    `/project-ops/projects/${projectId}/analysis.pdf`,
                    `analysis-${projectId}.pdf`,
                  )
                }
              >
                Export PDF
              </button>
            )}
          </div>
        </div>
      </header>

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
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Process group', value: data.project.processGroup },
              { label: 'Daily logs', value: String(data.dailyLogCount) },
              { label: 'Open changes', value: String(data.openChanges) },
              {
                label: 'Inspection fails',
                value: `${data.inspections.fail} / ${data.inspections.total}`,
              },
            ].map((s) => (
              <div key={s.label} className={`${CARD} p-4`}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {s.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#1a2744]">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className={`${CARD} p-4`}>
              <h2 className="font-semibold text-[#1a2744]">Milestones</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.milestones.map((m) => (
                  <li key={m.stage} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                    <span>{m.stage}</span>
                    <span className="font-medium">{m.progressPct}%</span>
                  </li>
                ))}
                {!data.milestones.length && (
                  <li className="text-slate-500">No milestones yet.</li>
                )}
              </ul>
              <Link href="/milestones" className="mt-3 inline-block text-sm text-[#e87722]">
                Open milestones →
              </Link>
            </section>

            <section className={`${CARD} p-4`}>
              <h2 className="font-semibold text-[#1a2744]">Finance pulse</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Budget</span>
                  <span>
                    {data.finance.project.budgetAmount != null
                      ? naira(data.finance.project.budgetAmount)
                      : '—'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Spend</span>
                  <span>{naira(data.finance.spendTotal)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Invoiced / paid</span>
                  <span>
                    {naira(data.finance.invoiceBilled)} / {naira(data.finance.invoicePaid)}
                  </span>
                </li>
              </ul>
              <Link
                href={`/project-finance?projectId=${projectId}`}
                className="mt-3 inline-block text-sm text-[#e87722]"
              >
                Full finance report →
              </Link>
            </section>

            <section className={`${CARD} p-4`}>
              <h2 className="font-semibold text-[#1a2744]">Recent changes</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.recentChanges.slice(0, 6).map((c) => (
                  <li key={c.changeId} className="border-b pb-2 last:border-0">
                    <span className="font-medium">{c.changeId}</span>{' '}
                    <span className="text-slate-500">{c.status}</span>
                    <p className="text-slate-600">{c.description}</p>
                  </li>
                ))}
                {!data.recentChanges.length && (
                  <li className="text-slate-500">No change log entries.</li>
                )}
              </ul>
              <Link href="/change-log" className="mt-3 inline-block text-sm text-[#e87722]">
                Change log →
              </Link>
            </section>

            <section className={`${CARD} p-4`}>
              <h2 className="font-semibold text-[#1a2744]">QC & progress</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.qcPlans.map((p) => (
                  <li key={p.number} className="flex justify-between gap-2">
                    <span>
                      {p.number} · {p.title}
                    </span>
                    <span className="text-slate-500">
                      {p.status} · {p.itemCount} items
                    </span>
                  </li>
                ))}
                {data.progressReports.slice(0, 4).map((p) => (
                  <li key={p.number} className="flex justify-between gap-2 text-slate-600">
                    <span>{p.number}</span>
                    <span>{p.status}</span>
                  </li>
                ))}
                {!data.qcPlans.length && !data.progressReports.length && (
                  <li className="text-slate-500">No QC plans or progress reports yet.</li>
                )}
              </ul>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/qc-plans" className="text-sm text-[#e87722]">
                  QC plans →
                </Link>
                <Link href="/inspections" className="text-sm text-[#e87722]">
                  Inspections →
                </Link>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/progress-reports" className={BTN_SECONDARY}>
              Progress reports
            </Link>
            <Link href="/cost-trackers" className={BTN_SECONDARY}>
              Cost trackers
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectAnalysisPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <AnalysisInner />
      </Suspense>
    </AppShell>
  );
}
