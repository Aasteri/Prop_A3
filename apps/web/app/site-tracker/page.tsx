'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { OfflineBanner } from '@/components/OfflineBanner';
import { api, getToken, getUser, type AuthUser, downloadPdf } from '@/lib/api';

type DailyLog = {
  id: string;
  refCode: string;
  date: string;
  projectName: string;
  status: string;
  site: { code: string; name: string };
  submittedBy?: { firstName: string; lastName: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function SiteTrackerListPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<DailyLog[]>('/site-tracker/logs')
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [router]);

  const canApprove =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  async function approve(id: string) {
    await api(`/site-tracker/logs/${id}/approve`, { method: 'POST' });
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'APPROVED' } : l)),
    );
  }

  async function reject(id: string) {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    await api(`/site-tracker/logs/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason: reason }),
    });
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'REJECTED' } : l)),
    );
  }

  return (
    <AppShell>
      <OfflineBanner />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1a2744]">Site Tracker</h1>
        <Link
          href="/site-tracker/new"
          className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          + New log
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading logs…</p>
      ) : !logs.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">No daily logs yet.</p>
          <Link href="/site-tracker/new" className="mt-2 inline-block text-[#e87722]">
            Create the first log →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-[#1a2744]">{log.projectName}</p>
                <p className="text-sm text-slate-500">
                  {log.refCode} · {log.site.code} ·{' '}
                  {new Date(log.date).toLocaleDateString()}
                </p>
                {log.submittedBy && (
                  <p className="text-xs text-slate-400">
                    By {log.submittedBy.firstName} {log.submittedBy.lastName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[log.status] ?? ''}`}
                >
                  {log.status}
                </span>
                <Link
                  href={`/site-tracker/${log.id}`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  View
                </Link>
                {canApprove && log.status === 'SUBMITTED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => approve(log.id)}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(log.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
