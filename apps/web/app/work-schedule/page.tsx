'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, downloadFile, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; location: string | null; site?: { code: string } };

type WorkTask = {
  id: string;
  projectId: string;
  wbsNumber: string;
  taskTitle: string;
  taskOwner: string | null;
  startDate: string | null;
  dueDate: string | null;
  durationDays: number | null;
  dailyHours: string | number | null;
  progressPct: string | number;
  isPaymentMilestone: boolean;
  phaseLabel: string | null;
  project: { id: string; name: string; site?: { code: string } };
};

const emptyForm = {
  wbsNumber: '',
  taskTitle: '',
  taskOwner: '',
  startDate: '',
  dueDate: '',
  durationDays: '',
  dailyHours: '8',
  progressPct: '0',
  isPaymentMilestone: false,
  phaseLabel: '',
};

export default function WorkSchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const load = (pid: string) => {
    if (!pid) {
      setTasks([]);
      return;
    }
    api<WorkTask[]>(`/work-tasks?projectId=${encodeURIComponent(pid)}`)
      .then(setTasks)
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
        if (list[0]) {
          setProjectId(list[0].id);
          load(list[0].id);
        }
      })
      .catch(console.error);
  }, [router]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

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

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<WorkTask>({
    items: tasks,
    searchKeys: [
      'wbsNumber',
      'taskTitle',
      'taskOwner',
      'phaseLabel',
      'project.name',
    ],
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setError('');
    setBusy(true);
    try {
      await api('/work-tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          wbsNumber: form.wbsNumber,
          taskTitle: form.taskTitle,
          taskOwner: form.taskOwner || undefined,
          startDate: form.startDate || undefined,
          dueDate: form.dueDate || undefined,
          durationDays: form.durationDays ? Number(form.durationDays) : undefined,
          dailyHours: form.dailyHours ? Number(form.dailyHours) : undefined,
          progressPct: Number(form.progressPct) || 0,
          isPaymentMilestone: form.isPaymentMilestone,
          phaseLabel: form.phaseLabel || undefined,
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setBusy(false);
    }
  }

  async function patchTask(id: string, body: Record<string, unknown>) {
    try {
      await api(`/work-tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      load(projectId);
    } catch (err) {
      console.error(err);
    }
  }

  async function removeTask(id: string) {
    if (!window.confirm('Delete this work schedule task?')) return;
    await api(`/work-tasks/${id}`, { method: 'DELETE' });
    load(projectId);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Work schedule
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Project work schedule (WBS)
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Sheet 1 WBS tasks: owners, dates, % done, and payment milestones (PMT).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/projects-hub"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
              >
                Projects hub
              </Link>
              {projectId && (
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      `/work-tasks/export.csv?projectId=${encodeURIComponent(projectId)}`,
                      `work-schedule-${projectId}.csv`,
                    )
                  }
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
                >
                  Export CSV
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
                >
                  {showForm ? 'Cancel' : 'Add task'}
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
          {selectedProject && (
            <p className="mt-2 text-sm text-slate-500">
              {selectedProject.location ?? 'No location set'}
            </p>
          )}
        </div>

        {showForm && canManage && (
          <form onSubmit={onCreate} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>WBS number</label>
              <input
                className={INPUT}
                required
                placeholder="1.01"
                value={form.wbsNumber}
                onChange={(e) => setForm({ ...form, wbsNumber: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Task owner</label>
              <input
                className={INPUT}
                placeholder="PM / Team / Engr"
                value={form.taskOwner}
                onChange={(e) => setForm({ ...form, taskOwner: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Task title</label>
              <input
                className={INPUT}
                required
                value={form.taskTitle}
                onChange={(e) => setForm({ ...form, taskTitle: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Phase label</label>
              <input
                className={INPUT}
                placeholder="Phase 1: Mobilization…"
                value={form.phaseLabel}
                onChange={(e) => setForm({ ...form, phaseLabel: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>% done</label>
              <input
                type="number"
                min={0}
                max={100}
                className={INPUT}
                value={form.progressPct}
                onChange={(e) => setForm({ ...form, progressPct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Start date</label>
              <input
                type="date"
                className={INPUT}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Due date</label>
              <input
                type="date"
                className={INPUT}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Duration (days)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Daily hours</label>
              <input
                type="number"
                min={0}
                step="0.5"
                className={INPUT}
                value={form.dailyHours}
                onChange={(e) => setForm({ ...form, dailyHours: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isPaymentMilestone}
                onChange={(e) =>
                  setForm({ ...form, isPaymentMilestone: e.target.checked })
                }
              />
              Payment milestone (PMT)
            </label>
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy || !projectId}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Create task'}
              </button>
            </div>
          </form>
        )}

        {tasks.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search WBS tasks…"
          />
        )}

        <div className={`${CARD} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">WBS</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">% done</th>
                <th className="px-4 py-3">PMT</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-[#1a2744]">{t.wbsNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900">{t.taskTitle}</p>
                    {t.phaseLabel && (
                      <p className="text-xs text-slate-500">{t.phaseLabel}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.taskOwner ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {(t.startDate ?? '').slice(0, 10) || '—'} →{' '}
                    {(t.dueDate ?? '').slice(0, 10) || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900"
                        defaultValue={Number(t.progressPct)}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v) && v !== Number(t.progressPct)) {
                            patchTask(t.id, { progressPct: v });
                          }
                        }}
                      />
                    ) : (
                      `${Number(t.progressPct).toFixed(0)}%`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <input
                        type="checkbox"
                        checked={t.isPaymentMilestone}
                        onChange={(e) =>
                          patchTask(t.id, { isPaymentMilestone: e.target.checked })
                        }
                      />
                    ) : t.isPaymentMilestone ? (
                      'Yes'
                    ) : (
                      '—'
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeTask(t.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!tasks.length && (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {projectId
                      ? 'No work schedule tasks for this project yet.'
                      : 'Select a project to view the WBS.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {tasks.length > 0 && (
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
