'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, SECTION_TITLE } from '@/lib/ui';

type PurgeResult = {
  ok?: boolean;
  message: string;
  deleted?: Record<string, number>;
  uploadsCleared?: boolean;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PurgeResult | null>(null);
  const [error, setError] = useState('');

  const canAccess = user?.role === 'CEO' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const u = getUser<AuthUser>();
    setUser(u);
    if (u?.role !== 'CEO' && u?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [router]);

  async function onPurge(e: FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api<PurgeResult>('/admin/purge-demo-data', {
        method: 'POST',
        body: JSON.stringify({ confirm }),
      });
      if (res.ok === false) {
        setError(res.message);
      } else {
        setResult(res);
        setConfirm('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purge failed');
    } finally {
      setLoading(false);
    }
  }

  if (!user || !canAccess) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  const totalDeleted = result?.deleted
    ? Object.values(result.deleted).reduce((s, n) => s + n, 0)
    : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">System admin</h1>
          <p className="mt-1 text-sm text-slate-600">
            CEO and Admin only. Demo/sample data stays in place until you purge it here.
          </p>
        </div>

        <section className={`${CARD} p-6`}>
          <h2 className={SECTION_TITLE}>Clear demo data</h2>
          <p className="mt-2 text-sm text-slate-600">
            Removes all sample and operational records so you can start fresh with real Triple A data.
            This cannot be undone.
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-[#1a2744]">Will be deleted</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
              <li>Site logs, change orders, material requests, HSE incidents</li>
              <li>Invoices, payments, CRM leads, listings, tenant applications</li>
              <li>Projects, milestones, client portal records, estate terrier</li>
              <li>Settlement bank profiles, COREN licence samples, documents, notifications, audit log</li>
              <li>Uploaded files in site-logs / payments / documents folders</li>
            </ul>
            <p className="mt-3 font-medium text-[#1a2744]">Will be kept</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
              <li>Staff login accounts (@propa3.com — see demo-users-list.md)</li>
              <li>Site definitions: JKW, MPP, GZ2, GZ3</li>
              <li>User ↔ site assignments</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              To restore sample projects and listings after a purge, run{' '}
              <code className="rounded bg-white px-1">npm run db:seed</code> on the server.
            </p>
          </div>

          <form onSubmit={onPurge} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Type <span className="font-mono text-red-700">PURGE DEMO DATA</span> to confirm
              </label>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                placeholder="PURGE DEMO DATA"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || confirm !== 'PURGE DEMO DATA'}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Purging…' : 'Delete all demo data'}
            </button>
          </form>
        </section>

        {result && (
          <section className="rounded-xl border border-green-200 bg-green-50 p-6">
            <h2 className="font-semibold text-green-900">Purge complete</h2>
            <p className="mt-1 text-sm text-green-800">{result.message}</p>
            <p className="mt-2 text-sm text-green-800">
              {totalDeleted.toLocaleString()} database rows removed
              {result.uploadsCleared ? ' · upload folders cleared' : ''}.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
