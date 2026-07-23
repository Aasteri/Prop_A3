'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';

type ChangeDetail = {
  id: string;
  changeId: string;
  revisionDate: string;
  originatorName: string;
  description: string;
  justification: string;
  status: string;
  impactLevel: string;
  rejectReason: string | null;
  project: { id: string; name: string; location: string | null };
  site: { code: string; name: string };
  revisedBy?: { firstName: string; lastName: string } | null;
  approvedBy?: { firstName: string; lastName: string } | null;
};

export default function ChangeLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<ChangeDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<ChangeDetail>(`/change-log/${id}`).then(setEntry).catch(() => router.push('/change-log'));
  }, [id, router]);

  const canReview =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  async function submitForReview() {
    const updated = await api<ChangeDetail>(`/change-log/${id}/submit`, { method: 'POST' });
    setEntry(updated);
  }

  async function approve() {
    const updated = await api<ChangeDetail>(`/change-log/${id}/approve`, { method: 'POST' });
    setEntry(updated);
  }

  async function reject() {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    const updated = await api<ChangeDetail>(`/change-log/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason: reason }),
    });
    setEntry(updated);
  }

  if (!entry) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/change-log" className="text-sm text-[#e87722]">
        ← Back to change log
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{entry.changeId}</h1>
      <p className="text-slate-600">
        {entry.project.name} · {entry.site.code} ·{' '}
        {new Date(entry.revisionDate).toLocaleDateString()}
      </p>

      <div className="mt-4 space-y-4">
        <Card title="Details">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Originator</dt>
              <dd>{entry.originatorName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Impact</dt>
              <dd>{entry.impactLevel}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd>{entry.status.replace(/_/g, ' ')}</dd>
            </div>
            {entry.revisedBy && (
              <div>
                <dt className="text-slate-500">Revised by</dt>
                <dd>
                  {entry.revisedBy.firstName} {entry.revisedBy.lastName}
                </dd>
              </div>
            )}
            {entry.approvedBy && entry.status === 'APPROVED' && (
              <div>
                <dt className="text-slate-500">Approved by</dt>
                <dd>
                  {entry.approvedBy.firstName} {entry.approvedBy.lastName}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Change description">
          <p className="text-sm whitespace-pre-wrap">{entry.description}</p>
        </Card>

        <Card title="Justification">
          <p className="text-sm whitespace-pre-wrap">{entry.justification}</p>
        </Card>

        {entry.rejectReason && (
          <Card title="Rejection reason">
            <p className="text-sm text-red-700">{entry.rejectReason}</p>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {(entry.status === 'DRAFT' || entry.status === 'REJECTED') && (
            <button
              type="button"
              onClick={submitForReview}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white"
            >
              Submit for review
            </button>
          )}
          {canReview && entry.status === 'IN_REVIEW' && (
            <>
              <button
                type="button"
                onClick={approve}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={reject}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-2 font-semibold text-[#1a2744]">{title}</h2>
      {children}
    </section>
  );
}
