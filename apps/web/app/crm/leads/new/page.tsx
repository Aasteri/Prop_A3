'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken } from '@/lib/api';

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

type Listing = { id: string; listingRef: string; location: string; propertyType: string };

export default function NewLeadPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: 'MANUAL',
    listingId: '',
    preferences: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Listing[]>('/listings').then(setListings);
    const listingId = new URLSearchParams(window.location.search).get('listingId');
    if (listingId) setForm((f) => ({ ...f, listingId }));
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const lead = await api<{ id: string }>('/crm/leads', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          listingId: form.listingId || undefined,
          email: form.email || undefined,
        }),
      });
      router.push(`/crm/leads/${lead.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-[#1a2744]">New CRM lead</h1>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
          <Field label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
        </div>
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Source</span>
          <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={INPUT}>
            <option value="MANUAL">Manual</option>
            <option value="WEB">Web</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="PHONE">Phone</option>
            <option value="REFERRAL">Referral</option>
            <option value="WALK_IN">Walk-in</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Listing interest</span>
          <select value={form.listingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })} className={INPUT}>
            <option value="">— None —</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.listingRef} — {l.location} ({l.propertyType})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Preferences / notes</span>
          <textarea value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })} rows={3} className={INPUT} />
        </label>
        <button type="submit" disabled={loading} className="rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white disabled:opacity-50">
          {loading ? 'Creating…' : 'Create lead'}
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
