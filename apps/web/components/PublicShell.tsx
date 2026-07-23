'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-slate-200 bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-semibold">
            Propa<span className="text-[#e87722]">3</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink href="/" active={pathname === '/'}>
              Home
            </NavLink>
            <NavLink href="/properties" active={pathname.startsWith('/properties')}>
              Properties
            </NavLink>
            <NavLink href="/projects" active={pathname.startsWith('/projects')}>
              Projects
            </NavLink>
            <Link
              href="/login"
              className="rounded-md bg-[#e87722] px-3 py-1.5 font-medium hover:bg-[#d06818]"
            >
              Client login
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-12 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-[#1a2744]">Triple A Realty Projects Ltd.</p>
            <p>Abuja, Nigeria · CAC · SCUML · COREN</p>
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#e87722]">
              Privacy policy
            </Link>
            <a href="tel:+2348000000000" className="hover:text-[#e87722]">
              +234 800 000 0000
            </a>
            <a
              href="https://wa.me/2348000000000"
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
      className={active ? 'text-[#e87722] font-medium' : 'text-slate-200 hover:text-white'}
    >
      {children}
    </Link>
  );
}
