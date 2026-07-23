'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const CATEGORIES = [
  'CONTRACT',
  'PERMIT',
  'RECEIPT',
  'DRAWING',
  'CERTIFICATE',
  'BOQ',
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
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value as 'PROJECT' | 'CLIENT');
                  setEntityId('');
                }}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="PROJECT">Project</option>
                <option value="CLIENT">Client</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">{entityType === 'PROJECT' ? 'Project' : 'Client'}</span>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Select…</option>
                {entityType === 'PROJECT'
                  ? projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.site.code} · {p.name}
                      </option>
                    ))
                  : clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.clientRef} · {c.firstName} {c.lastName}
                      </option>
                    ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {labelCategory(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
              {docs.map((d) => (
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
      )}
    </AppShell>
  );
}
