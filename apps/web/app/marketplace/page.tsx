'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type CatalogItem = {
  id: string;
  code: string;
  category: string;
  label: string;
  description: string | null;
};

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [addressText, setAddressText] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getUser<AuthUser>());
    api<CatalogItem[]>(`/marketplace/catalog${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [q]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [items]);

  async function submitJob(e: FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    if (!getToken()) {
      router.push('/marketplace/register');
      return;
    }
    if (!selected) {
      setError('Select a job type from the catalog');
      return;
    }
    setLoading(true);
    try {
      const job = await api<{ id: string; publicId: string }>('/marketplace/jobs', {
        method: 'POST',
        body: JSON.stringify({
          catalogItemId: selected.id,
          title: title || selected.label,
          description,
          locationText,
          addressText,
        }),
      });
      setOk(`Request submitted (${job.publicId}). Admin will assign artisans to quote.`);
      router.push(`/marketplace/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Propa<span className="text-[#e87722]">3</span> Marketplace
            </p>
            <p className="text-sm text-slate-300">Find artisans · Get quotes · Pay workmanship in escrow</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/marketplace/apply" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">
              Join as artisan
            </Link>
            <Link href="/marketplace/register" className="rounded-lg bg-[#e87722] px-3 py-2 font-medium text-white">
              Sign up to request
            </Link>
            <Link href="/login" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <section>
          <h1 className={PAGE_HEADER}>What do you need done?</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Search every common job type, fill the form, and Triple A assigns approved artisans to quote.
            Only the <strong>workmanship / job fee</strong> is paid into Propa3 escrow (platform fee{' '}
            {user ? 'per company settings' : 'typically 2.5%'}). Materials are paid directly to the worker.
          </p>
          <input
            className={`${INPUT} mt-4 max-w-md`}
            placeholder="Search plumbing, AC, tiling, solar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${CARD} max-h-[70vh] overflow-y-auto p-4`}>
            {grouped.map(([category, list]) => (
              <div key={category} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {category}
                </p>
                <ul className="space-y-1">
                  {list.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          setTitle(item.label);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          selected?.id === item.id
                            ? 'bg-[#1a2744] text-white'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className="mt-0.5 block text-xs opacity-80">{item.description}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!items.length && <p className="text-sm text-slate-500">No matches.</p>}
          </section>

          <section className={`${CARD} p-5`}>
            <h2 className="text-lg font-semibold text-[#1a2744]">Request form</h2>
            {!selected ? (
              <p className="mt-3 text-sm text-slate-500">Select a job type on the left.</p>
            ) : (
              <form onSubmit={submitJob} className="mt-4 space-y-3">
                <div>
                  <label className={LABEL}>Selected</label>
                  <p className="text-sm font-medium">
                    {selected.category} · {selected.label}
                  </p>
                </div>
                <div>
                  <label className={LABEL}>Title</label>
                  <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <label className={LABEL}>Describe the work</label>
                  <textarea
                    className={INPUT}
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Area / landmark (optional)</label>
                  <input
                    className={INPUT}
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="e.g. Guzape near Apo"
                  />
                </div>
                <div>
                  <label className={LABEL}>Full address (optional — shared after escrow payment)</label>
                  <input
                    className={INPUT}
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="Street / plot — unlocked in chat after you pay job fee"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {ok && <p className="text-sm text-emerald-700">{ok}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#e87722] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? 'Submitting…' : getToken() ? 'Submit request' : 'Sign up / log in to submit'}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
