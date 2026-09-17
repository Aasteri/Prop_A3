'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Supplier = {
  id: string;
  legalName: string;
  tradingName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  productServices: string | null;
  productPrice: string | null;
  reliabilityStars: number | null;
  notes: string | null;
  status: string;
};

function contactLabel(r: Supplier) {
  const parts = [r.phone, r.email].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

function starsLabel(n: number | null) {
  if (n == null) return '—';
  return `${'★'.repeat(n)}${'☆'.repeat(5 - n)} (${n})`;
}

export default function VendorsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    legalName: '',
    tradingName: '',
    phone: '',
    email: '',
    address: '',
    productServices: '',
    productPrice: '',
    reliabilityStars: '',
    notes: '',
  });

  const load = () => {
    api<Supplier[]>('/procurement/suppliers').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const stars = form.reliabilityStars ? Number(form.reliabilityStars) : undefined;
      await api('/procurement/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          legalName: form.legalName,
          tradingName: form.tradingName || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          productServices: form.productServices || undefined,
          productPrice: form.productPrice || undefined,
          reliabilityStars: stars,
          notes: form.notes || undefined,
        }),
      });
      setShowForm(false);
      setForm({
        legalName: '',
        tradingName: '',
        phone: '',
        email: '',
        address: '',
        productServices: '',
        productPrice: '',
        reliabilityStars: '',
        notes: '',
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vendor');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Procurement · Vendors
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Supplier directory</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Sheet 7 vendor directory — business name, products/services, price, location, contact,
                reliability, and notes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
            >
              {showForm ? 'Cancel' : 'Add supplier'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Business name</label>
              <input
                className={INPUT}
                required
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Trading name</label>
              <input
                className={INPUT}
                value={form.tradingName}
                onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Product / services</label>
              <input
                className={INPUT}
                value={form.productServices}
                onChange={(e) => setForm({ ...form, productServices: e.target.value })}
                placeholder="e.g. Reinforcement bar, Cement"
              />
            </div>
            <div>
              <label className={LABEL}>Product price</label>
              <input
                className={INPUT}
                value={form.productPrice}
                onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
                placeholder="Free text, e.g. ABJ 16mm @ 2700"
              />
            </div>
            <div>
              <label className={LABEL}>Reliability (1–5 stars)</label>
              <select
                className={INPUT}
                value={form.reliabilityStars}
                onChange={(e) => setForm({ ...form, reliabilityStars: e.target.value })}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Location / address</label>
              <input
                className={INPUT}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Phone (contact)</label>
              <input
                className={INPUT}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Email (contact)</label>
              <input
                className={INPUT}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Notes</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#243a5e]"
              >
                Save supplier
              </button>
            </div>
          </form>
        )}

        <Link href="/procurement" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Procurement hub
        </Link>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Business name</th>
                <th className="px-4 py-3">Product / services</th>
                <th className="px-4 py-3">Product price</th>
                <th className="px-4 py-3">Location / address</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Reliability</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-[#1a2744]">
                    {r.legalName}
                    {r.tradingName ? (
                      <span className="block text-xs font-normal text-slate-500">{r.tradingName}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 max-w-[12rem]">{r.productServices ?? '—'}</td>
                  <td className="px-4 py-3">{r.productPrice ?? '—'}</td>
                  <td className="px-4 py-3 max-w-[12rem]">{r.address ?? '—'}</td>
                  <td className="px-4 py-3">{contactLabel(r)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{starsLabel(r.reliabilityStars)}</td>
                  <td className="px-4 py-3 max-w-[10rem] text-slate-600">{r.notes ?? '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No suppliers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
