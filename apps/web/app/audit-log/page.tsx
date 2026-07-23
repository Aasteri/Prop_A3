'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';

type AuditEvent = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  actorName: string | null;
  beforeValue: Record<string, unknown> | null;
  afterValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const ENTITY_TYPES = ['', 'PAYMENT', 'MILESTONE', 'DOCUMENT', 'INVOICE'] as const;

function label(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function JsonPreview({ value }: { value: Record<string, unknown> | null }) {
  if (!value || !Object.keys(value).length) return <span className="text-slate-400">—</span>;
  return (
    <pre className="max-w-xs overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AuditLogPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const canView =
    user?.role === 'CEO' || user?.role === 'FINANCE' || user?.role === 'ADMIN';

  async function load() {
    const q = entityFilter ? `?entityType=${entityFilter}&limit=200` : '?limit=200';
    const rows = await api<AuditEvent[]>(`/audit${q}`);
    setEvents(rows);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const u = getUser<AuthUser>();
    setUser(u);
    if (u?.role !== 'CEO' && u?.role !== 'FINANCE' && u?.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    load().finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!canView) return;
    load().catch(console.error);
  }, [entityFilter, canView]);

  if (!user || !canView) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">Audit log</h1>
          <p className="text-sm text-slate-600">
            Append-only record of payment, milestone, and document changes
          </p>
        </div>
        <label className="text-sm">
          <span className="mr-2 text-slate-600">Filter</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t || 'all'} value={t}>
                {t ? label(t) : 'All types'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-slate-500">No audit events yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Before</th>
                <th className="px-4 py-3">After</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{e.actorName ?? 'System'}</td>
                  <td className="px-4 py-3">{label(e.entityType)}</td>
                  <td className="px-4 py-3">{label(e.action)}</td>
                  <td className="px-4 py-3 max-w-xs">{e.summary}</td>
                  <td className="px-4 py-3">
                    <JsonPreview value={e.beforeValue} />
                  </td>
                  <td className="px-4 py-3">
                    <JsonPreview value={e.afterValue} />
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
