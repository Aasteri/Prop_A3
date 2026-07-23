'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { api, getToken } from '@/lib/api';

type Dashboard = {
  client: { firstName: string; lastName: string; clientRef: string };
  projects: {
    id: string;
    name: string;
    location: string | null;
    plotRef: string | null;
    projectManager: { firstName: string; lastName: string; email: string; phone: string | null } | null;
    milestones: { stage: string; progressPct: number }[];
  }[];
  nextPayment: {
    invoiceId: string;
    invoiceNumber: string;
    outstanding: number;
    dueDate: string;
  } | null;
  invoiceSummary: { total: number; outstanding: number };
};

export default function PortalDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Dashboard>('/client-portal/dashboard')
      .then(setData)
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!data) {
    return (
      <PortalShell>
        <p className="text-slate-500">Loading…</p>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <h1 className="text-2xl font-semibold text-[#1a2744]">
        Welcome, {data.client.firstName}
      </h1>
      <p className="text-slate-600">Client ref: {data.client.clientRef}</p>

      {data.nextPayment && (
        <div className="mt-6 rounded-xl border border-[#e87722]/30 bg-orange-50 p-4">
          <p className="font-medium text-[#1a2744]">Next payment due</p>
          <p className="text-2xl font-bold text-[#e87722]">
            ₦{data.nextPayment.outstanding.toLocaleString()}
          </p>
          <p className="text-sm text-slate-600">
            Invoice {data.nextPayment.invoiceNumber} ·{' '}
            {new Date(data.nextPayment.dueDate).toLocaleDateString()}
          </p>
          <Link href="/portal/payments" className="mt-2 inline-block text-sm text-[#e87722] hover:underline">
            View payments →
          </Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-[#1a2744]">Your properties</h2>
        <div className="space-y-4">
          {data.projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[#1a2744]">{p.name}</h3>
                  <p className="text-sm text-slate-600">
                    {p.location}
                    {p.plotRef ? ` · Plot ${p.plotRef}` : ''}
                  </p>
                  {p.projectManager && (
                    <p className="mt-2 text-sm text-slate-500">
                      PM: {p.projectManager.firstName} {p.projectManager.lastName} ·{' '}
                      {p.projectManager.email}
                    </p>
                  )}
                </div>
                <Link
                  href={`/portal/progress/${p.id}`}
                  className="rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white hover:bg-[#253660]"
                >
                  View progress
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.milestones.map((m) => (
                  <div key={m.stage} className="min-w-[120px] flex-1 rounded-lg bg-slate-50 p-2">
                    <p className="text-xs text-slate-500">
                      {m.stage.charAt(0) + m.stage.slice(1).toLowerCase()}
                    </p>
                    <p className="font-semibold text-[#e87722]">{m.progressPct.toFixed(0)}%</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full bg-[#e87722]" style={{ width: `${m.progressPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
