'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { BTN_PRIMARY, CARD, INPUT, LABEL } from '@/lib/ui';

type Estate = {
  id: string;
  code: string;
  name: string;
  title: string;
  location: string | null;
};

export default function EstateTerrierIndexPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', name: '', title: '', location: '' });

  const canManage =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'FINANCE';

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<Estate>({
    items: estates,
    searchKeys: ['code', 'name', 'title', 'location'],
  });

  const load = () => {
    api<Estate[]>('/estate-terrier/estates').then(setEstates).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const created = await api<Estate>('/estate-terrier/estates', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ code: '', name: '', title: '', location: '' });
      router.push(`/estate-terrier/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create estate');
    }
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">Estate Terrier</h1>
          <p className="text-sm text-slate-600">16-column rental register per managed estate</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
          >
            {showForm ? 'Cancel' : 'Create estate'}
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <form onSubmit={onCreate} className={`${CARD} mb-4 grid gap-3 p-4 sm:grid-cols-2`}>
          <label className="block text-sm">
            <span className={LABEL}>Code</span>
            <input
              required
              className={INPUT}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="DAWAKI"
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Name</span>
            <input
              required
              className={INPUT}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className={LABEL}>Title (display)</span>
            <input
              className={INPUT}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Defaults to name"
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
          <div className="sm:col-span-2">
            <button type="submit" className={BTN_PRIMARY}>
              Save estate
            </button>
          </div>
        </form>
      )}

      {estates.length > 0 && (
        <ListToolbar
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="Search estates…"
        />
      )}

      <div className="space-y-3">
        {pageItems.map((e) => (
          <Link
            key={e.id}
            href={`/estate-terrier/${e.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-[#e87722]"
          >
            <p className="font-medium text-[#1a2744]">{e.title}</p>
            <p className="text-sm text-slate-500">
              {e.code} · {e.location}
            </p>
          </Link>
        ))}
        {!estates.length && !showForm && (
          <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
            No rental estates yet.
            {canManage ? ' Use Create estate above to add one.' : ''}
          </div>
        )}
      </div>
      {estates.length > 0 && (
        <PaginationBar
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          filteredCount={filteredCount}
          onPageChange={setPage}
        />
      )}
    </AppShell>
  );
}
