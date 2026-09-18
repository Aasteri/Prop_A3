'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, api, login } from '@/lib/api';
import { CARD, INPUT, LABEL } from '@/lib/ui';

export default function SeekerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/marketplace/seekers/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await login(form.email, form.password);
      router.push('/marketplace');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
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
        <h1 className="mt-3 text-xl font-semibold text-[#1a2744]">Create seeker account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Public signup to request artisans. After Admin assigns workers and you pick a quote, you chat
          and pay the workmanship fee into escrow.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {(
            [
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['email', 'Email'],
              ['password', 'Password'],
              ['phone', 'Phone (optional)'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={LABEL}>{label}</label>
              <input
                className={INPUT}
                type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                required={key !== 'phone'}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#e87722] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
