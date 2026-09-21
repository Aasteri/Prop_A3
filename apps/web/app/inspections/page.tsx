'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect, optionsFromValues } from '@/components/SearchableSelect';
import { api, getToken } from '@/lib/api';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type ChecklistRow = { item: string; status: 'YES' | 'NO' | 'NA' | ''; remarks: string };

type Doc4Section = { title: string; items: string[] };

type Inspection = {
  id: string;
  number: string;
  category: string;
  phase: string | null;
  section: string | null;
  result: string;
  notes: string | null;
  checklist: ChecklistRow[] | null;
  sectionSignedBy: string | null;
  inspectedAt: string;
  inspectedBy: string | null;
  project: { id: string; name: string; site?: { code: string } | null };
};

type Meta = {
  categories: string[];
  results: string[];
  sections: Doc4Section[];
};

function isPrePourContext(category: string, section: string) {
  if (category.toLowerCase().includes('pre-pour')) return true;
  const s = section.toUpperCase();
  return s.includes('PRE-POUR') || s.includes('CONCRETE POUR');
}

function emptyChecklist(items: string[]): ChecklistRow[] {
  return items.map((item) => ({ item, status: '', remarks: '' }));
}

export default function InspectionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Inspection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<Meta>({ categories: [], results: [], sections: [] });
  const [projectFilter, setProjectFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectId: '',
    category: '',
    phase: '',
    section: '',
    inspectedAt: new Date().toISOString().slice(0, 10),
    inspectedBy: '',
    result: 'PENDING',
    notes: '',
    sectionSignedBy: '',
  });
  const [checklist, setChecklist] = useState<ChecklistRow[]>([]);

  const selectedSection = useMemo(
    () => meta.sections.find((s) => s.title === form.section),
    [meta.sections, form.section],
  );

  const prePour = isPrePourContext(form.category, form.section);
  const checklistReady =
    checklist.length > 0 &&
    checklist.every((c) => c.status === 'YES' || c.status === 'NA');
  const canPassPrePour = checklistReady && !!form.sectionSignedBy.trim();

  const projectFilterOptions = useMemo(
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

  const projectFormOptions = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    [projects],
  );

  const categoryOptions = useMemo(
    () => optionsFromValues(meta.categories),
    [meta.categories],
  );

  const sectionOptions = useMemo(
    () => optionsFromValues(meta.sections.map((s) => s.title)),
    [meta.sections],
  );

  const resultFormOptions = useMemo(() => {
    const blocked = prePour && !canPassPrePour;
    return meta.results
      .filter((r) => !(r === 'PASS' && blocked))
      .map((r) => ({ value: r, label: r }));
  }, [meta.results, prePour, canPassPrePour]);

  const resultFilter: FilterDef = useMemo(
    () => ({
      key: 'result',
      label: 'Result',
      options: meta.results.map((r) => ({ value: r, label: r })),
      getValue: (item) => (item as Inspection).result,
    }),
    [meta.results],
  );

  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<Inspection>({
    items: rows,
    searchKeys: [
      'number',
      'category',
      'section',
      'phase',
      'result',
      'inspectedBy',
      'project.name',
    ],
    filters: [resultFilter],
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
        const firstSection = m.sections[0];
        setForm((f) => ({
          ...f,
          category: m.categories[0] ?? '',
          result: m.results[0] ?? 'PENDING',
          section: firstSection?.title ?? '',
        }));
        if (firstSection) setChecklist(emptyChecklist(firstSection.items));
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

  function onSectionChange(title: string) {
    const section = meta.sections.find((s) => s.title === title);
    setForm((f) => ({ ...f, section: title }));
    setChecklist(section ? emptyChecklist(section.items) : []);
  }

  function setItemStatus(index: number, status: ChecklistRow['status']) {
    setChecklist((prev) => prev.map((row, i) => (i === index ? { ...row, status } : row)));
  }

  function setItemRemarks(index: number, remarks: string) {
    setChecklist((prev) => prev.map((row, i) => (i === index ? { ...row, remarks } : row)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (form.result === 'PASS' && prePour && !canPassPrePour) {
      setError(
        'Pre-pour PASS requires every checklist item YES or NA, and a section signature.',
      );
      return;
    }

    const payloadChecklist = checklist
      .filter((c) => c.status === 'YES' || c.status === 'NO' || c.status === 'NA')
      .map((c) => ({
        item: c.item,
        status: c.status as 'YES' | 'NO' | 'NA',
        remarks: c.remarks || undefined,
      }));

    try {
      await api('/inspections', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          category: form.category,
          phase: form.phase || undefined,
          section: form.section || undefined,
          inspectedAt: form.inspectedAt,
          inspectedBy: form.inspectedBy || undefined,
          result: form.result,
          notes: form.notes || undefined,
          checklist: payloadChecklist.length ? payloadChecklist : undefined,
          sectionSignedBy: form.sectionSignedBy.trim() || undefined,
        }),
      });
      setShowForm(false);
      load(projectFilter || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log inspection');
    }
  }

  async function setResult(id: string, result: string) {
    setError('');
    try {
      await api(`/inspections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ result }),
      });
      load(projectFilter || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update result');
    }
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
                Doc 4 construction checklists with Yes/No/NA, section sign-off, and
                pre-pour PASS gate.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/projects-hub" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">
                Hub
              </Link>
              <Link href="/ethics" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">
                Ethics
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
          <div className="w-full max-w-xs">
            <SearchableSelect
              className={INPUT}
              options={projectFilterOptions}
              value={projectFilter}
              onChange={setProjectFilter}
              emptyLabel="All projects"
              placeholder="Filter project…"
            />
          </div>
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
              <SearchableSelect
                className={INPUT}
                required
                options={projectFormOptions}
                value={form.projectId}
                onChange={(v) => setForm({ ...form, projectId: v })}
                placeholder="Search projects…"
              />
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <SearchableSelect
                className={INPUT}
                required
                options={categoryOptions}
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                placeholder="Category…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Doc 4 section</label>
              <SearchableSelect
                className={INPUT}
                required
                options={sectionOptions}
                value={form.section}
                onChange={onSectionChange}
                placeholder="Section…"
              />
              {selectedSection ? (
                <p className="mt-1 text-xs text-slate-500">
                  {selectedSection.items.length} checklist items
                </p>
              ) : null}
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
              <SearchableSelect
                className={INPUT}
                options={resultFormOptions}
                value={form.result}
                onChange={(v) => setForm({ ...form, result: v })}
                placeholder="Result…"
              />
              {prePour && (
                <p className="mt-1 text-xs text-amber-700">
                  Pre-pour gate: PASS needs all items YES/NA and section signature.
                </p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-3">
              <label className={LABEL}>Checklist</label>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.map((row, i) => (
                      <tr key={row.item} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-[#1a2744]">{row.item}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            {(['YES', 'NO', 'NA'] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                className={`rounded px-2 py-1 text-xs font-medium ${
                                  row.status === s
                                    ? s === 'YES'
                                      ? 'bg-green-600 text-white'
                                      : s === 'NO'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-slate-600 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                                onClick={() => setItemStatus(i, s)}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className={INPUT}
                            value={row.remarks}
                            onChange={(e) => setItemRemarks(i, e.target.value)}
                            placeholder="Optional"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className={LABEL}>
                Section signed by{prePour ? ' (required for PASS)' : ''}
              </label>
              <input
                className={INPUT}
                value={form.sectionSignedBy}
                onChange={(e) => setForm({ ...form, sectionSignedBy: e.target.value })}
                placeholder="Inspector / supervisor name"
                required={prePour && form.result === 'PASS'}
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
              <button type="submit" className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white">
                Save inspection
              </button>
            </div>
          </form>
        )}

        {rows.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search inspections…"
            filters={[resultFilter]}
            filterValues={filterValues}
            onFilterChange={setFilter}
          />
        )}

        <div className={`${CARD} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Section / category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#1a2744]">{r.number}</td>
                  <td className="px-4 py-3">
                    {r.project.site?.code ? `${r.project.site.code} · ` : ''}
                    {r.project.name}
                  </td>
                  <td className="px-4 py-3">
                    {r.section || r.category}
                    {r.section ? (
                      <span className="block text-xs text-slate-500">{r.category}</span>
                    ) : null}
                    {r.sectionSignedBy ? (
                      <span className="block text-xs text-slate-500">
                        Signed: {r.sectionSignedBy}
                      </span>
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
