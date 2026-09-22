'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { PROCUREMENT_STAGES } from '@/lib/process-stages';
import { CARD, PAGE_HEADER } from '@/lib/ui';

type Counts = {
  openPrs: number;
  openPos: number;
  openIvcs: number;
  materialPending: number;
};

export default function ProcurementHubPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({
    openPrs: 0,
    openPos: 0,
    openIvcs: 0,
    materialPending: 0,
  });

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    Promise.all([
      api<{ status: string }[]>('/procurement/requisitions').catch(() => []),
      api<{ status: string }[]>('/procurement/orders').catch(() => []),
      api<{ status: string }[]>('/ivcs').catch(() => []),
      api<{ status: string }[]>('/material-requests').catch(() => []),
    ]).then(([prs, pos, ivcs, mrs]) => {
      setCounts({
        openPrs: prs.filter((r) => !['CANCELLED', 'CLOSED', 'CONVERTED'].includes(r.status)).length,
        openPos: pos.filter((r) => !['CLOSED', 'CANCELLED', 'RECEIVED'].includes(r.status)).length,
        openIvcs: ivcs.filter((r) => !['APPROVED', 'REJECTED', 'PAID'].includes(r.status)).length,
        materialPending: mrs.filter((r) =>
          ['PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_ISSUED'].includes(r.status),
        ).length,
      });
    });
  }, [router]);

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Pillar · Procurement
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Procurement process groups
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
            Plan → Request → Source → Fulfil → Close & Pay. Open a stage for modules in order.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Open PRs', value: counts.openPrs, href: '/procurement/goods?focus=pr' },
            { label: 'Open POs', value: counts.openPos, href: '/procurement/goods?focus=po' },
            {
              label: 'Material to issue',
              value: counts.materialPending,
              href: '/material-requests?status=APPROVED',
            },
            { label: 'Open IVCs', value: counts.openIvcs, href: '/ivcs' },
          ].map((s) => (
            <Link key={s.label} href={s.href} className={`${CARD} p-4 hover:border-[#e87722]`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#1a2744]">{s.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROCUREMENT_STAGES.map((s, i) => (
            <Link key={s.href} href={s.href} className={`${CARD} p-5 hover:border-[#e87722]`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#e87722]">
                {i + 1}. {s.label}
              </p>
              <p className="mt-2 text-sm text-slate-600">{s.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
