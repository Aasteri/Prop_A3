'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, logout, type AuthUser } from '@/lib/api';
import { NotificationBell } from '@/components/NotificationBell';
import { useEffect, useState } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUserState(getUser<AuthUser>());
  }, [pathname]);

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
              Propa<span className="text-[#e87722]">3</span>
            </Link>
            <p className="text-xs text-slate-300">Triple A Realty Projects Ltd.</p>
          </div>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <NotificationBell />
              <span className="hidden sm:inline text-slate-200">
                {user.firstName} {user.lastName} · {user.role.replace(/_/g, ' ')}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
        {user && (
          <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 text-sm">
            <NavLink href="/dashboard" active={pathname === '/dashboard'}>
              Dashboard
            </NavLink>
            <NavLink href="/site-tracker" active={pathname.startsWith('/site-tracker')}>
              Site Tracker
            </NavLink>
            <NavLink href="/change-log" active={pathname.startsWith('/change-log')}>
              Change Log
            </NavLink>
            <NavLink href="/material-requests" active={pathname.startsWith('/material-requests')}>
              Materials
            </NavLink>
            <NavLink href="/invoices" active={pathname.startsWith('/invoices')}>
              Invoices
            </NavLink>
            <NavLink href="/milestones" active={pathname.startsWith('/milestones')}>
              Milestones
            </NavLink>
            <NavLink href="/tenant-applications" active={pathname.startsWith('/tenant-applications')}>
              Tenants
            </NavLink>
            <NavLink href="/estate-terrier" active={pathname.startsWith('/estate-terrier')}>
              Terrier
            </NavLink>
            <NavLink href="/listings" active={pathname.startsWith('/listings')}>
              Listings
            </NavLink>
            <NavLink href="/crm" active={pathname.startsWith('/crm')}>
              CRM
            </NavLink>
            <NavLink href="/documents" active={pathname.startsWith('/documents')}>
              Documents
            </NavLink>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 ${
        active ? 'bg-[#e87722] text-white' : 'text-slate-300 hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  );
}
