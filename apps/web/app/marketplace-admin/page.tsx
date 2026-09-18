'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER, SECTION_TITLE } from '@/lib/ui';

type Artisan = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  source: string;
  status: string;
  trades: string[] | null;
};

type Job = {
  id: string;
  publicId: string;
  title: string;
  status: string;
  catalogItem?: { label: string; category: string };
  seeker?: { firstName: string; lastName: string; email: string };
  assignments?: { artisanId: string; artisan: { fullName: string } }[];
};

export default function MarketplaceAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedArtisans, setSelectedArtisans] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [addForm, setAddForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    trades: '',
    createLogin: true,
  });

  const canManage =
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'FINANCE';

  function reload() {
    api<Artisan[]>('/artisans').then(setArtisans).catch(console.error);
    api<Job[]>('/marketplace/jobs').then(setJobs).catch(console.error);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const u = getUser<AuthUser>();
    setUser(u);
    if (!u || !['CEO', 'ADMIN', 'PROJECT_MANAGER', 'FINANCE'].includes(u.role)) {
      router.replace('/dashboard');
      return;
    }
    reload();
  }, [router]);

  async function setStatus(id: string, status: string) {
    await api(`/artisans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    reload();
  }

  async function addInternal(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    await api('/artisans', {
      method: 'POST',
      body: JSON.stringify({
        fullName: addForm.fullName,
        phone: addForm.phone,
        email: addForm.email || undefined,
        password: addForm.password || undefined,
        createLogin: addForm.createLogin && Boolean(addForm.email && addForm.password),
        source: 'INTERNAL',
        status: 'APPROVED',
        trades: addForm.trades
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    setMsg('Internal artisan added');
    setAddForm({ fullName: '', phone: '', email: '', password: '', trades: '', createLogin: true });
    reload();
  }

  async function assign() {
    if (!selectedJob || !selectedArtisans.length) return;
    await api(`/marketplace/jobs/${selectedJob}/assign`, {
      method: 'POST',
      body: JSON.stringify({ artisanIds: selectedArtisans }),
    });
    setMsg('Artisans assigned — they can now submit quotes');
    setSelectedArtisans([]);
    reload();
  }

  if (!canManage) {
    return (
      <AppShell>
        <p className="text-sm text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  const pending = artisans.filter((a) => a.status === 'PENDING_REVIEW');
  const approved = artisans.filter((a) => a.status === 'APPROVED');

  return (
    <AppShell>
      <h1 className={PAGE_HEADER}>Artisan marketplace</h1>
      <p className="mt-1 text-sm text-slate-600">
        Approve signups, add internal roster artisans, assign jobs to one or more workers for quotes.
        Escrow = workmanship only (fee % in Company settings).
      </p>
      {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}

      <section className={`${CARD} mt-6 p-5`}>
        <h2 className={SECTION_TITLE}>Pending applications ({pending.length})</h2>
        <ul className="mt-3 space-y-2">
          {pending.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {a.fullName} · {a.phone} · {a.email}
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="rounded bg-emerald-600 px-2 py-1 text-white"
                  onClick={() => setStatus(a.id, 'APPROVED')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded bg-slate-200 px-2 py-1"
                  onClick={() => setStatus(a.id, 'REJECTED')}
                >
                  Reject
                </button>
              </span>
            </li>
          ))}
          {!pending.length && <p className="text-sm text-slate-500">No pending applications.</p>}
        </ul>
      </section>

      <section className={`${CARD} mt-6 p-5`}>
        <h2 className={SECTION_TITLE}>Add internal artisan</h2>
        <form onSubmit={addInternal} className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Full name</label>
            <input
              className={INPUT}
              required
              value={addForm.fullName}
              onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL}>Phone</label>
            <input
              className={INPUT}
              required
              value={addForm.phone}
              onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL}>Login email (optional)</label>
            <input
              className={INPUT}
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL}>Temp password</label>
            <input
              className={INPUT}
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL}>Trades (comma-separated)</label>
            <input
              className={INPUT}
              value={addForm.trades}
              onChange={(e) => setAddForm((f) => ({ ...f, trades: e.target.value }))}
            />
          </div>
          <button type="submit" className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white">
            Add as INTERNAL + approved
          </button>
        </form>
      </section>

      <section className={`${CARD} mt-6 p-5`}>
        <h2 className={SECTION_TITLE}>Assign artisans to a job</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <label className={LABEL}>Job</label>
            <select
              className={INPUT}
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              <option value="">Select…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.publicId} · {j.title} · {j.status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Approved artisans (multi-select)</label>
            <select
              className={INPUT}
              multiple
              size={6}
              value={selectedArtisans}
              onChange={(e) =>
                setSelectedArtisans([...e.target.selectedOptions].map((o) => o.value))
              }
            >
              {approved.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.source}] {a.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={assign}
          className="mt-3 rounded-lg bg-[#e87722] px-4 py-2 text-sm font-semibold text-white"
        >
          Assign selected
        </button>
      </section>

      <section className={`${CARD} mt-6 p-5`}>
        <h2 className={SECTION_TITLE}>Recent jobs</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {jobs.slice(0, 30).map((j) => (
            <li key={j.id} className="flex justify-between gap-2 py-2">
              <span>
                <span className="font-medium">{j.publicId}</span> {j.title} · {j.status}
                {j.seeker && (
                  <span className="block text-xs text-slate-500">
                    {j.seeker.firstName} {j.seeker.lastName}
                  </span>
                )}
              </span>
              <a className="text-[#e87722] hover:underline" href={`/marketplace/jobs/${j.id}`}>
                Open
              </a>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
