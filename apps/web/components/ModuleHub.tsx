'use client';

import Link from 'next/link';
import { NavIcon } from '@/components/NavIcon';
import { CARD, PAGE_HEADER, SECTION_TITLE } from '@/lib/ui';

export type HubLink = {
  href: string;
  title: string;
  description: string;
  icon: string;
  status?: 'live' | 'building';
};

export function ModuleHub({
  eyebrow,
  title,
  subtitle,
  links,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  links: HubLink[];
}) {
  return (
    <div className="space-y-8">
      <header className={PAGE_HEADER}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200/90 sm:text-base">{subtitle}</p>
      </header>

      <section>
        <h2 className={SECTION_TITLE}>Modules</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${CARD} flex gap-4 p-5 transition hover:border-[#e87722]/50 hover:shadow-md`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1a2744] text-white">
                <NavIcon name={link.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-[#1a2744]">{link.title}</span>
                  {link.status === 'building' && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Building
                    </span>
                  )}
                  {link.status === 'live' && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Live
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-slate-600">{link.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
