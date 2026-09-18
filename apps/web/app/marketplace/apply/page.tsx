'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, api } from '@/lib/api';
import { CARD, INPUT, LABEL } from '@/lib/ui';

export default function ArtisanApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    trades: '',
    serviceAreas: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    setLoading(true);
    try {
      const res = await api<{ message: string }>('/artisans/apply', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          trades: form.trades
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      setOk(res.message);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Application failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className={`mx-auto max-w-lg ${CARD} p-6`}>
        <Link href="/marketplace" className="text-sm text-[#e87722] hover:underline">
          ← Marketplace
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-[#1a2744]">Artisan application</h1>
        <p className="mt-1 text-sm text-slate-600">
          Open signup. Admin approves before you can take assigned jobs. Phone numbers stay private —
          never shown to clients in chat.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {(
            [
              ['fullName', 'Full name'],
              ['email', 'Email (login)'],
              ['password', 'Password'],
              ['phone', 'Phone (staff / payouts only)'],
              ['businessName', 'Business name (optional)'],
              ['trades', 'Trades (comma-separated)'],
              ['serviceAreas', 'Service areas'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={LABEL}>{label}</label>
              <input
                className={INPUT}
                type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                required={['fullName', 'email', 'password', 'phone'].includes(key)}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className={LABEL}>Bio (optional)</label>
            <textarea
              className={INPUT}
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {ok && <p className="text-sm text-emerald-700">{ok}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1a2744] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}
