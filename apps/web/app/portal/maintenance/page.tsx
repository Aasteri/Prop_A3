'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PortalShell } from '@/components/PortalShell';
import { getToken } from '@/lib/api';
import { CARD, PAGE_HEADER } from '@/lib/ui';

export default function PortalMaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  return (
    <PortalShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Tenant portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Maintenance</h1>
          <p className="mt-2 text-sm text-slate-200/90">
            Report issues, track work orders, and confirm completion before payment release.
          </p>
        </header>
        <div className={`${CARD} space-y-3 p-6`}>
          <p className="text-sm text-slate-600">
            Staff can already log and triage maintenance against managed properties. Tenant
            self-service with photo upload and satisfaction rating is next on this screen.
          </p>
          <p className="text-sm text-slate-600">
            For urgent issues now, contact your facility manager directly — they will raise the
            request in the Maintenance module.
          </p>
          <Link
            href="/portal"
            className="inline-flex text-sm font-medium text-[#e87722] hover:underline"
          >
            ← Back to portal
          </Link>
        </div>
      </div>
    </PortalShell>
  );
}
