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
type Retrospective = {
  id: string;
  number: string;
  status: string;
  heldAt: string | null;
  ownerName: string | null;
  projectSummary: string;
  wentWellJson: string[];
  improvementsJson: string[];
  luckyJson: string[];
  clientTestimonial: string | null;
  project: Project;
};

function linesToList(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function RetrospectivesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<Retrospective[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    heldAt: '',
    ownerName: '',
    collaborators: '',
    projectSummary: '',
    projectStatusNote: '',
    goalsObjectives: '',
    durationNote: '',
    teamNote: '',
    docsLink: '',
    methodology: '',
    resources: '',
    wentWell: '',
    improvements: '',
    lucky: '',
    actions: '',
    nextSteps: '',
    timeline: '',
    clientTestimonial: '',
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
  } = useFilteredList<Retrospective>({
    items: rows,
    searchKeys: ['number', 'status', 'ownerName', 'projectSummary', 'project.name'],
  });

  const load = () => {
    api<Retrospective[]>('/retrospectives')
      .then((data) =>
        setRows(
          data.map((r) => ({
            ...r,
            wentWellJson: Array.isArray(r.wentWellJson) ? r.wentWellJson : [],
            improvementsJson: Array.isArray(r.improvementsJson) ? r.improvementsJson : [],
            luckyJson: Array.isArray(r.luckyJson) ? r.luckyJson : [],
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
      const actions = linesToList(form.actions).map((line) => {
        const [action, type, owner, links] = line.split('|').map((s) => s.trim());
        return { action, type, owner, links };
      });
      const timeline = linesToList(form.timeline).map((line) => {
        const [dateAchieved, milestone] = line.split('|').map((s) => s.trim());
        return { dateAchieved, milestone };
      });
      await api('/retrospectives', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          heldAt: form.heldAt || undefined,
          ownerName: form.ownerName || undefined,
          collaborators: form.collaborators || undefined,
          projectSummary: form.projectSummary,
          projectStatusNote: form.projectStatusNote || undefined,
          goalsObjectives: form.goalsObjectives || undefined,
          durationNote: form.durationNote || undefined,
          teamNote: form.teamNote || undefined,
          docsLink: form.docsLink || undefined,
          methodology: form.methodology || undefined,
          resources: form.resources || undefined,
          wentWell: linesToList(form.wentWell),
          improvements: linesToList(form.improvements),
          lucky: linesToList(form.lucky),
          actions,
          nextSteps: form.nextSteps || undefined,
          timeline,
          clientTestimonial: form.clientTestimonial || undefined,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create retrospective');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Closure
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Retrospectives
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Doc 8 lessons learned (went well / improve / lucky) plus optional client
                testimonial (US-CLOSE-07/08).
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'New retrospective'}
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
              <label className={LABEL}>Meeting date</label>
              <input
                type="date"
                className={INPUT}
                value={form.heldAt}
                onChange={(e) => setForm({ ...form, heldAt: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Owner</label>
              <input
                className={INPUT}
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Collaborators</label>
              <input
                className={INPUT}
                value={form.collaborators}
                onChange={(e) => setForm({ ...form, collaborators: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Project summary</label>
              <textarea
                className={INPUT}
                rows={3}
                required
                value={form.projectSummary}
                onChange={(e) => setForm({ ...form, projectSummary: e.target.value })}
              />
            </div>
            {(
              [
                ['projectStatusNote', 'Project status note'],
                ['goalsObjectives', 'Goals & objectives'],
                ['durationNote', 'Duration'],
                ['teamNote', 'Team'],
                ['docsLink', 'Link to project docs'],
                ['methodology', 'Methodology'],
                ['resources', 'Resources'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className={LABEL}>{label}</label>
                <input
                  className={INPUT}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            {(
              [
                ['wentWell', 'Went well (one per line)'],
                ['improvements', 'Need improvement'],
                ['lucky', 'Where we got lucky'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="sm:col-span-2">
                <label className={LABEL}>{label}</label>
                <textarea
                  className={INPUT}
                  rows={2}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className={LABEL}>
                Actions (one per line: Action | tool/process/team | Owner | Links)
              </label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.actions}
                onChange={(e) => setForm({ ...form, actions: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Next steps</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.nextSteps}
                onChange={(e) => setForm({ ...form, nextSteps: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>
                Timeline (one per line: Date range | Milestone)
              </label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.timeline}
                onChange={(e) => setForm({ ...form, timeline: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Client testimonial (optional)</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.clientTestimonial}
                onChange={(e) => setForm({ ...form, clientTestimonial: e.target.value })}
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
            searchPlaceholder="Search retrospectives…"
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
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.projectSummary}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Well {r.wentWellJson.length} · Improve {r.improvementsJson.length} · Lucky{' '}
                    {r.luckyJson.length}
                    {r.clientTestimonial ? ' · Testimonial on file' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                    onClick={() => downloadPdf(`/retrospectives/${r.id}/pdf`, `${r.number}.pdf`)}
                  >
                    PDF
                  </button>
                  {canManage && r.status === 'DRAFT' && (
                    <button
                      type="button"
                      className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                      onClick={() =>
                        api(`/retrospectives/${r.id}/publish`, { method: 'PATCH' })
                          .then(load)
                          .catch((err) =>
                            setError(err instanceof Error ? err.message : 'Publish failed'),
                          )
                      }
                    >
                      Publish
                    </button>
                  )}
                  {canManage && !r.clientTestimonial && (
                    <button
                      type="button"
                      className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                      onClick={() => {
                        const testimonial = window.prompt('Client testimonial');
                        if (!testimonial) return;
                        const feedbackBy = window.prompt('Client name') || undefined;
                        return api(`/retrospectives/${r.id}/client-feedback`, {
                          method: 'PATCH',
                          body: JSON.stringify({ testimonial, feedbackBy }),
                        }).then(load);
                      }}
                    >
                      Add testimonial
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No retrospectives yet.
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
