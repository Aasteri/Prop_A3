'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ApiError, forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#1a2744] px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-slate-900 shadow-xl">
        <h1 className="text-xl font-bold text-[#1a2744]">Reset password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your @propa3.com email. We&apos;ll send a link valid for 1 hour.
        </p>

        {sent ? (
          <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            If that email is registered, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <input
              type="email"
              required
              placeholder="you@propa3.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#e87722] py-2.5 font-medium text-white hover:bg-[#d06818] disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-[#e87722] hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
