'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, PAGE_HEADER } from '@/lib/ui';

type Principle = { number: number; title: string; description: string };

type PrinciplesResponse = {
  version: string;
  principles: Principle[];
  quote: { author: string; text: string };
  company: string;
};

type MeResponse = {
  version: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  notes: string | null;
};

type StatusRow = {
  userId: string;
  acknowledgedAt: string;
  notes: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

export default function EthicsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<PrinciplesResponse | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canViewStatus =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const load = () => {
    api<PrinciplesResponse>('/ethics/principles').then(setData).catch(console.error);
    api<MeResponse>('/ethics/me').then(setMe).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
  }, [router]);

  useEffect(() => {
    if (!canViewStatus) return;
    api<{ acknowledgements: StatusRow[] }>('/ethics/status')
      .then((res) => setStatusRows(res.acknowledgements))
      .catch(console.error);
  }, [canViewStatus]);

  async function acknowledge() {
    setError('');
    setBusy(true);
    try {
      const res = await api<MeResponse>('/ethics/acknowledge', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setMe(res);
      if (canViewStatus) {
        const status = await api<{ acknowledgements: StatusRow[] }>('/ethics/status');
        setStatusRows(status.acknowledgements);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Platform · Compliance
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Professional ethics
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                {data?.company ?? 'Triple A Realty Projects Ltd.'} — site supervisors,
                builders, and project managers.
              </p>
            </div>
            <Link href="/projects-hub" className="rounded-lg border border-white/20 px-4 py-2 text-sm">
              Hub
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#1a2744]">
                Your acknowledgement ({me?.version ?? 'v1'})
              </p>
              {me?.acknowledged ? (
                <p className="mt-1 text-sm text-green-700">
                  Acknowledged
                  {me.acknowledgedAt
                    ? ` on ${new Date(me.acknowledgedAt).toLocaleString()}`
                    : ''}
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-700">Not yet acknowledged</p>
              )}
            </div>
            <button
              type="button"
              disabled={busy || me?.acknowledged}
              onClick={acknowledge}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {me?.acknowledged ? 'Acknowledged' : busy ? 'Saving…' : 'Acknowledge v1'}
            </button>
          </div>
        </div>

        <div className={`${CARD} space-y-4 p-6`}>
          <h2 className="text-lg font-semibold text-[#1a2744]">10 principles</h2>
          <ol className="space-y-4">
            {(data?.principles ?? []).map((p) => (
              <li key={p.number} className="border-b border-slate-100 pb-4 last:border-0">
                <p className="text-sm font-semibold text-[#1a2744]">
                  {p.number}. {p.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{p.description}</p>
              </li>
            ))}
          </ol>
          {data?.quote && (
            <blockquote className="border-l-4 border-[#e87722] pl-4 text-sm italic text-slate-600">
              “{data.quote.text}”
              <footer className="mt-2 not-italic text-xs text-slate-500">
                — {data.quote.author}
              </footer>
            </blockquote>
          )}
        </div>

        {canViewStatus && (
          <div className={`${CARD} overflow-x-auto`}>
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-[#1a2744]">
                Team acknowledgements (PM / CEO)
              </h2>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Acknowledged</th>
                </tr>
              </thead>
              <tbody>
                {statusRows.map((r) => (
                  <tr key={r.userId} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      {r.user.firstName} {r.user.lastName}
                      <span className="block text-xs text-slate-500">{r.user.email}</span>
                    </td>
                    <td className="px-4 py-3">{r.user.role}</td>
                    <td className="px-4 py-3">
                      {new Date(r.acknowledgedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!statusRows.length && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No acknowledgements yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
