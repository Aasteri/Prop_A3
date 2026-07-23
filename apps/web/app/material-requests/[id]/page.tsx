'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';

type Line = {
  id: string;
  material: string;
  specification: string | null;
  quantityRequested: string | number;
  quantityApproved: string | number | null;
  quantityIssued: string | number;
  unit: string | null;
  urgency: string;
};

type RequestDetail = {
  id: string;
  requestRef: string;
  status: string;
  area: string | null;
  requiredDate: string;
  notes: string | null;
  rejectReason: string | null;
  project: { name: string };
  site: { code: string };
  requestedBy: { firstName: string; lastName: string };
  lines: Line[];
};

export default function MaterialRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<RequestDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [approvedQty, setApprovedQty] = useState<Record<string, number>>({});
  const [issuedQty, setIssuedQty] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<RequestDetail>(`/material-requests/${id}`)
      .then((data) => {
        setReq(data);
        const approved: Record<string, number> = {};
        const issued: Record<string, number> = {};
        for (const line of data.lines) {
          approved[line.id] = Number(line.quantityApproved ?? line.quantityRequested);
          issued[line.id] = Number(line.quantityIssued ?? 0);
        }
        setApprovedQty(approved);
        setIssuedQty(issued);
      })
      .catch(() => router.push('/material-requests'));
  }, [id, router]);

  const canApprove =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  const canIssue =
    user?.role === 'STORE_MANAGER' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  async function submitForReview() {
    const updated = await api<RequestDetail>(`/material-requests/${id}/submit`, {
      method: 'POST',
    });
    setReq(updated);
  }

  async function approve() {
    const updated = await api<RequestDetail>(`/material-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        lines: req!.lines.map((l) => ({
          lineId: l.id,
          quantityApproved: approvedQty[l.id],
        })),
      }),
    });
    setReq(updated);
  }

  async function reject() {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    const updated = await api<RequestDetail>(`/material-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason: reason }),
    });
    setReq(updated);
  }

  async function issue() {
    const updated = await api<RequestDetail>(`/material-requests/${id}/issue`, {
      method: 'POST',
      body: JSON.stringify({
        lines: req!.lines.map((l) => ({
          lineId: l.id,
          quantityIssued: issuedQty[l.id],
        })),
      }),
    });
    setReq(updated);
  }

  if (!req) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/material-requests" className="text-sm text-[#e87722]">
        ← Back to material requests
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{req.requestRef}</h1>
      <p className="text-slate-600">
        {req.project.name} · {req.site.code} · Required{' '}
        {new Date(req.requiredDate).toLocaleDateString()} ·{' '}
        <span className="font-medium">{req.status.replace(/_/g, ' ')}</span>
      </p>

      <div className="mt-4 space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">
            Requested by {req.requestedBy.firstName} {req.requestedBy.lastName}
            {req.area ? ` · Area: ${req.area}` : ''}
          </p>
          {req.notes && <p className="mt-2 text-sm">{req.notes}</p>}
        </section>

        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Material</th>
                <th className="px-3 py-2">Spec</th>
                <th className="px-3 py-2">Requested</th>
                <th className="px-3 py-2">Approved</th>
                <th className="px-3 py-2">Issued</th>
                <th className="px-3 py-2">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {req.lines.map((line) => (
                <tr key={line.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{line.material}</td>
                  <td className="px-3 py-2">{line.specification ?? '—'}</td>
                  <td className="px-3 py-2">
                    {line.quantityRequested} {line.unit}
                  </td>
                  <td className="px-3 py-2">
                    {req.status === 'PENDING_APPROVAL' && canApprove ? (
                      <input
                        type="number"
                        min={0}
                        step={0.001}
                        value={approvedQty[line.id]}
                        onChange={(e) =>
                          setApprovedQty((prev) => ({
                            ...prev,
                            [line.id]: Number(e.target.value),
                          }))
                        }
                        className="w-20 rounded border px-2 py-1"
                      />
                    ) : (
                      `${line.quantityApproved ?? '—'} ${line.unit ?? ''}`
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {(req.status === 'APPROVED' || req.status === 'PARTIALLY_ISSUED') &&
                    canIssue ? (
                      <input
                        type="number"
                        min={0}
                        step={0.001}
                        max={Number(line.quantityApproved ?? line.quantityRequested)}
                        value={issuedQty[line.id]}
                        onChange={(e) =>
                          setIssuedQty((prev) => ({
                            ...prev,
                            [line.id]: Number(e.target.value),
                          }))
                        }
                        className="w-20 rounded border px-2 py-1"
                      />
                    ) : (
                      `${line.quantityIssued} ${line.unit ?? ''}`
                    )}
                  </td>
                  <td className="px-3 py-2">{line.urgency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {req.rejectReason && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Rejected: {req.rejectReason}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {(req.status === 'DRAFT' || req.status === 'REJECTED') && (
            <button
              type="button"
              onClick={submitForReview}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white"
            >
              Submit to PM
            </button>
          )}
          {canApprove && req.status === 'PENDING_APPROVAL' && (
            <>
              <button
                type="button"
                onClick={approve}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
              >
                Approve quantities
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
          {canIssue &&
            (req.status === 'APPROVED' || req.status === 'PARTIALLY_ISSUED') && (
              <button
                type="button"
                onClick={issue}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Record issue
              </button>
            )}
        </div>
      </div>
    </AppShell>
  );
}
