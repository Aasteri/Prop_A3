'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyProjectGate } from '@/components/EmptyEntityGate';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Kind = 'DAILY' | 'WEEKLY' | 'MONTHLY';
type Project = { id: string; name: string; status: string };
type ChecklistItem = { item: string; done: boolean; notes: string };
type Template = {
  kind: Kind;
  title: string;
  focus: string;
  objective: string;
  slogan: string;
  checklist: ChecklistItem[];
};
type PlanningCycle = {
  id: string;
  number: string;
  kind: Kind;
  status: string;
  periodStart: string;
  periodEnd: string | null;
  checklistJson: ChecklistItem[];
  targets: string | null;
  resourcesNote: string | null;
  risksNote: string | null;
  lookaheadNote: string | null;
  cashflowNote: string | null;
  preparedBy: string | null;
  project: Project;
};

const TABS: { kind: Kind; label: string }[] = [
  { kind: 'DAILY', label: 'Daily' },
  { kind: 'WEEKLY', label: 'Weekly' },
  { kind: 'MONTHLY', label: 'Monthly' },
];

export default function PlanningCyclesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Kind>('DAILY');
  const [rows, setRows] = useState<PlanningCycle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    periodStart: '',
    periodEnd: '',
    targets: '',
    resourcesNote: '',
    risksNote: '',
    lookaheadNote: '',
    cashflowNote: '',
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const activeTemplate = useMemo(
    () => templates.find((t) => t.kind === tab),
    [templates, tab],
  );

  const filtered = useMemo(() => rows.filter((r) => r.kind === tab), [rows, tab]);

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
  } = useFilteredList<PlanningCycle>({
    items: filtered,
    searchKeys: ['number', 'status', 'targets', 'preparedBy', 'project.name'],
  });

  const load = () => {
    api<PlanningCycle[]>('/planning-cycles')
      .then((data) =>
        setRows(
          data.map((r) => ({
            ...r,
            checklistJson: Array.isArray(r.checklistJson) ? r.checklistJson : [],
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
    api<Template[]>('/planning-cycles/templates')
      .then(setTemplates)
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    if (activeTemplate) {
      setChecklist(activeTemplate.checklist.map((c) => ({ ...c })));
    }
  }, [activeTemplate]);

  function toggleItem(i: number) {
    const next = [...checklist];
    next[i] = { ...next[i], done: !next[i].done };
    setChecklist(next);
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/planning-cycles', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          kind: tab,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd || undefined,
          checklist,
          targets: form.targets || undefined,
          resourcesNote: form.resourcesNote || undefined,
          risksNote: form.risksNote || undefined,
          lookaheadNote: form.lookaheadNote || undefined,
          cashflowNote: form.cashflowNote || undefined,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create planning cycle');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Planning
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Planning cycles
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Doc 3 daily / weekly / monthly rhythm — plan today, achieve tomorrow.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : `New ${tab.toLowerCase()} cycle`}
              </button>
            )}
          </div>
        </header>

        {!projects.length ? (
          <EmptyProjectGate moduleLabel="planning cycles" />
        ) : (
          <>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Link href="/projects-hub" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Projects hub
        </Link>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => {
                setTab(t.kind);
                setShowForm(false);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tab === t.kind
                  ? 'bg-[#1a2744] text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTemplate && (
          <div className={`${CARD} p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#e87722]">
              {activeTemplate.focus}
            </p>
            <h2 className="mt-1 font-semibold text-[#1a2744]">{activeTemplate.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{activeTemplate.objective}</p>
            <p className="mt-2 text-xs italic text-slate-500">{activeTemplate.slogan}</p>
          </div>
        )}

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
              <label className={LABEL}>Period start</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Period end</label>
              <input
                type="date"
                className={INPUT}
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Checklist</label>
              <ul className="mt-2 space-y-2">
                {checklist.map((c, i) => (
                  <li key={c.item} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={c.done}
                      onChange={() => toggleItem(i)}
                    />
                    <span className={c.done ? 'text-slate-400 line-through' : 'text-slate-700'}>
                      {c.item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Targets</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.targets}
                onChange={(e) => setForm({ ...form, targets: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Resources note</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.resourcesNote}
                onChange={(e) => setForm({ ...form, resourcesNote: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Risks note</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.risksNote}
                onChange={(e) => setForm({ ...form, risksNote: e.target.value })}
              />
            </div>
            {(tab === 'WEEKLY' || tab === 'MONTHLY') && (
              <div>
                <label className={LABEL}>Lookahead note</label>
                <textarea
                  className={INPUT}
                  rows={2}
                  value={form.lookaheadNote}
                  onChange={(e) => setForm({ ...form, lookaheadNote: e.target.value })}
                />
              </div>
            )}
            {tab === 'MONTHLY' && (
              <div>
                <label className={LABEL}>Cashflow / budget note</label>
                <textarea
                  className={INPUT}
                  rows={2}
                  value={form.cashflowNote}
                  onChange={(e) => setForm({ ...form, cashflowNote: e.target.value })}
                />
              </div>
            )}
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

        {filtered.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search planning cycles…"
          />
        )}

        <div className="space-y-3">
          {pageItems.map((r) => {
            const doneCount = r.checklistJson.filter((c) => c.done).length;
            return (
              <div key={r.id} className={`${CARD} p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#e87722]">
                      {r.number} · {r.status}
                    </p>
                    <h2 className="mt-1 font-semibold text-[#1a2744]">{r.project.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(r.periodStart).toLocaleDateString('en-NG')}
                      {r.periodEnd
                        ? ` → ${new Date(r.periodEnd).toLocaleDateString('en-NG')}`
                        : ''}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Checklist {doneCount}/{r.checklistJson.length}
                      {r.targets ? ` · ${r.targets.slice(0, 80)}` : ''}
                    </p>
                  </div>
                  {canManage && r.status === 'DRAFT' && (
                    <button
                      type="button"
                      className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                      onClick={() =>
                        api(`/planning-cycles/${r.id}/complete`, { method: 'PATCH' })
                          .then(load)
                          .catch((err) =>
                            setError(
                              err instanceof Error ? err.message : 'Complete failed',
                            ),
                          )
                      }
                    >
                      Mark complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No {tab.toLowerCase()} planning cycles yet.
            </div>
          )}
        </div>
        {filtered.length > 0 && (
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            filteredCount={filteredCount}
            onPageChange={setPage}
          />
        )}
          </>
        )}
      </div>
    </AppShell>
  );
}
