'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { AuthUser } from '@/lib/api';

export function homeForRole(role: string): { href: string; label: string } {
  if (role === 'CLIENT') return { href: '/portal', label: 'Client portal' };
  if (role === 'ARTISAN') return { href: '/artisan', label: 'Artisan jobs' };
  if (role === 'MARKETPLACE_SEEKER') return { href: '/marketplace', label: 'My requests' };
  return { href: '/dashboard', label: 'Dashboard' };
}

export function roleLabel(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

type AccountMenuProps = {
  user: AuthUser;
  onSignOut: () => void;
  /** Extra links shown above Sign out (e.g. marketplace-specific). */
  extraLinks?: { href: string; label: string }[];
};

export function AccountMenu({ user, onSignOut, extraLinks = [] }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const home = homeForRole(user.role);
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const links = [
    { href: '/account', label: 'Profile & account' },
    { href: home.href, label: home.label },
    ...extraLinks.filter((l) => l.href !== home.href && l.href !== '/account'),
  ];

  // Dedupe by href
  const seen = new Set<string>();
  const uniqueLinks = links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-2.5 hover:bg-white/20"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e87722] text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[9rem] truncate text-left text-sm sm:block">
          {user.firstName}
        </span>
        <span className="text-xs text-slate-300" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="truncate text-sm font-semibold text-[#1a2744]">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {roleLabel(user.role)}
            </p>
          </div>
          <ul className="py-1 text-sm">
            {uniqueLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  role="menuitem"
                  className="block px-3 py-2 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {(user.role === 'CLIENT' || user.role === 'ARTISAN') && home.href !== '/marketplace' && (
              <li>
                <Link
                  href="/marketplace"
                  role="menuitem"
                  className="block px-3 py-2 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Artisan marketplace
                </Link>
              </li>
            )}
            {['CEO', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER'].includes(user.role) && (
              <li>
                <Link
                  href="/marketplace-admin"
                  role="menuitem"
                  className="block px-3 py-2 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Marketplace admin
                </Link>
              </li>
            )}
          </ul>
          <div className="border-t border-slate-100 p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
