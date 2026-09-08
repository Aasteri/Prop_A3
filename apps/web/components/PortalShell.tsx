'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NavIcon } from '@/components/NavIcon';
import { Sidebar } from '@/components/Sidebar';
import { getUser, logout, type AuthUser } from '@/lib/api';
import { PORTAL_NAV } from '@/lib/navigation';

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(getUser<AuthUser>());
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-full bg-slate-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={PORTAL_NAV}
        brand={{
          title: 'Client portal',
          subtitle: 'Triple A Realty',
          href: '/portal',
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
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <NavIcon name="menu" className="h-5 w-5" />
          </button>

          {user && (
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">Client</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a2744] text-sm font-semibold text-white">
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
