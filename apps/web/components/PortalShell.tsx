'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, getUser, type AuthUser } from '@/lib/api';
import { useEffect, useState } from 'react';

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser<AuthUser>());
  }, [pathname]);

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <Link href="/portal" className="text-lg font-semibold">
              Propa<span className="text-[#e87722]">3</span> Client Portal
            </Link>
            <p className="text-xs text-slate-300">Triple A Realty Projects Ltd.</p>
          </div>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden sm:inline">
                {user.firstName} {user.lastName}
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
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 text-sm">
          <NavLink href="/portal" active={pathname === '/portal'}>
            Dashboard
          </NavLink>
          <NavLink href="/portal/payments" active={pathname.startsWith('/portal/payments')}>
            Payments
          </NavLink>
          <NavLink href="/portal/changes" active={pathname.startsWith('/portal/changes')}>
            Changes
          </NavLink>
        </nav>
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
