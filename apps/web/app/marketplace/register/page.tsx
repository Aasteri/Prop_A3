'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MarketplaceShell } from '@/components/MarketplaceShell';
import { ApiError, login, publicApi } from '@/lib/api';
import { hasPendingMarketplaceDraft } from '@/lib/marketplace-draft';
import { CARD, INPUT, LABEL } from '@/lib/ui';

function SeekerRegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/marketplace';
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    setHasDraft(hasPendingMarketplaceDraft());
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await publicApi('/marketplace/seekers/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await login(form.email, form.password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketplaceShell>
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className={`${CARD} p-6`}>
          <Link href="/marketplace" className="text-sm text-[#e87722] hover:underline">
            ← Marketplace
          </Link>
          <h1 className="mt-3 text-xl font-semibold text-[#1a2744]">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">
            {hasDraft
              ? 'Your job request is saved. Create an account and we’ll take you back to submit it.'
              : 'One Propa3 login. Request artisans here; if you later buy a Triple A property, the same account becomes your client portal — no second signup.'}
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
              {loading ? 'Creating…' : hasDraft ? 'Create account & continue' : 'Create account'}
            </button>
            <p className="text-center text-xs text-slate-500">
              Already have an account (property client or seeker)?{' '}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="text-[#e87722] underline"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </MarketplaceShell>
  );
}

export default function SeekerRegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading…</div>}>
      <SeekerRegisterForm />
    </Suspense>
  );
}
