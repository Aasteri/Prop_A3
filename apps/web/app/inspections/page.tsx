'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type Inspection = {
  id: string;
  number: string;
  category: string;
  phase: string | null;
  result: string;
  notes: string | null;
  inspectedAt: string;
  inspectedBy: string | null;
  project: { id: string; name: string; site?: { code: string } | null };
};

type Meta = { categories: string[]; results: string[] };

export default function InspectionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Inspection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<Meta>({ categories: [], results: [] });
  const [projectFilter, setProjectFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    category: '',
    phase: '',
    inspectedAt: new Date().toISOString().slice(0, 10),
    inspectedBy: '',
    result: 'PENDING',
    notes: '',
  });

  const load = (projectId?: string) => {
    const q = projectId ? `?projectId=${projectId}` : '';
    api<Inspection[]>(`/inspections${q}`).then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Meta>('/inspections/meta')
      .then((m) => {
        setMeta(m);
        setForm((f) => ({
          ...f,
          category: m.categories[0] ?? '',
          result: m.results[0] ?? 'PENDING',
        }));
      })
      .catch(console.error);
    api<Project[]>('/projects')
      .then((list) => {
        setProjects(list);
        if (list[0]) setForm((f) => ({ ...f, projectId: list[0].id }));
      })
      .catch(console.error);
    load();
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;
    load(projectFilter || undefined);
  }, [projectFilter]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/inspections', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          category: form.category,
          phase: form.phase || undefined,
          inspectedAt: form.inspectedAt,
          inspectedBy: form.inspectedBy || undefined,
          result: form.result,
          notes: form.notes || undefined,
        }),
      });
      setShowForm(false);
      load(projectFilter || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log inspection');
    }
  }

  async function setResult(id: string, result: string) {
    await api(`/inspections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ result }),
    });
    load(projectFilter || undefined);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · QC
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Inspections & QC
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                20-category inspection log (foundation through snagging / closeout).
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/projects-hub" className="rounded-lg border border-white/20 px-4 py-2 text-sm">
                Hub
              </Link>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'Log inspection'}
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-3">
          <select
            className={`${INPUT} max-w-xs`}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.site?.code ? `${p.site.code} · ` : ''}
                {p.name}
              </option>
            ))}
          </select>
        </div>

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
              <label className={LABEL}>Category</label>
              <select
                className={INPUT}
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {meta.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Phase</label>
              <input
                className={INPUT}
                placeholder="e.g. Substructure"
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Inspected at</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.inspectedAt}
                onChange={(e) => setForm({ ...form, inspectedAt: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Inspected by</label>
              <input
                className={INPUT}
                value={form.inspectedBy}
                onChange={(e) => setForm({ ...form, inspectedBy: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Result</label>
              <select
                className={INPUT}
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value })}
              >
                {meta.results.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white">
                Save inspection
              </button>
            </div>
          </form>
        )}

        <div className={`${CARD} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#1a2744]">{r.number}</td>
                  <td className="px-4 py-3">
                    {r.project.site?.code ? `${r.project.site.code} · ` : ''}
                    {r.project.name}
                  </td>
                  <td className="px-4 py-3">
                    {r.category}
                    {r.phase ? (
                      <span className="block text-xs text-slate-500">{r.phase}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.inspectedAt).toLocaleDateString()}
                    {r.inspectedBy ? (
                      <span className="block text-xs text-slate-500">{r.inspectedBy}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{r.result}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {r.result === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          className="text-green-700 hover:underline"
                          onClick={() => setResult(r.id, 'PASS')}
                        >
                          Pass
                        </button>
                        <button
                          type="button"
                          className="text-red-700 hover:underline"
                          onClick={() => setResult(r.id, 'FAIL')}
                        >
                          Fail
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No inspections logged yet.
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
