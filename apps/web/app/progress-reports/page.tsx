'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, downloadPdf, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; status: string };
type TeamMember = { role: string; name: string };
type Task = {
  description: string;
  date?: string;
  status?: string;
  owner?: string;
  comments?: string;
};
type Risk = { issue: string; impact?: string; action?: string; owner?: string };
type ProgressReport = {
  id: string;
  number: string;
  status: string;
  reportDate: string;
  preparedBy: string | null;
  summary: string;
  teamJson: TeamMember[];
  completedJson: Task[];
  upcomingJson: Task[];
  risksJson: Risk[];
  project: Project;
};

function linesToPipeRows(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => line.split('|').map((p) => p.trim()));
}

export default function ProgressReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<ProgressReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    reportDate: '',
    preparedBy: '',
    summary: '',
    team: '',
    completed: '',
    upcoming: '',
    risks: '',
    notes: '',
  });

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'Select…' },
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
  } = useFilteredList<ProgressReport>({
    items: rows,
    searchKeys: ['number', 'status', 'preparedBy', 'summary', 'project.name'],
  });

  const load = () => {
    api<ProgressReport[]>('/progress-reports')
      .then((data) =>
        setRows(
          data.map((r) => ({
            ...r,
            teamJson: Array.isArray(r.teamJson) ? r.teamJson : [],
            completedJson: Array.isArray(r.completedJson) ? r.completedJson : [],
            upcomingJson: Array.isArray(r.upcomingJson) ? r.upcomingJson : [],
            risksJson: Array.isArray(r.risksJson) ? r.risksJson : [],
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
  }, [router]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const team = linesToPipeRows(form.team).map(([role, name]) => ({ role, name }));
      const completed = linesToPipeRows(form.completed).map(
        ([description, date, status, owner, comments]) => ({
          description,
          date,
          status,
          owner,
          comments,
        }),
      );
      const upcoming = linesToPipeRows(form.upcoming).map(
        ([description, date, status, owner, comments]) => ({
          description,
          date,
          status,
          owner,
          comments,
        }),
      );
      const risks = linesToPipeRows(form.risks).map(([issue, impact, action, owner]) => ({
        issue,
        impact,
        action,
        owner,
      }));
      await api('/progress-reports', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          reportDate: form.reportDate,
          summary: form.summary,
          preparedBy: form.preparedBy || undefined,
          team,
          completed,
          upcoming,
          risks,
          notes: form.notes || undefined,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create progress report');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Reporting
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Progress reports
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Sheet 3 Rockvilla-style stakeholder reports: summary, team, completed /
                upcoming milestones, and top risks.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'New progress report'}
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
              <label className={LABEL}>Project</label>
              <SearchableSelect
                className={INPUT}
                required
                options={projectOptions}
                value={form.projectId}
                onChange={(v) => setForm({ ...form, projectId: v })}
                emptyLabel="Select…"
                placeholder="Search projects…"
              />
            </div>
            <div>
              <label className={LABEL}>Report date</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.reportDate}
                onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Prepared by</label>
              <input
                className={INPUT}
                value={form.preparedBy}
                onChange={(e) => setForm({ ...form, preparedBy: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Summary</label>
              <textarea
                className={INPUT}
                rows={4}
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Team (one per line: Role | Name)</label>
              <textarea
                className={INPUT}
                rows={3}
                placeholder="Project Manager | Abraham Laucarie"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>
                Completed (one per line: Description | Date | Status | Owner | Comments)
              </label>
              <textarea
                className={INPUT}
                rows={3}
                value={form.completed}
                onChange={(e) => setForm({ ...form, completed: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>
                Upcoming (one per line: Description | Date | Status | Owner | Comments)
              </label>
              <textarea
                className={INPUT}
                rows={3}
                value={form.upcoming}
                onChange={(e) => setForm({ ...form, upcoming: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>
                Risks (one per line: Issue | Impact | Action | Owner)
              </label>
              <textarea
                className={INPUT}
                rows={3}
                value={form.risks}
                onChange={(e) => setForm({ ...form, risks: e.target.value })}
              />
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
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white"
              >
                Save draft
              </button>
            </div>
          </form>
        )}

        {rows.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search progress reports…"
          />
        )}

        <div className="space-y-3">
          {pageItems.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">
                    {r.number} · {r.status}
                  </p>
                  <h2 className="mt-1 font-semibold text-[#1a2744]">{r.project.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(r.reportDate).toLocaleDateString('en-NG')} · Team{' '}
                    {r.teamJson.length} · Done {r.completedJson.length} · Upcoming{' '}
                    {r.upcomingJson.length} · Risks {r.risksJson.length}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                    onClick={() =>
                      downloadPdf(`/progress-reports/${r.id}/pdf`, `${r.number}.pdf`)
                    }
                  >
                    PDF
                  </button>
                  {canManage && r.status === 'DRAFT' && (
                    <button
                      type="button"
                      className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                      onClick={() =>
                        api(`/progress-reports/${r.id}/publish`, { method: 'PATCH' })
                          .then(load)
                          .catch((err) =>
                            setError(err instanceof Error ? err.message : 'Publish failed'),
                          )
                      }
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No progress reports yet.
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
