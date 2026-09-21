'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AccountMenu } from '@/components/AccountMenu';
import { clearToken, fetchMe, getToken, getUser, publicApi, type AuthUser } from '@/lib/api';

type Company = {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
};

type MarketplaceShellProps = {
  children: React.ReactNode;
  onBeforeRegister?: () => void;
  onBeforeLogin?: () => void;
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
    const token = getToken();
    setAuthed(Boolean(token));
    if (!token) {
      setUser(null);
      return;
    }
    setUser(getUser<AuthUser>());
    fetchMe()
      .then((u) => setUser(u))
      .catch(() => {
        /* keep cached user */
      });
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

  const accountExtras: { href: string; label: string }[] = [];
  if (user && (user.role === 'CLIENT' || user.role === 'MARKETPLACE_SEEKER')) {
    accountExtras.push({ href: '/marketplace/requests', label: 'My requests' });
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              Propa<span className="text-[#e87722]">3</span>
            </Link>
            <p className="mt-0.5 hidden text-sm text-slate-300 sm:block">
              Artisan marketplace · Find trades · Quotes · Escrow
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
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
                className="rounded-md px-2 py-1.5 text-slate-200 hover:text-white sm:px-3"
              >
                Join as artisan
              </Link>
            ) : null}

            {authed && user ? (
              <AccountMenu user={user} onSignOut={onSignOut} extraLinks={accountExtras} />
            ) : (
              <div className="ml-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={goLogin}
                  className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={goRegister}
                  className="rounded-md bg-[#e87722] px-3 py-1.5 font-medium text-white hover:bg-[#d06818]"
                >
                  Sign up
                </button>
              </div>
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
