'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, downloadPdf, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string };
type WorksContract = {
  id: string;
  number: string;
  projectId: string;
  subcontractorName: string;
  scopeSummary: string;
  contractSum: string | number;
};
type Stage = {
  sn: number;
  stage: string;
  measuredPct: number | null;
  amountPaid: number | null;
  pctPaid: number | null;
  datePaid: string | null;
  performanceComment: string;
};
type Ivc = {
  id: string;
  number: string;
  status: string;
  workDescription: string;
  subcontractorName: string;
  contractAmount: string | number;
  stagesJson: Stage[];
  recommendation: string | null;
  pmSignedAt: string | null;
  supervisorSignedAt: string | null;
  subcontractorSignedAt: string | null;
  project: Project;
};

export default function IvcsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<Ivc[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<WorksContract[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    worksContractId: '',
    workDescription: '',
    subcontractorName: '',
    accountDetails: '',
    scopeOfWork: '',
    contractReference: '',
    contractAmount: '',
    deliveryPeriod: '',
    recommendation: '',
  });

  const canManage =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'FINANCE';

  const load = () => {
    api<Ivc[]>('/ivcs')
      .then((data) =>
        setRows(
          data.map((r) => ({
            ...r,
            stagesJson: Array.isArray(r.stagesJson) ? r.stagesJson : [],
          })),
        ),
      )
      .catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
    api<Project[]>('/projects').then(setProjects).catch(console.error);
    api<WorksContract[]>('/works').then(setContracts).catch(() => setContracts([]));
    api<Stage[]>('/ivcs/default-stages').then(setStages).catch(() => setStages([]));
  }, [router]);

  function onContractChange(id: string) {
    const wc = contracts.find((c) => c.id === id);
    if (!wc) {
      setForm((f) => ({ ...f, worksContractId: id }));
      return;
    }
    setForm((f) => ({
      ...f,
      worksContractId: id,
      projectId: wc.projectId,
      subcontractorName: wc.subcontractorName,
      scopeOfWork: wc.scopeSummary,
      contractReference: wc.number,
      contractAmount: String(wc.contractSum),
      workDescription: f.workDescription || wc.scopeSummary,
    }));
  }

  function updateStage(i: number, patch: Partial<Stage>) {
    const next = [...stages];
    next[i] = { ...next[i], ...patch };
    setStages(next);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/ivcs', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          worksContractId: form.worksContractId || undefined,
          workDescription: form.workDescription,
          subcontractorName: form.subcontractorName,
          accountDetails: form.accountDetails || undefined,
          scopeOfWork: form.scopeOfWork,
          contractReference: form.contractReference || undefined,
          contractAmount: Number(form.contractAmount),
          deliveryPeriod: form.deliveryPeriod || undefined,
          recommendation: form.recommendation || undefined,
          stages,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create IVC');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Monitoring
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Interim valuation certificates
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Doc 6 IVC — measured % → recommendation → PM/supervisor sign-off before pay
                (US-MON-06–08).
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'New IVC'}
              </button>
            )}
          </div>
        </header>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Link href="/projects-hub" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Projects hub
        </Link>

        {showForm && (
          <form onSubmit={create} className={`${CARD} grid gap-3 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Works contract (optional)</label>
              <select
                className={INPUT}
                value={form.worksContractId}
                onChange={(e) => onContractChange(e.target.value)}
              >
                <option value="">None — enter manually</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.number} · {c.subcontractorName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Project</label>
              <select
                className={INPUT}
                required
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">Select…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Description of work</label>
              <input
                className={INPUT}
                required
                value={form.workDescription}
                onChange={(e) => setForm({ ...form, workDescription: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Subcontractor</label>
              <input
                className={INPUT}
                required
                value={form.subcontractorName}
                onChange={(e) => setForm({ ...form, subcontractorName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Contract amount (NGN)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={INPUT}
                required
                value={form.contractAmount}
                onChange={(e) => setForm({ ...form, contractAmount: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Scope / SOW</label>
              <textarea
                className={INPUT}
                rows={2}
                required
                value={form.scopeOfWork}
                onChange={(e) => setForm({ ...form, scopeOfWork: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Contract reference</label>
              <input
                className={INPUT}
                value={form.contractReference}
                onChange={(e) => setForm({ ...form, contractReference: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Delivery period</label>
              <input
                className={INPUT}
                value={form.deliveryPeriod}
                onChange={(e) => setForm({ ...form, deliveryPeriod: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Account details</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.accountDetails}
                onChange={(e) => setForm({ ...form, accountDetails: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <p className={LABEL}>Payment stages (measured % / amount paid)</p>
              {stages.map((s, i) => (
                <div key={s.sn} className="grid gap-2 rounded border border-slate-200 p-2 sm:grid-cols-4">
                  <p className="text-sm font-medium text-[#1a2744] sm:col-span-4">{s.stage}</p>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={INPUT}
                    placeholder="Measured %"
                    value={s.measuredPct ?? ''}
                    onChange={(e) =>
                      updateStage(i, {
                        measuredPct: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    className={INPUT}
                    placeholder="Amount paid"
                    value={s.amountPaid ?? ''}
                    onChange={(e) =>
                      updateStage(i, {
                        amountPaid: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={INPUT}
                    placeholder="% paid"
                    value={s.pctPaid ?? ''}
                    onChange={(e) =>
                      updateStage(i, {
                        pctPaid: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                  <input
                    className={INPUT}
                    placeholder="Performance comment"
                    value={s.performanceComment}
                    onChange={(e) => updateStage(i, { performanceComment: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>General recommendation</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.recommendation}
                onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white"
              >
                Save draft IVC
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">
                    {r.number} · {r.status}
                  </p>
                  <h2 className="mt-1 font-semibold text-[#1a2744]">
                    {r.project.name} · {r.subcontractorName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{r.workDescription}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Contract NGN {Number(r.contractAmount).toLocaleString('en-NG')} · PM{' '}
                    {r.pmSignedAt ? 'signed' : 'pending'} · Supervisor{' '}
                    {r.supervisorSignedAt ? 'signed' : 'pending'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
                    onClick={() => downloadPdf(`/ivcs/${r.id}/pdf`, `${r.number}.pdf`)}
                  >
                    PDF
                  </button>
                  {canManage && r.status === 'DRAFT' && (
                    <button
                      type="button"
                      className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                      onClick={() =>
                        api(`/ivcs/${r.id}/submit`, { method: 'PATCH' })
                          .then(load)
                          .catch((err) =>
                            setError(err instanceof Error ? err.message : 'Submit failed'),
                          )
                      }
                    >
                      Submit
                    </button>
                  )}
                  {canManage && r.status === 'SUBMITTED' && (
                    <>
                      {!r.pmSignedAt && (
                        <button
                          type="button"
                          className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                          onClick={() =>
                            api(`/ivcs/${r.id}/sign-pm`, {
                              method: 'PATCH',
                              body: JSON.stringify({}),
                            }).then(load)
                          }
                        >
                          PM sign
                        </button>
                      )}
                      {!r.supervisorSignedAt && (
                        <button
                          type="button"
                          className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                          onClick={() =>
                            api(`/ivcs/${r.id}/sign-supervisor`, {
                              method: 'PATCH',
                              body: JSON.stringify({}),
                            }).then(load)
                          }
                        >
                          Supervisor sign
                        </button>
                      )}
                      {!r.subcontractorSignedAt && (
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
                          onClick={() =>
                            api(`/ivcs/${r.id}/sign-subcontractor`, {
                              method: 'PATCH',
                              body: JSON.stringify({}),
                            }).then(load)
                          }
                        >
                          Sub sign
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>No IVCs yet.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
