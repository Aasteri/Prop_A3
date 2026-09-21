'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';
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

  const jobStatusFilter: FilterDef = useMemo(() => {
    const statuses = [...new Set(jobs.map((j) => j.status))].sort();
    return {
      key: 'status',
      label: 'Status',
      options: statuses.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
      getValue: (item) => (item as Job).status,
    };
  }, [jobs]);

  const {
    query: jobsQuery,
    setQuery: setJobsQuery,
    filterValues: jobsFilterValues,
    setFilter: setJobsFilter,
    page: jobsPage,
    setPage: setJobsPage,
    pageItems: jobsPageItems,
    filteredCount: jobsFilteredCount,
    pageCount: jobsPageCount,
  } = useFilteredList<Job>({
    items: jobs,
    searchKeys: ['publicId', 'title', 'status', (j) => j.catalogItem?.label ?? '', (j) => j.seeker?.email ?? ''],
    filters: [jobStatusFilter],
  });

  if (!canManage) {
    return (
      <AppShell>
        <p className="text-sm text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  const pending = artisans.filter((a) => a.status === 'PENDING_REVIEW');
  const approved = artisans.filter((a) => a.status === 'APPROVED');

  const jobOptions = jobs.map((j) => ({
    value: j.id,
    label: `${j.publicId} · ${j.title} · ${j.status}`,
  }));

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
                  className="rounded bg-slate-200 px-2 py-1 text-slate-900"
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
            <SearchableSelect
              className="w-full"
              value={selectedJob}
              onChange={setSelectedJob}
              options={jobOptions}
              emptyLabel="Select…"
              placeholder="Search jobs…"
            />
          </div>
          <div>
            <label className={LABEL}>Approved artisans (multi-select)</label>
            <div className={`${INPUT} max-h-40 space-y-1 overflow-y-auto p-2`}>
              {approved.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedArtisans.includes(a.id)}
                    onChange={(e) => {
                      setSelectedArtisans((prev) =>
                        e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id),
                      );
                    }}
                  />
                  <span>
                    [{a.source}] {a.fullName}
                  </span>
                </label>
              ))}
              {!approved.length && (
                <p className="text-sm text-slate-500">No approved artisans.</p>
              )}
            </div>
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
        <ListToolbar
          query={jobsQuery}
          onQueryChange={setJobsQuery}
          searchPlaceholder="Search jobs…"
          filters={[jobStatusFilter]}
          filterValues={jobsFilterValues}
          onFilterChange={setJobsFilter}
        />
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {jobsPageItems.map((j) => (
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
        <PaginationBar
          page={jobsPage}
          pageCount={jobsPageCount}
          pageSize={20}
          filteredCount={jobsFilteredCount}
          onPageChange={setJobsPage}
        />
      </section>
    </AppShell>
  );
}
