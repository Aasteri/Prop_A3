'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { api, getToken } from '@/lib/api';
import { PAGE_HEADER, SECTION_TITLE, STAT_CARD } from '@/lib/ui';

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

  const avgProgress =
    data.projects.length > 0
      ? data.projects.reduce((sum, p) => {
          const avg =
            p.milestones.length > 0
              ? p.milestones.reduce((s, m) => s + m.progressPct, 0) / p.milestones.length
              : 0;
          return sum + avg;
        }, 0) / data.projects.length
      : 0;

  return (
    <PortalShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-sm text-slate-300">Client ref: {data.client.clientRef}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Welcome, {data.client.firstName}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Track your property progress, payments, and project documents.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className={STAT_CARD}>
            <div className="mb-3 h-1 w-10 rounded-full bg-[#e87722]" />
            <p className="text-2xl font-bold text-[#1a2744]">
              ₦{data.invoiceSummary.outstanding.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-slate-600">Outstanding balance</p>
          </div>
          <div className={STAT_CARD}>
            <div className="mb-3 h-1 w-10 rounded-full bg-[#1a2744]" />
            <p className="text-2xl font-bold text-[#1a2744]">
              ₦{data.invoiceSummary.total.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-slate-600">Total invoiced</p>
          </div>
          <div className={STAT_CARD}>
            <div className="mb-3 h-1 w-10 rounded-full bg-emerald-500" />
            <p className="text-2xl font-bold text-[#1a2744]">{avgProgress.toFixed(0)}%</p>
            <p className="mt-1 text-sm text-slate-600">Average build progress</p>
          </div>
        </section>

        {data.nextPayment && (
          <section className="rounded-xl border border-[#e87722]/30 bg-gradient-to-r from-orange-50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#e87722]">Next payment due</p>
                <p className="mt-1 text-3xl font-bold text-[#1a2744]">
                  ₦{data.nextPayment.outstanding.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Invoice {data.nextPayment.invoiceNumber} ·{' '}
                  {new Date(data.nextPayment.dueDate).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Link
                href="/portal/payments"
                className="rounded-lg bg-[#e87722] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d06818]"
              >
                Pay now →
              </Link>
            </div>
          </section>
        )}

        <section>
          <h2 className={`${SECTION_TITLE} mb-4`}>Your properties</h2>
          <div className="space-y-4">
            {data.projects.map((p) => {
              const avg =
                p.milestones.length > 0
                  ? p.milestones.reduce((s, m) => s + m.progressPct, 0) / p.milestones.length
                  : 0;
              return (
                <article
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1a2744]">{p.name}</h3>
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
                      className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#253660]"
                    >
                      View progress
                    </Link>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">Overall progress</span>
                      <span className="font-semibold text-[#1a2744]">{avg.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#e87722]"
                        style={{ width: `${Math.min(100, avg)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {p.milestones.map((m) => (
                      <div key={m.stage} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {m.stage.charAt(0) + m.stage.slice(1).toLowerCase()}
                        </p>
                        <p className="mt-1 text-lg font-bold text-[#1a2744]">
                          {m.progressPct.toFixed(0)}%
                        </p>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-[#e87722]"
                            style={{ width: `${m.progressPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
