'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Missing reset token — use the link from your email');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <input
          type="password"
          required
          minLength={8}
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#e87722] py-2.5 font-medium text-white hover:bg-[#d06818] disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#1a2744] px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-bold text-[#1a2744]">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-600">Minimum 8 characters.</p>

        <Suspense fallback={<p className="mt-4 text-sm text-slate-500">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-[#e87722] hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
