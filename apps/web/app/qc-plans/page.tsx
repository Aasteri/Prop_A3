'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyProjectGate } from '@/components/EmptyEntityGate';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type QcItem = {
  id?: string;
  activity: string;
  inspectionPoint: string;
  acceptanceCriteria?: string;
  method?: string;
  responsible?: string;
  plannedDate?: string;
  linkedSection?: string;
};

type QcPlan = {
  id: string;
  number: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETE';
  preparedBy: string | null;
  notes: string | null;
  project: { id: string; name: string; site?: { code: string } };
  items: QcItem[];
};

const emptyItem = (): QcItem => ({
  activity: '',
  inspectionPoint: '',
  acceptanceCriteria: '',
  method: '',
  responsible: '',
  plannedDate: '',
  linkedSection: '',
});

export default function QcPlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [plans, setPlans] = useState<QcPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    title: '',
    preparedBy: '',
    notes: '',
  });
  const [items, setItems] = useState<QcItem[]>([emptyItem()]);

  const canManage =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'FOREMAN' ||
    user?.role === 'ENGINEER';

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'All projects' },
      ...projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    ],
    [projects],
  );

  const formProjectOptions = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    [projects],
  );

  const load = (pid?: string) => {
    const q = pid ? `?projectId=${encodeURIComponent(pid)}` : '';
    api<QcPlan[]>(`/project-ops/qc-plans${q}`)
      .then(setPlans)
      .catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<Project[]>('/projects').then(setProjects).catch(console.error);
    load();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const validItems = items.filter((i) => i.activity.trim() && i.inspectionPoint.trim());
    try {
      await api('/project-ops/qc-plans', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          title: form.title,
          preparedBy: form.preparedBy || undefined,
          notes: form.notes || undefined,
          items: validItems.map((i) => ({
            activity: i.activity,
            inspectionPoint: i.inspectionPoint,
            acceptanceCriteria: i.acceptanceCriteria || undefined,
            method: i.method || undefined,
            responsible: i.responsible || undefined,
            plannedDate: i.plannedDate || undefined,
            linkedSection: i.linkedSection || undefined,
          })),
        }),
      });
      setShowForm(false);
      setForm({ projectId: '', title: '', preparedBy: '', notes: '' });
      setItems([emptyItem()]);
      load(projectFilter || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create QC plan');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: 'DRAFT' | 'ACTIVE' | 'COMPLETE') {
    await api(`/project-ops/qc-plans/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load(projectFilter || undefined);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Plan · QC planning
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Quality control plans
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Inspection & test plan before execution. Execution checks live under Inspections.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/inspections"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
              >
                QC execution
              </Link>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
                >
                  {showForm ? 'Cancel' : 'New QC plan'}
                </button>
              )}
            </div>
          </div>
        </header>

        {!projects.length ? (
          <EmptyProjectGate moduleLabel="QC plans" />
        ) : (
          <>

        <div className={`${CARD} p-4 sm:p-5`}>
          <label className={LABEL}>Filter by project</label>
          <SearchableSelect
            className={INPUT}
            options={projectOptions}
            value={projectFilter}
            onChange={(v) => {
              setProjectFilter(v);
              load(v || undefined);
            }}
            emptyLabel="All projects"
            placeholder="Search projects…"
          />
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} space-y-4 p-6`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className={LABEL}>Project</span>
                <SearchableSelect
                  className={INPUT}
                  options={formProjectOptions}
                  value={form.projectId}
                  onChange={(v) => setForm({ ...form, projectId: v })}
                  emptyLabel="Select…"
                  placeholder="Search…"
                />
              </label>
              <label className="block text-sm">
                <span className={LABEL}>Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={INPUT}
                  placeholder="e.g. Structural ITP — Block A"
                />
              </label>
              <label className="block text-sm">
                <span className={LABEL}>Prepared by</span>
                <input
                  value={form.preparedBy}
                  onChange={(e) => setForm({ ...form, preparedBy: e.target.value })}
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
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Inspection points</p>
              {items.map((item, i) => (
                <div
                  key={i}
                  className="mb-3 grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2"
                >
                  <input
                    placeholder="Activity"
                    value={item.activity}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], activity: e.target.value };
                      setItems(next);
                    }}
                    className={INPUT}
                  />
                  <input
                    placeholder="Inspection point"
                    value={item.inspectionPoint}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], inspectionPoint: e.target.value };
                      setItems(next);
                    }}
                    className={INPUT}
                  />
                  <input
                    placeholder="Acceptance criteria"
                    value={item.acceptanceCriteria}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], acceptanceCriteria: e.target.value };
                      setItems(next);
                    }}
                    className={INPUT}
                  />
                  <input
                    placeholder="Method"
                    value={item.method}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], method: e.target.value };
                      setItems(next);
                    }}
                    className={INPUT}
                  />
                  <input
                    placeholder="Responsible"
                    value={item.responsible}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], responsible: e.target.value };
                      setItems(next);
                    }}
                    className={INPUT}
                  />
                  <input
                    type="date"
                    value={item.plannedDate}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], plannedDate: e.target.value };
                      setItems(next);
                    }}
                    className={INPUT}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setItems([...items, emptyItem()])}
                className="text-sm text-[#e87722]"
              >
                + Add inspection point
              </button>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !form.projectId} className={BTN_PRIMARY}>
                {busy ? 'Saving…' : 'Create plan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={BTN_SECONDARY}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#1a2744]">
                    {p.number} · {p.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {p.project.site?.code ? `${p.project.site.code} · ` : ''}
                    {p.project.name} · {p.status} · {p.items.length} points
                    {p.preparedBy ? ` · ${p.preparedBy}` : ''}
                  </p>
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    {p.status !== 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => setStatus(p.id, 'ACTIVE')}
                        className="rounded-md bg-green-700 px-3 py-1.5 text-xs text-white"
                      >
                        Activate
                      </button>
                    )}
                    {p.status !== 'COMPLETE' && (
                      <button
                        type="button"
                        onClick={() => setStatus(p.id, 'COMPLETE')}
                        className={BTN_SECONDARY + ' !px-3 !py-1.5 !text-xs'}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                )}
              </div>
              {p.items.length > 0 && (
                <ul className="mt-3 space-y-1 border-t pt-3 text-sm text-slate-700">
                  {p.items.map((it, i) => (
                    <li key={it.id ?? i}>
                      <span className="font-medium">{it.activity}</span> — {it.inspectionPoint}
                      {it.responsible ? ` · ${it.responsible}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {!plans.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No QC plans yet. Create an ITP before site execution.
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
