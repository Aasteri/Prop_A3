'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { api, getToken } from '@/lib/api';

type Change = {
  id: string;
  changeId: string;
  description: string;
  justification: string;
  impactLevel: string;
  approvedAt: string | null;
  project: { name: string };
};

export default function PortalChangesPage() {
  const router = useRouter();
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Change[]>('/client-portal/changes').then(setChanges).catch(() => router.replace('/login'));
  }, [router]);

  return (
    <PortalShell>
      <h1 className="text-2xl font-semibold text-[#1a2744]">Approved change orders</h1>
      <p className="text-slate-600">Open-book visibility — Agile contract variations</p>

      <div className="mt-6 space-y-4">
        {changes.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-semibold text-[#1a2744]">{c.changeId}</p>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{c.impactLevel} impact</span>
            </div>
            <p className="text-sm text-slate-500">{c.project.name}</p>
            <p className="mt-2 text-sm">{c.description}</p>
            <p className="mt-2 text-sm text-slate-600">
              <strong>Justification:</strong> {c.justification}
            </p>
            {c.approvedAt && (
              <p className="mt-2 text-xs text-slate-400">
                Approved {new Date(c.approvedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
        {!changes.length && (
          <p className="text-sm text-slate-500">No approved change orders for your projects.</p>
        )}
      </div>

      <Link href="/portal" className="mt-6 inline-block text-sm text-[#e87722] hover:underline">
        ← Back to dashboard
      </Link>
    </PortalShell>
  );
}
