'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';
import {
  api,
  ApiError,
  DocumentRecord,
  generateAllocationLetter,
  getToken,
  getUser,
  uploadDocument,
  type AuthUser,
} from '@/lib/api';

import { getApiBaseUrl } from '@/lib/api-base';

const API_URL = getApiBaseUrl();

const CATEGORIES = [
  'CONTRACT',
  'PERMIT',
  'RECEIPT',
  'DRAWING',
  'CERTIFICATE',
  'BOQ',
  'ALLOCATION_LETTER',
  'TDP',
  'C_OF_O',
  'SOIL_TEST',
  'ARCH_DESIGN',
  'STRUCTURAL_DESIGN',
  'ME_DESIGN',
  'LABOUR_SCHEDULE',
  'MATERIAL_SCHEDULE',
  'WORK_SCHEDULE',
  'OTHER',
] as const;

type Project = { id: string; name: string; site: { code: string } };
type ClientRow = { id: string; clientRef: string; firstName: string; lastName: string };

function labelCategory(c: string) {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [versions, setVersions] = useState<DocumentRecord[]>([]);

  const [entityType, setEntityType] = useState<'PROJECT' | 'CLIENT'>('PROJECT');
  const [entityId, setEntityId] = useState('');
  const [category, setCategory] = useState<string>('CONTRACT');
  const [title, setTitle] = useState('');

  async function loadDocs() {
    const rows = await api<DocumentRecord[]>('/documents');
    setDocs(rows);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    Promise.all([
      loadDocs(),
      api<Project[]>('/projects'),
      api<ClientRow[]>('/crm/clients').catch(() => [] as ClientRow[]),
    ])
      .then(([, projs, clientRows]) => {
        setProjects(projs);
        if (projs[0]) setEntityId(projs[0].id);
        setClients(clientRows);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const canUpload =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'FINANCE' ||
    user?.role === 'SALES' ||
    user?.role === 'ENGINEER';

  const canGenerateAllocation =
    user?.role === 'SALES' ||
    user?.role === 'FINANCE' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  const entityOptions = useMemo(() => {
    if (entityType === 'PROJECT') {
      return projects.map((p) => ({
        value: p.id,
        label: `${p.site.code} · ${p.name}`,
      }));
    }
    return clients.map((c) => ({
      value: c.id,
      label: `${c.clientRef} · ${c.firstName} ${c.lastName}`,
    }));
  }, [entityType, projects, clients]);

  const categoryOptions = useMemo(
    () => CATEGORIES.map((c) => ({ value: c, label: labelCategory(c) })),
    [],
  );

  const entityTypeOptions = useMemo(
    () => [
      { value: 'PROJECT', label: 'Project' },
      { value: 'CLIENT', label: 'Client' },
    ],
    [],
  );

  const categoryFilter: FilterDef = useMemo(
    () => ({
      key: 'category',
      label: 'Category',
      options: CATEGORIES.map((c) => ({ value: c, label: labelCategory(c) })),
      getValue: (item) => (item as DocumentRecord).category,
    }),
    [],
  );

  const entityTypeFilter: FilterDef = useMemo(
    () => ({
      key: 'entityType',
      label: 'Entity type',
      options: [
        { value: 'PROJECT', label: 'Project' },
        { value: 'CLIENT', label: 'Client' },
      ],
      getValue: (item) => (item as DocumentRecord).entityType,
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
  } = useFilteredList<DocumentRecord>({
    items: docs,
    searchKeys: ['title', 'category', 'entityType', 'entityId', 'filename'],
    filters: [categoryFilter, entityTypeFilter],
  });

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    const fileInput = (e.target as HTMLFormElement).elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !entityId) return;
    setError('');
    setBusy('upload');
    try {
      await uploadDocument({ entityType, entityId, category, title: title || file.name }, file);
      setTitle('');
      fileInput.value = '';
      await loadDocs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setBusy('');
    }
  }

  async function showVersions(doc: DocumentRecord) {
    if (expandedId === doc.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(doc.id);
    const rows = await api<DocumentRecord[]>(`/documents/${doc.id}/versions`);
    setVersions(rows);
  }

  async function onGenerateAllocation() {
    const demoClient = clients.find((c) => c.clientRef === 'CLT-0001') ?? clients[0];
    const demoProject = projects.find((p) => p.id === 'seed-gz2-duplex') ?? projects[0];
    if (!demoClient || !demoProject) {
      setError('No client or project found for allocation letter');
      return;
    }
    setError('');
    setBusy('allocation');
    try {
      await generateAllocationLetter(demoClient.id, demoProject.id);
      await loadDocs();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Generation failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">Documents</h1>
          <p className="text-sm text-slate-600">Versioned uploads linked to projects and clients</p>
        </div>
        {canGenerateAllocation && clients.length > 0 && projects.length > 0 && (
          <button
            type="button"
            disabled={busy === 'allocation'}
            onClick={onGenerateAllocation}
            className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#253660] disabled:opacity-50"
          >
            Generate allocation letter (demo client)
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {canUpload && (
        <form
          onSubmit={onUpload}
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 space-y-3"
        >
          <h2 className="font-semibold text-[#1a2744]">Upload document</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className="text-slate-600">Entity type</span>
              <SearchableSelect
                className="mt-1"
                options={entityTypeOptions}
                value={entityType}
                onChange={(v) => {
                  setEntityType(v as 'PROJECT' | 'CLIENT');
                  setEntityId('');
                }}
                placeholder="Entity type…"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">{entityType === 'PROJECT' ? 'Project' : 'Client'}</span>
              <SearchableSelect
                className="mt-1"
                required
                options={entityOptions}
                value={entityId}
                onChange={setEntityId}
                emptyLabel="Select…"
                placeholder={entityType === 'PROJECT' ? 'Search project…' : 'Search client…'}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Category</span>
              <SearchableSelect
                className="mt-1"
                options={categoryOptions}
                value={category}
                onChange={setCategory}
                placeholder="Category…"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="text-slate-600">File</span>
              <input
                name="file"
                type="file"
                accept=".pdf,image/*,.doc,.docx"
                required
                className="mt-1 block text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={busy === 'upload'}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-50"
            >
              Upload
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-slate-500">No documents yet.</p>
      ) : (
        <>
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search documents…"
            filters={[categoryFilter, entityTypeFilter]}
            filterValues={filterValues}
            onFilterChange={setFilter}
          />
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Linked to</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d) => (
                <Fragment key={d.id}>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-[#1a2744]">{d.title}</td>
                    <td className="px-4 py-3">{labelCategory(d.category)}</td>
                    <td className="px-4 py-3">
                      {d.entityType} ·{' '}
                      <Link
                        href={
                          d.entityType === 'PROJECT'
                            ? `/milestones/${d.entityId}`
                            : '/crm'
                        }
                        className="text-[#e87722] hover:underline"
                      >
                        {d.entityId.slice(0, 12)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3">v{d.version}</td>
                    <td className="px-4 py-3">
                      {new Date(d.createdAt).toLocaleDateString()}
                      {d.uploadedBy && (
                        <span className="block text-xs text-slate-500">
                          {d.uploadedBy.firstName} {d.uploadedBy.lastName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`${API_URL}${d.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-3 text-[#e87722] hover:underline"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => showVersions(d)}
                        className="text-slate-600 hover:text-[#1a2744]"
                      >
                        {expandedId === d.id ? 'Hide' : 'History'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === d.id && (
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td colSpan={6} className="px-4 py-3">
                        <p className="mb-2 text-xs font-medium uppercase text-slate-500">Version history</p>
                        <ul className="space-y-1 text-sm">
                          {versions.map((v) => (
                            <li key={v.id} className="flex flex-wrap items-center gap-2">
                              <span>v{v.version}</span>
                              <span className="text-slate-500">{v.filename}</span>
                              <span className="text-slate-400">
                                {new Date(v.createdAt).toLocaleString()}
                              </span>
                              <a
                                href={`${API_URL}${v.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#e87722] hover:underline"
                              >
                                Download
                              </a>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={20}
            filteredCount={filteredCount}
            onPageChange={setPage}
          />
        </>
      )}
    </AppShell>
  );
}
