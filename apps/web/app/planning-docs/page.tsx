'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect, optionsFromValues } from '@/components/SearchableSelect';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';
import {
  api,
  uploadDocument,
  getToken,
  getUser,
  type AuthUser,
  type DocumentRecord,
} from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

const PLANNING_CATEGORIES = [
  'TDP',
  'C_OF_O',
  'SOIL_TEST',
  'ARCH_DESIGN',
  'STRUCTURAL_DESIGN',
  'ME_DESIGN',
  'BOQ',
  'LABOUR_SCHEDULE',
  'MATERIAL_SCHEDULE',
  'WORK_SCHEDULE',
  'PERMIT',
  'DRAWING',
  'CERTIFICATE',
  'OTHER',
] as const;

type Project = { id: string; name: string; site?: { code: string } };

function labelCategory(c: string) {
  return c.replace(/_/g, ' ');
}

export default function PlanningDocsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<string>('TDP');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadDocs = (pid: string) => {
    if (!pid) {
      setDocs([]);
      return;
    }
    api<DocumentRecord[]>(`/documents?entityType=PROJECT&entityId=${pid}`)
      .then((rows) =>
        setDocs(
          rows.filter((d) =>
            PLANNING_CATEGORIES.includes(d.category as (typeof PLANNING_CATEGORIES)[number]),
          ),
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
    api<Project[]>('/projects')
      .then((list) => {
        setProjects(list);
        if (list[0]) {
          setProjectId(list[0].id);
          loadDocs(list[0].id);
        }
      })
      .catch(console.error);
  }, [router]);

  const canUpload =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'ENGINEER' ||
    user?.role === 'ARCHITECT';

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    [projects],
  );

  const categoryOptions = useMemo(
    () => optionsFromValues([...PLANNING_CATEGORIES], labelCategory),
    [],
  );

  const categoryFilter: FilterDef = useMemo(
    () => ({
      key: 'category',
      label: 'Category',
      options: PLANNING_CATEGORIES.map((c) => ({ value: c, label: labelCategory(c) })),
      getValue: (item) => (item as DocumentRecord).category,
    }),
    [],
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
  } = useFilteredList<DocumentRecord>({
    items: docs,
    searchKeys: ['title', 'category', 'fileName'],
    filters: [categoryFilter],
  });

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    const fileInput = (e.target as HTMLFormElement).elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !projectId) return;
    setError('');
    setBusy(true);
    try {
      await uploadDocument(
        {
          entityType: 'PROJECT',
          entityId: projectId,
          category,
          title: title || `${labelCategory(category)} — ${file.name}`,
        },
        file,
      );
      setTitle('');
      fileInput.value = '';
      loadDocs(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
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
                Planning documents
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                TDP, C of O, soil test, Arch / Structural / M&E, BOQ, labour & material schedules
                (A.7.1).
              </p>
            </div>
            <Link href="/projects-hub" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">
              Hub
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap gap-3">
          <div className="w-full max-w-md">
            <SearchableSelect
              className={INPUT}
              options={projectOptions}
              value={projectId}
              onChange={(v) => {
                setProjectId(v);
                loadDocs(v);
              }}
              placeholder="Select project…"
            />
          </div>
          <Link href="/documents" className="self-center text-sm text-[#e87722] hover:underline">
            Full documents library →
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {canUpload && (
          <form onSubmit={onUpload} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Category</label>
              <SearchableSelect
                className={INPUT}
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                placeholder="Category…"
              />
            </div>
            <div>
              <label className={LABEL}>Title</label>
              <input
                className={INPUT}
                value={title}
                placeholder="Optional override"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>File</label>
              <input name="file" type="file" required className={INPUT} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy || !projectId}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {busy ? 'Uploading…' : 'Upload planning doc'}
              </button>
            </div>
          </form>
        )}

        {docs.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search planning docs…"
            filters={[categoryFilter]}
            filterValues={filterValues}
            onFilterChange={setFilter}
          />
        )}

        <div className={`${CARD} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{labelCategory(d.category)}</td>
                  <td className="px-4 py-3 font-medium text-[#1a2744]">{d.title}</td>
                  <td className="px-4 py-3">v{d.version}</td>
                  <td className="px-4 py-3">
                    {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {!docs.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No planning documents for this project yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {docs.length > 0 && (
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
