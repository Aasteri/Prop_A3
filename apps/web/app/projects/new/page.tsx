'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AppShell } from '@/components/AppShell';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Site = { id: string; code: string; name: string };

function NewProjectInner() {
  const router = useRouter();
  const search = useSearchParams();
  const editId = search.get('edit');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    siteId: '',
    name: '',
    projectNumber: '',
    location: '',
    contractRef: '',
    budgetAmount: '',
    status: 'PLANNING',
  });

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const siteOptions = useMemo(
    () =>
      sites.map((s) => ({
        value: s.id,
        label: `${s.code} · ${s.name}`,
        keywords: s.name,
      })),
    [sites],
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const u = getUser<AuthUser>();
    setUser(u);
    if (!u || !['PROJECT_MANAGER', 'CEO', 'ADMIN'].includes(u.role)) {
      setError('Only PM, CEO, or Admin can create projects');
      return;
    }
    api<Site[]>('/sites').then(setSites).catch(console.error);

    if (editId) {
      api<{
        id: string;
        siteId: string;
        name: string;
        projectNumber: string | null;
        location: string | null;
        contractRef: string | null;
        budgetAmount: string | number | null;
        status: string;
      }>(`/projects/${editId}`)
        .then((p) => {
          setForm({
            siteId: p.siteId,
            name: p.name,
            projectNumber: p.projectNumber ?? '',
            location: p.location ?? '',
            contractRef: p.contractRef ?? '',
            budgetAmount: p.budgetAmount != null ? String(p.budgetAmount) : '',
            status: p.status,
          });
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load project'));
    }
  }, [router, editId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        siteId: form.siteId,
        name: form.name,
        projectNumber: form.projectNumber || undefined,
        location: form.location || undefined,
        contractRef: form.contractRef || undefined,
        budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined,
        status: form.status as 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETE',
      };
      if (editId) {
        await api(`/projects/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
        router.push('/projects-hub');
      } else {
        const created = await api<{ id: string }>('/projects', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        router.push(`/projects/initiate?created=${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className={PAGE_HEADER}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
          Projects · {editId ? 'Edit' : 'New'}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {editId ? 'Edit project' : 'Create project'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
              Starts in Initiate. After save you can open the charter, planning docs, and ethics
              flow.
            </p>
          </div>
          <Link
            href="/projects-hub"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
          >
            Project pulse
          </Link>
        </div>
      </header>

      {!canManage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : (
        <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
          <label className="block text-sm sm:col-span-2">
            <span className={LABEL}>Site</span>
            <SearchableSelect
              className={INPUT}
              options={siteOptions}
              value={form.siteId}
              onChange={(v) => setForm({ ...form, siteId: v })}
              emptyLabel="Select site…"
              placeholder="Search sites…"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className={LABEL}>Project name</span>
            <input
              required
              className={INPUT}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Construction of Luxury Duplex, Guzape"
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Project number</span>
            <input
              className={INPUT}
              value={form.projectNumber}
              onChange={(e) => setForm({ ...form, projectNumber: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Location</span>
            <input
              className={INPUT}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Contract ref</span>
            <input
              className={INPUT}
              value={form.contractRef}
              onChange={(e) => setForm({ ...form, contractRef: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Budget (₦)</span>
            <input
              type="number"
              min={0}
              step={1}
              className={INPUT}
              value={form.budgetAmount}
              onChange={(e) => setForm({ ...form, budgetAmount: e.target.value })}
            />
          </label>
          <p className="sm:col-span-2 text-xs text-slate-500">
            You will be set as project manager. Process group starts at Initiate.
          </p>
          {error && (
            <p className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={busy || !form.siteId || !form.name} className={BTN_PRIMARY}>
              {busy ? 'Saving…' : editId ? 'Save changes' : 'Create project'}
            </button>
            <Link href="/projects-hub" className={BTN_SECONDARY}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <NewProjectInner />
      </Suspense>
    </AppShell>
  );
}
