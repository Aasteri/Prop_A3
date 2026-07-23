'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, login, getUser, type AuthUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('foreman.gz2@triplea.ng');
  const [password, setPassword] = useState('Propa3Dev!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = (data.user as AuthUser).role;
      router.push(role === 'CLIENT' ? '/portal' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#1a2744] px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#1a2744]">
            Propa<span className="text-[#e87722]">3</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Staff portal & client login</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]"
            />
          </div>
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#e87722] py-2.5 font-medium text-white hover:bg-[#d06818] disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

          <p className="mt-1 text-center text-xs text-slate-400">
            Staff: foreman / PM accounts · Client: client@triplea.ng
          </p>
          <p className="mt-2 text-center text-xs">
            <a href="/" className="text-[#e87722] hover:underline">
              ← Back to propa3.com
            </a>
          </p>
      </div>
    </div>
  );
}
