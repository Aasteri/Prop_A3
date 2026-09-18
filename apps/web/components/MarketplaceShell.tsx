'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { clearToken, getToken, getUser, publicApi, type AuthUser } from '@/lib/api';

type Company = {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
};

type MarketplaceShellProps = {
  children: React.ReactNode;
  /** Called before guest register navigation (e.g. persist form draft). */
  onBeforeRegister?: () => void;
  /** Called before guest login navigation. */
  onBeforeLogin?: () => void;
  /** Extra refresh after sign-out (parent local auth state). */
  onAuthChange?: () => void;
};

export function MarketplaceShell({
  children,
  onBeforeRegister,
  onBeforeLogin,
  onAuthChange,
}: MarketplaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authed, setAuthed] = useState(false);

  const refreshAuth = useCallback(() => {
    setUser(getUser<AuthUser>());
    setAuthed(Boolean(getToken()));
  }, []);

  useEffect(() => {
    refreshAuth();
    publicApi<Company>('/public/company').then(setCompany).catch(console.error);
    const onFocus = () => refreshAuth();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshAuth]);

  function goRegister() {
    onBeforeRegister?.();
    router.push('/marketplace/register?next=/marketplace');
  }

  function goLogin() {
    onBeforeLogin?.();
    router.push('/login?next=/marketplace');
  }

  function onSignOut() {
    clearToken();
    refreshAuth();
    onAuthChange?.();
  }

  const phone = company?.phone ?? '+234 800 000 0000';
  const wa = company?.whatsapp?.replace(/\D/g, '') ?? '2348000000000';
  const onMarketplace = pathname === '/marketplace' || pathname.startsWith('/marketplace/');

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              Propa<span className="text-[#e87722]">3</span>
            </Link>
            <p className="mt-0.5 text-sm text-slate-300">
              Artisan marketplace · Find trades · Quotes · Escrow
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm sm:justify-end">
            <ShellNavLink href="/" active={pathname === '/'}>
              Home
            </ShellNavLink>
            <ShellNavLink href="/properties" active={pathname.startsWith('/properties')}>
              Properties
            </ShellNavLink>
            <ShellNavLink href="/marketplace" active={onMarketplace}>
              Artisans
            </ShellNavLink>

            {!authed || user?.role === 'ARTISAN' ? (
              <Link
                href="/marketplace/apply"
                className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
              >
                Join as artisan
              </Link>
            ) : null}

            {authed && user ? (
              <>
                <span className="hidden text-slate-300 lg:inline">
                  {user.firstName} {user.lastName}
                </span>
                {(user.role === 'MARKETPLACE_SEEKER' ||
                  user.role === 'CLIENT' ||
                  user.role === 'CEO' ||
                  user.role === 'ADMIN') && (
                  <Link
                    href="/marketplace"
                    className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
                  >
                    My requests
                  </Link>
                )}
                {user.role === 'CLIENT' && (
                  <Link
                    href="/portal"
                    className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
                  >
                    Client portal
                  </Link>
                )}
                {user.role === 'ARTISAN' && (
                  <Link
                    href="/artisan"
                    className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
                  >
                    Artisan jobs
                  </Link>
                )}
                {(user.role === 'CEO' ||
                  user.role === 'ADMIN' ||
                  user.role === 'FINANCE' ||
                  user.role === 'PROJECT_MANAGER') && (
                  <Link
                    href="/marketplace-admin"
                    className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={goRegister}
                  className="rounded-md bg-[#e87722] px-3 py-1.5 font-medium text-white hover:bg-[#d06818]"
                >
                  Sign up to request
                </button>
                <button
                  type="button"
                  onClick={goLogin}
                  className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
                >
                  Log in
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-[#1a2744]">
              {company?.name ?? 'Triple A Realty Projects Ltd.'}
            </p>
            <p>Abuja, Nigeria · CAC · SCUML · COREN</p>
            {company?.email && (
              <a href={`mailto:${company.email}`} className="mt-1 block hover:text-[#e87722]">
                {company.email}
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-[#e87722]">
              Home
            </Link>
            <Link href="/marketplace" className="hover:text-[#e87722]">
              Artisan marketplace
            </Link>
            <Link href="/privacy" className="hover:text-[#e87722]">
              Privacy policy
            </Link>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-[#e87722]">
              {phone}
            </a>
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#e87722]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ShellNavLink({
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
      className={
        active
          ? 'rounded-md px-2 py-1.5 font-medium text-[#e87722]'
          : 'rounded-md px-2 py-1.5 text-slate-200 hover:text-white'
      }
    >
      {children}
    </Link>
  );
}
