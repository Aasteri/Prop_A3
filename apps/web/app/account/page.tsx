'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { homeForRole, roleLabel } from '@/components/AccountMenu';
import { MarketplaceShell } from '@/components/MarketplaceShell';
import {
  ApiError,
  changePassword,
  clearToken,
  fetchMe,
  getToken,
  updateProfile,
  type AuthUser,
} from '@/lib/api';
import { CARD, INPUT, LABEL } from '@/lib/ui';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/account');
      return;
    }
    fetchMe()
      .then((u) => {
        setUser(u);
        setProfile({
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone ?? '',
        });
      })
      .catch(() => {
        clearToken();
        router.replace('/login?next=/account');
      });
  }, [router]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    setSaving(true);
    try {
      const u = await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });
      setUser(u);
      setProfileMsg('Profile saved');
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPassErr('');
    setPassMsg('');
    if (passwords.newPassword !== passwords.confirm) {
      setPassErr('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPassErr('New password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await changePassword(passwords.currentPassword, passwords.newPassword);
      setPassMsg(res.message);
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPassErr(err instanceof ApiError ? err.message : 'Could not update password');
    } finally {
      setSaving(false);
    }
  }

  const home = user ? homeForRole(user.role) : null;

  return (
    <MarketplaceShell onAuthChange={() => setUser(null)}>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">Profile & account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your details. One login works across marketplace, portal, and staff tools.
          </p>
        </div>

        {!user ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <section className={`${CARD} p-5`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Signed in as</p>
              <p className="mt-1 font-medium text-[#1a2744]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-xs text-slate-500">{roleLabel(user.role)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {home && (
                  <Link
                    href={home.href}
                    className="rounded-lg bg-[#1a2744] px-3 py-2 text-sm font-medium text-white hover:bg-[#243a5e]"
                  >
                    {home.label}
                  </Link>
                )}
                <Link
                  href="/marketplace"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Marketplace
                </Link>
                {user.role === 'CLIENT' && (
                  <Link
                    href="/portal"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Client portal
                  </Link>
                )}
                {!['CLIENT', 'MARKETPLACE_SEEKER', 'ARTISAN'].includes(user.role) && (
                  <Link
                    href="/dashboard"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Staff dashboard
                  </Link>
                )}
              </div>
            </section>

            <form onSubmit={saveProfile} className={`${CARD} space-y-3 p-5`}>
              <h2 className="text-lg font-semibold text-[#1a2744]">Profile</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>First name</label>
                  <input
                    className={INPUT}
                    required
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className={LABEL}>Last name</label>
                  <input
                    className={INPUT}
                    required
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input className={INPUT} value={user.email} disabled />
                <p className="mt-1 text-xs text-slate-500">Email cannot be changed here.</p>
              </div>
              <div>
                <label className={LABEL}>Phone</label>
                <input
                  className={INPUT}
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              {profileErr && <p className="text-sm text-red-600">{profileErr}</p>}
              {profileMsg && <p className="text-sm text-emerald-700">{profileMsg}</p>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save profile
              </button>
            </form>

            <form onSubmit={savePassword} className={`${CARD} space-y-3 p-5`}>
              <h2 className="text-lg font-semibold text-[#1a2744]">Change password</h2>
              <div>
                <label className={LABEL}>Current password</label>
                <input
                  type="password"
                  className={INPUT}
                  required
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={LABEL}>New password</label>
                <input
                  type="password"
                  className={INPUT}
                  required
                  minLength={8}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Confirm new password</label>
                <input
                  type="password"
                  className={INPUT}
                  required
                  minLength={8}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </div>
              {passErr && <p className="text-sm text-red-600">{passErr}</p>}
              {passMsg && <p className="text-sm text-emerald-700">{passMsg}</p>}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </MarketplaceShell>
  );
}
