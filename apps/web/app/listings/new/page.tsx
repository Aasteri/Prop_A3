'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken } from '@/lib/api';
import { useEffect } from 'react';

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export default function NewListingPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    location: '',
    propertyType: '',
    finish: 'FF',
    paymentPlan: 'TBD',
    status: 'AVAILABLE',
    priceNgn: '',
    priceOutrightNgn: '',
    price6mNgn: '',
    price12mNgn: '',
    price18mNgn: '',
    notes: '',
  });

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const listing = await api<{ id: string }>('/listings', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          priceNgn: form.priceNgn ? parseFloat(form.priceNgn) : undefined,
          priceOutrightNgn: form.priceOutrightNgn ? parseFloat(form.priceOutrightNgn) : undefined,
          price6mNgn: form.price6mNgn ? parseFloat(form.price6mNgn) : undefined,
          price12mNgn: form.price12mNgn ? parseFloat(form.price12mNgn) : undefined,
          price18mNgn: form.price18mNgn ? parseFloat(form.price18mNgn) : undefined,
        }),
      });
      router.push(`/listings/${listing.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-[#1a2744]">Add listing</h1>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-xl border bg-white p-6">
        <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} required />
        <Field label="Property type" value={form.propertyType} onChange={(v) => setForm({ ...form, propertyType: v })} required />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Finish</span>
          <select value={form.finish} onChange={(e) => setForm({ ...form, finish: e.target.value })} className={INPUT}>
            <option value="FF">FF — Fully Finished</option>
            <option value="SF">SF — Shell Finish</option>
            <option value="DPC">DPC</option>
          </select>
        </label>
        <Field label="Payment plan" value={form.paymentPlan} onChange={(v) => setForm({ ...form, paymentPlan: v })} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={INPUT}>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Single price (₦)" value={form.priceNgn} onChange={(v) => setForm({ ...form, priceNgn: v })} type="number" />
          <Field label="Outright (₦)" value={form.priceOutrightNgn} onChange={(v) => setForm({ ...form, priceOutrightNgn: v })} type="number" />
          <Field label="6 months (₦)" value={form.price6mNgn} onChange={(v) => setForm({ ...form, price6mNgn: v })} type="number" />
          <Field label="12 months (₦)" value={form.price12mNgn} onChange={(v) => setForm({ ...form, price12mNgn: v })} type="number" />
          <Field label="18 months (₦)" value={form.price18mNgn} onChange={(v) => setForm({ ...form, price18mNgn: v })} type="number" />
        </div>
        <button type="submit" disabled={loading} className="rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white hover:bg-[#253660] disabled:opacity-50">
          {loading ? 'Saving…' : 'Create listing'}
        </button>
      </form>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} required={required} />
    </label>
  );
}
