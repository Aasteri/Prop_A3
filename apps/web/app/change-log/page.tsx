'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, downloadCsv, getToken, getUser, type AuthUser } from '@/lib/api';

type ChangeEntry = {
  id: string;
  changeId: string;
  revisionDate: string;
  description: string;
  status: string;
  impactLevel: string;
  project: { id: string; name: string };
  site: { code: string };
  originatorName: string;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  IN_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function ChangeLogListPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<ChangeEntry[]>('/change-log')
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [router]);

  const canReview =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  async function approve(id: string) {
    await api(`/change-log/${id}/approve`, { method: 'POST' });
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'APPROVED' } : e)),
    );
  }

  async function reject(id: string) {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    await api(`/change-log/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason: reason }),
    });
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'REJECTED' } : e)),
    );
  }

  async function exportProject(projectId: string, projectName: string) {
    await downloadCsv(
      `/change-log/export/${projectId}`,
      `change-log-${projectName.replace(/\s+/g, '-').toLowerCase()}.csv`,
    );
  }

  const projectIds = [...new Set(entries.map((e) => e.project.id))];

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#1a2744]">Project Change Log</h1>
        <Link
          href="/change-log/new"
          className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          + Raise change
        </Link>
      </div>

      {projectIds.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {projectIds.map((pid) => {
            const entry = entries.find((e) => e.project.id === pid)!;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => exportProject(pid, entry.project.name)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
              >
                Export {entry.site.code} CSV
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : !entries.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">No change log entries yet.</p>
          <Link href="/change-log/new" className="mt-2 inline-block text-[#e87722]">
            Raise the first change →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Change ID</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Originator</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Impact</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{e.changeId}</td>
                  <td className="px-3 py-2">
                    {new Date(e.revisionDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{e.originatorName}</td>
                  <td className="max-w-xs truncate px-3 py-2">{e.description}</td>
                  <td className="px-3 py-2">{e.impactLevel}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[e.status] ?? ''}`}
                    >
                      {e.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Link
                        href={`/change-log/${e.id}`}
                        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        View
                      </Link>
                      {canReview && e.status === 'IN_REVIEW' && (
                        <>
                          <button
                            type="button"
                            onClick={() => approve(e.id)}
                            className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(e.id)}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
