'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type WorksRow = {
  id: string;
  number: string;
  subcontractorName: string;
  scopeSummary: string;
  contractSum: string | number;
  platformFeePct: string | number;
  platformFeeAmount: string | number;
  retentionPct: string | number;
  status: string;
  project: { id: string; name: string; site?: { code: string } | null };
};

export default function WorksProcurementPage() {
  const router = useRouter();
  const [rows, setRows] = useState<WorksRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    subcontractorName: '',
    subcontractorPhone: '',
    scopeSummary: '',
    contractSum: '',
    mobilisationPct: '10',
    retentionPct: '5',
    platformFeePct: '10',
    startDate: '',
    completionDate: '',
  });

  const load = () => {
    api<WorksRow[]>('/works').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<Project[]>('/projects')
      .then((list) => {
        setProjects(list);
        if (list[0]) setForm((f) => ({ ...f, projectId: list[0].id }));
      })
      .catch(console.error);
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/works', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          subcontractorName: form.subcontractorName,
          subcontractorPhone: form.subcontractorPhone || undefined,
          scopeSummary: form.scopeSummary,
          contractSum: Number(form.contractSum),
          mobilisationPct: form.mobilisationPct ? Number(form.mobilisationPct) : undefined,
          retentionPct: form.retentionPct ? Number(form.retentionPct) : undefined,
          platformFeePct: form.platformFeePct ? Number(form.platformFeePct) : 10,
          startDate: form.startDate || undefined,
          completionDate: form.completionDate || undefined,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create works contract');
    }
  }

  async function setStatus(id: string, status: string) {
    await api(`/works/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Procurement · Works
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Subcontractor works
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Works contracts linked to projects. Default platform fee ~10% of contract sum
                (Part I.4).
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/procurement" className="rounded-lg border border-white/20 px-4 py-2 text-sm">
                Hub
              </Link>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'New contract'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Project</label>
              <select
                className={INPUT}
                required
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.site?.code ? `${p.site.code} · ` : ''}
                    {p.name}
                  </option>
                ))}
              </select>
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
              <label className={LABEL}>Phone</label>
              <input
                className={INPUT}
                value={form.subcontractorPhone}
                onChange={(e) => setForm({ ...form, subcontractorPhone: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Contract sum (₦)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                required
                value={form.contractSum}
                onChange={(e) => setForm({ ...form, contractSum: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Scope summary</label>
              <textarea
                className={INPUT}
                rows={3}
                required
                value={form.scopeSummary}
                onChange={(e) => setForm({ ...form, scopeSummary: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Mobilisation %</label>
              <input
                type="number"
                className={INPUT}
                value={form.mobilisationPct}
                onChange={(e) => setForm({ ...form, mobilisationPct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Retention %</label>
              <input
                type="number"
                className={INPUT}
                value={form.retentionPct}
                onChange={(e) => setForm({ ...form, retentionPct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Platform fee %</label>
              <input
                type="number"
                className={INPUT}
                value={form.platformFeePct}
                onChange={(e) => setForm({ ...form, platformFeePct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Start</label>
              <input
                type="date"
                className={INPUT}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Target completion</label>
              <input
                type="date"
                className={INPUT}
                value={form.completionDate}
                onChange={(e) => setForm({ ...form, completionDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white">
                Create works contract
              </button>
            </div>
          </form>
        )}

        <div className={`${CARD} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Contract</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Subcontractor</th>
                <th className="px-4 py-3 font-medium">Sum / fee</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1a2744]">{r.number}</div>
                    <div className="mt-1 max-w-xs text-xs text-slate-500 line-clamp-2">
                      {r.scopeSummary}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.project.site?.code ? `${r.project.site.code} · ` : ''}
                    {r.project.name}
                  </td>
                  <td className="px-4 py-3">{r.subcontractorName}</td>
                  <td className="px-4 py-3">
                    ₦{Number(r.contractSum).toLocaleString()}
                    <div className="text-xs text-slate-500">
                      Fee {Number(r.platformFeePct)}% · ₦
                      {Number(r.platformFeeAmount).toLocaleString()} · Ret{' '}
                      {Number(r.retentionPct)}%
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {r.status === 'ACTIVE' && (
                      <button
                        type="button"
                        className="text-[#e87722] hover:underline"
                        onClick={() => setStatus(r.id, 'COMPLETED')}
                      >
                        Complete
                      </button>
                    )}
                    {r.status !== 'TERMINATED' && r.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        className="text-slate-500 hover:underline"
                        onClick={() => setStatus(r.id, 'TERMINATED')}
                      >
                        Terminate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No works contracts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
