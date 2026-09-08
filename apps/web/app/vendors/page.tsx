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
  cacNumber: string | null;
  status: string;
};

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
    cacNumber: '',
    address: '',
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
      await api('/procurement/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          legalName: form.legalName,
          tradingName: form.tradingName || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          cacNumber: form.cacNumber || undefined,
          address: form.address || undefined,
        }),
      });
      setShowForm(false);
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
                KYC-ready vendor records for goods and services procurement.
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
              <label className={LABEL}>Legal name</label>
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
            <div>
              <label className={LABEL}>Phone</label>
              <input
                className={INPUT}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <input
                className={INPUT}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>CAC number</label>
              <input
                className={INPUT}
                value={form.cacNumber}
                onChange={(e) => setForm({ ...form, cacNumber: e.target.value })}
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
                <th className="px-4 py-3">Legal name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">CAC</th>
                <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-3">{r.phone ?? '—'}</td>
                  <td className="px-4 py-3">{r.email ?? '—'}</td>
                  <td className="px-4 py-3">{r.cacNumber ?? '—'}</td>
                  <td className="px-4 py-3">{r.status}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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
