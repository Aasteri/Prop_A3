'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NotificationBell } from '@/components/NotificationBell';
import { NavIcon } from '@/components/NavIcon';
import { Sidebar } from '@/components/Sidebar';
import { getUser, logout, type AuthUser } from '@/lib/api';
import { STAFF_NAV, filterNavByRole } from '@/lib/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUserState(getUser<AuthUser>());
    setSidebarOpen(false);
  }, [pathname]);

  const navGroups = user ? filterNavByRole(STAFF_NAV, user.role) : [];

  return (
    <div className="flex min-h-full bg-slate-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        groups={navGroups}
        brand={{
          title: 'Propa3',
          subtitle: 'Triple A Realty',
          href: '/dashboard',
        }}
        footer={
          user ? (
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <NavIcon name="logout" className="h-5 w-5" />
              Sign out
            </button>
          ) : undefined
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <NavIcon name="menu" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1a2744] lg:hidden">
                Propa<span className="text-[#e87722]">3</span>
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              <NotificationBell />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {user.role.replace(/_/g, ' ')}
                  {user.primarySite ? ` · ${user.primarySite.code}` : ''}
                </p>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a2744] text-sm font-semibold text-white"
                title={`${user.firstName} ${user.lastName}`}
              >
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 text-slate-900 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
