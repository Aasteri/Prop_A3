'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';

type Company = {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
};

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    publicApi<Company>('/public/company').then(setCompany).catch(console.error);
  }, []);

  const phone = company?.phone ?? '+234 800 000 0000';
  const wa = company?.whatsapp?.replace(/\D/g, '') ?? '2348000000000';

  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-slate-200 bg-[#1a2744] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-semibold">
            Propa<span className="text-[#e87722]">3</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm sm:gap-4">
            <NavLink href="/" active={pathname === '/'}>
              Home
            </NavLink>
            <NavLink href="/properties" active={pathname.startsWith('/properties')}>
              Properties
            </NavLink>
            <NavLink href="/projects" active={pathname.startsWith('/projects')}>
              Projects
            </NavLink>
            <NavLink href="/estates" active={pathname.startsWith('/estates')}>
              Site map
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
      <main className="text-slate-900">{children}</main>
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
      className={active ? 'font-medium text-[#e87722]' : 'text-slate-200 hover:text-white'}
    >
      {children}
    </Link>
  );
}
