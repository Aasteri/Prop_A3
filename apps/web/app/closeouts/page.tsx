'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, downloadPdf, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; location: string | null; site?: { code: string } };
type Zone = { zone: string; items: string[] };
type Closeout = {
  id: string;
  number: string;
  status: string;
  developerName: string;
  clientName: string;
  durationStart: string | null;
  durationEnd: string | null;
  executiveSummary: string;
  accomplishmentsJson: Zone[];
  openItems: string | null;
  overBudget: boolean;
  onSchedule: boolean;
  project: { id: string; name: string; location: string | null };
};

export default function CloseoutsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<Closeout[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    developerName: 'Messrs Triple A Realty Projects Ltd',
    clientName: '',
    durationStart: '',
    durationEnd: '',
    executiveSummary: '',
    openItems: '',
    overBudget: false,
    onSchedule: true,
  });
  const [zones, setZones] = useState<Zone[]>([]);

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const load = () => {
    api<Closeout[]>('/closeouts')
      .then((data) =>
        setRows(
          data.map((r) => ({
            ...r,
            accomplishmentsJson: Array.isArray(r.accomplishmentsJson)
              ? r.accomplishmentsJson
              : [],
          })),
        ),
      )
      .catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
    api<Project[]>('/projects').then(setProjects).catch(console.error);
    api<Zone[]>('/closeouts/template-zones').then(setZones).catch(() => setZones([]));
  }, [router]);

  function updateZoneItems(i: number, text: string) {
    const next = [...zones];
    next[i] = {
      ...next[i],
      items: text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setZones(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/closeouts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          durationStart: form.durationStart || undefined,
          durationEnd: form.durationEnd || undefined,
          openItems: form.openItems || undefined,
          accomplishments: zones,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create closeout');
    } finally {
      setBusy(false);
    }
  }

  async function issue(id: string) {
    await api(`/closeouts/${id}/issue`, { method: 'PATCH' });
    load();
  }

  async function acknowledge(id: string) {
    const name = window.prompt('Client acknowledgment name') || undefined;
    await api(`/closeouts/${id}/acknowledge`, {
      method: 'PATCH',
      body: JSON.stringify({ clientAcknowledgedBy: name }),
    });
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Closeout
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Project closeout reports
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Doc 7 handover narrative: executive summary, floor/zone accomplishments, open
                M&amp;E items, client acknowledgment (US-CLOSE-04).
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showForm ? 'Cancel' : 'New closeout'}
              </button>
            )}
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div className="sm:col-span-2">
              <label className={LABEL}>Project</label>
              <select
                className={INPUT}
                required
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">Select…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.site?.code ? `${p.site.code} · ` : ''}
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Developer</label>
              <input
                className={INPUT}
                required
                value={form.developerName}
                onChange={(e) => setForm({ ...form, developerName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Client</label>
              <input
                className={INPUT}
                required
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Duration start</label>
              <input
                type="date"
                className={INPUT}
                value={form.durationStart}
                onChange={(e) => setForm({ ...form, durationStart: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Duration end</label>
              <input
                type="date"
                className={INPUT}
                value={form.durationEnd}
                onChange={(e) => setForm({ ...form, durationEnd: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Executive summary</label>
              <textarea
                className={INPUT}
                rows={4}
                required
                value={form.executiveSummary}
                onChange={(e) => setForm({ ...form, executiveSummary: e.target.value })}
              />
            </div>
            {zones.map((z, i) => (
              <div key={z.zone} className="sm:col-span-2">
                <label className={LABEL}>{z.zone} (one item per line)</label>
                <textarea
                  className={INPUT}
                  rows={3}
                  value={z.items.join('\n')}
                  onChange={(e) => updateZoneItems(i, e.target.value)}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className={LABEL}>Open items</label>
              <textarea
                className={INPUT}
                rows={3}
                value={form.openItems}
                onChange={(e) => setForm({ ...form, openItems: e.target.value })}
                placeholder="e.g. Continue to monitor M&E installations, lift servicing…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.onSchedule}
                onChange={(e) => setForm({ ...form, onSchedule: e.target.checked })}
              />
              On schedule
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.overBudget}
                onChange={(e) => setForm({ ...form, overBudget: e.target.checked })}
              />
              Over budget
            </label>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Save draft
              </button>
            </div>
          </form>
        )}

        <Link href="/projects-hub" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Projects hub
        </Link>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">
                    {r.number} · {r.status}
                  </p>
                  <h2 className="mt-1 font-semibold text-[#1a2744]">
                    {r.project.name} · {r.clientName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.executiveSummary}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.onSchedule ? 'On schedule' : 'Behind'} ·{' '}
                    {r.overBudget ? 'Over budget' : 'Within budget'} ·{' '}
                    {r.accomplishmentsJson.length} zone(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadPdf(`/closeouts/${r.id}/pdf`, `${r.number}.pdf`)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
                  >
                    PDF
                  </button>
                  {canManage && r.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => issue(r.id)}
                      className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                    >
                      Issue
                    </button>
                  )}
                  {canManage && r.status === 'ISSUED' && (
                    <button
                      type="button"
                      onClick={() => acknowledge(r.id)}
                      className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                    >
                      Client acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No closeout reports yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
