'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyProjectGate } from '@/components/EmptyEntityGate';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken } from '@/lib/api';
import { BTN_GHOST_ON_DARK, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type Trackers = {
  materials: {
    rows: {
      requestRef: string;
      status: string;
      material: string;
      unit: string | null;
      quantityIssued: number;
      quantityRequested: number;
      unitCost: number | null;
      amount: number | null;
    }[];
    totalCost: number;
  };
  workforce: {
    rows: {
      id: string;
      workDate: string;
      workerName: string;
      trade: string | null;
      hoursWorked: string | number;
      ratePerHour: string | number;
      amountPaid: string | number;
    }[];
    totalPaid: number;
  };
  subcontractors: {
    rows: {
      id: string;
      number: string;
      subcontractorName: string;
      contractSum: number;
      paidToDate: number;
      balance: number;
      status: string;
      ivcCount: number;
    }[];
    totalPaid: number;
  };
  labourPlannedTotal: number;
  combinedTotal: number;
};

function naira(n: number) {
  return `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function CostTrackersPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [data, setData] = useState<Trackers | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'materials' | 'workforce' | 'subcontractors'>('materials');

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'Select project…' },
      ...projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    ],
    [projects],
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Project[]>('/projects')
      .then((list) => {
        setProjects(list);
        if (list[0]) setProjectId(list[0].id);
      })
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    if (!projectId) {
      setData(null);
      return;
    }
    setError('');
    api<Trackers>(`/project-ops/projects/${projectId}/trackers`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trackers'));
  }, [projectId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Execute · Cost trackers
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Materials · Workforce · Subcontractors
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Usage and cost roll-up per project. Capture unit costs on material requests and
                workforce pay separately from labour planning.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/workforce" className={BTN_GHOST_ON_DARK}>
                Workforce form
              </Link>
              <Link href="/project-finance" className={BTN_GHOST_ON_DARK}>
                Finance report
              </Link>
            </div>
          </div>
        </header>

        {!projects.length ? (
          <EmptyProjectGate moduleLabel="cost trackers" />
        ) : (
          <>
        <div className={`${CARD} p-4 sm:p-5`}>
          <label className={LABEL}>Project</label>
          <SearchableSelect
            className={INPUT}
            options={projectOptions}
            value={projectId}
            onChange={setProjectId}
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
                { label: 'Materials', value: data.materials.totalCost },
                { label: 'Workforce paid', value: data.workforce.totalPaid },
                { label: 'Subcontractors paid', value: data.subcontractors.totalPaid },
                { label: 'Combined spend', value: data.combinedTotal },
              ].map((s) => (
                <div key={s.label} className={`${CARD} p-4`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {s.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[#1a2744]">{naira(s.value)}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['materials', 'Materials'],
                  ['workforce', 'Workforce'],
                  ['subcontractors', 'Subcontractors'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={
                    tab === key
                      ? 'rounded-lg bg-[#1a2744] px-3 py-1.5 text-sm text-white'
                      : BTN_SECONDARY
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'materials' && (
              <div className={`${CARD} overflow-x-auto`}>
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Request</th>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit cost</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.materials.rows.map((r, i) => (
                      <tr key={`${r.requestRef}-${i}`} className="border-b last:border-0">
                        <td className="px-3 py-2">{r.requestRef}</td>
                        <td className="px-3 py-2">{r.material}</td>
                        <td className="px-3 py-2">
                          {r.quantityIssued || r.quantityRequested} {r.unit ?? ''}
                        </td>
                        <td className="px-3 py-2">
                          {r.unitCost != null ? naira(r.unitCost) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {r.amount != null ? naira(r.amount) : '—'}
                        </td>
                        <td className="px-3 py-2">{r.status.replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                    {!data.materials.rows.length && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                          No material lines yet.{' '}
                          <Link href="/material-requests/new" className="text-[#e87722]">
                            Create a request
                          </Link>{' '}
                          with unit cost.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'workforce' && (
              <div className={`${CARD} overflow-x-auto`}>
                <div className="flex justify-end border-b p-3">
                  <Link href={`/workforce?projectId=${projectId}`} className="text-sm text-[#e87722]">
                    Add workforce entry →
                  </Link>
                </div>
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Worker</th>
                      <th className="px-3 py-2">Trade</th>
                      <th className="px-3 py-2">Hours</th>
                      <th className="px-3 py-2">Rate</th>
                      <th className="px-3 py-2">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workforce.rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          {new Date(r.workDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">{r.workerName}</td>
                        <td className="px-3 py-2">{r.trade ?? '—'}</td>
                        <td className="px-3 py-2">{Number(r.hoursWorked)}</td>
                        <td className="px-3 py-2">{naira(Number(r.ratePerHour))}</td>
                        <td className="px-3 py-2">{naira(Number(r.amountPaid))}</td>
                      </tr>
                    ))}
                    {!data.workforce.rows.length && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                          No workforce entries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'subcontractors' && (
              <div className={`${CARD} overflow-x-auto`}>
                <div className="flex justify-end border-b p-3">
                  <Link href="/procurement/works" className="text-sm text-[#e87722]">
                    Works contracts →
                  </Link>
                </div>
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Contract</th>
                      <th className="px-3 py-2">Subcontractor</th>
                      <th className="px-3 py-2">Sum</th>
                      <th className="px-3 py-2">Paid (IVC)</th>
                      <th className="px-3 py-2">Balance</th>
                      <th className="px-3 py-2">IVCs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subcontractors.rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="px-3 py-2">{r.number}</td>
                        <td className="px-3 py-2">{r.subcontractorName}</td>
                        <td className="px-3 py-2">{naira(r.contractSum)}</td>
                        <td className="px-3 py-2">{naira(r.paidToDate)}</td>
                        <td className="px-3 py-2">{naira(r.balance)}</td>
                        <td className="px-3 py-2">{r.ivcCount}</td>
                      </tr>
                    ))}
                    {!data.subcontractors.rows.length && (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                          No works contracts linked to this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
          </>
        )}
      </div>
    </AppShell>
  );
}
