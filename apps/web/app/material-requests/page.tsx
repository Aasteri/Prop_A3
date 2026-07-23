'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';

type MaterialRequest = {
  id: string;
  requestRef: string;
  status: string;
  area: string | null;
  requiredDate: string;
  project: { name: string };
  site: { code: string };
  requestedBy: { firstName: string; lastName: string };
  lines: { material: string; quantityRequested: number | string }[];
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  ISSUED: 'bg-green-100 text-green-800',
  PARTIALLY_ISSUED: 'bg-lime-100 text-lime-800',
};

export default function MaterialRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<MaterialRequest[]>('/material-requests')
      .then(setRequests)
      .finally(() => setLoading(false));
  }, [router]);

  const canApprove =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  const canIssue =
    user?.role === 'STORE_MANAGER' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1a2744]">Material Requests</h1>
        <Link
          href="/material-requests/new"
          className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          + New request
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : !requests.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">No material requests yet.</p>
          <Link href="/material-requests/new" className="mt-2 inline-block text-[#e87722]">
            Create the first request →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-[#1a2744]">
                  {r.requestRef} · {r.site.code}
                </p>
                <p className="text-sm text-slate-500">
                  {r.project.name}
                  {r.area ? ` · ${r.area}` : ''} · Required{' '}
                  {new Date(r.requiredDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-400">
                  {r.lines.length} item(s) · By {r.requestedBy.firstName}{' '}
                  {r.requestedBy.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[r.status] ?? ''}`}
                >
                  {r.status.replace(/_/g, ' ')}
                </span>
                <Link
                  href={`/material-requests/${r.id}`}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  {r.status === 'PENDING_APPROVAL' && canApprove
                    ? 'Review'
                    : r.status === 'APPROVED' && canIssue
                      ? 'Issue'
                      : 'View'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
