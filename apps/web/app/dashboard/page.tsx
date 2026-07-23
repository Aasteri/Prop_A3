'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { api, getToken, type AuthUser } from '@/lib/api';

type Project = {
  id: string;
  name: string;
  location: string | null;
  site: { code: string; name: string };
  milestones: { stage: string; progressPct: string }[];
};

type PmSummary = {
  pendingLogCount: number;
  pendingLogs: {
    id: string;
    refCode: string;
    projectName: string;
    site: { code: string; name: string };
    submittedBy: { firstName: string; lastName: string } | null;
  }[];
  pendingMaterialCount: number;
  pendingMaterials: { id: string; requestRef: string; site: { code: string } }[];
  openHseCount: number;
  todaysIssues: {
    id: string;
    refCode: string;
    projectName: string;
    site: { code: string };
    issueMaterialShortage: boolean;
    issueEquipmentBreakdown: boolean;
    issueWeatherDelay: boolean;
    safetyIncidentsNearMisses: boolean;
  }[];
  unreadNotifications: number;
  activeProjects: number;
};

type CeoSummary = {
  siteHealth: {
    siteCode: string;
    siteName: string;
    activeProjects: number;
    logsToday: number;
    logSubmissionRate: number;
    missingLogsToday: number;
    openHseCount: number;
    pendingLogApprovals: number;
  }[];
  revenue: {
    invoiceCount: number;
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
  };
  leads: {
    active: number;
    won: number;
    lost: number;
    conversionRate: number;
  };
  highImpactChanges: {
    id: string;
    changeId: string;
    status: string;
    description: string;
    project: { name: string };
    site: { code: string };
  }[];
  corenLicences: {
    engineer: { firstName: string; lastName: string; email: string };
    licenceNumber: string;
    expiresAt: string;
    daysRemaining: number;
    status: 'OK' | 'EXPIRING' | 'EXPIRED';
  }[];
  fcdaMissing: { id: string; name: string; siteCode: string; siteName: string }[];
  rental: {
    unitCount: number;
    totalRent: number;
    totalExpenses: number;
    netIncome: number;
  };
  compliance: {
    openHseCount: number;
    pendingLogApprovals: number;
    fcdaMissingCount: number;
    highImpactChangeCount: number;
    expiringCorenCount: number;
  };
};

function formatNaira(v: number) {
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<PmSummary | null>(null);
  const [ceoSummary, setCeoSummary] = useState<CeoSummary | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<AuthUser>('/auth/me')
      .then((u) => {
        setUser(u);
        if (u.role === 'CEO' || u.role === 'ADMIN') {
          api<CeoSummary>('/dashboard/ceo').then(setCeoSummary).catch(console.error);
        }
      })
      .catch(() => router.replace('/login'));
    api<Project[]>('/projects').then(setProjects).catch(console.error);
    api<PmSummary>('/dashboard/pm').then(setSummary).catch(console.error);
  }, [router]);

  const isExecutive = user?.role === 'CEO' || user?.role === 'ADMIN';

  return (
    <AppShell>
      {!user ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#1a2744]">
              Welcome, {user.firstName}
            </h1>
            <p className="text-slate-600">
              {isExecutive
                ? 'Executive overview — all sites'
                : user.primarySite
                  ? `Primary site: ${user.primarySite.name}`
                  : 'All sites access'}
            </p>
          </div>

          {ceoSummary && isExecutive && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Outstanding receivables"
                  value={ceoSummary.revenue.totalOutstanding}
                  href="/invoices"
                  format="naira"
                />
                <StatCard
                  label="Revenue collected"
                  value={ceoSummary.revenue.totalCollected}
                  href="/invoices"
                  format="naira"
                />
                <StatCard label="Active leads" value={ceoSummary.leads.active} href="/crm" />
                <StatCard
                  label="Lead conversion"
                  value={ceoSummary.leads.conversionRate}
                  href="/crm"
                  suffix="%"
                />
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-4 text-lg font-semibold text-[#1a2744]">Site health (today)</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="pb-2 pr-4">Site</th>
                        <th className="pb-2 pr-4">Projects</th>
                        <th className="pb-2 pr-4">Log rate</th>
                        <th className="pb-2 pr-4">Missing logs</th>
                        <th className="pb-2 pr-4">Pending approvals</th>
                        <th className="pb-2">Open HSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ceoSummary.siteHealth.map((s) => (
                        <tr key={s.siteCode} className="border-t border-slate-100">
                          <td className="py-2 pr-4">
                            <span className="font-medium text-[#1a2744]">{s.siteCode}</span>
                            <span className="block text-xs text-slate-500">{s.siteName}</span>
                          </td>
                          <td className="py-2 pr-4">{s.activeProjects}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={
                                s.logSubmissionRate >= 100
                                  ? 'text-green-700'
                                  : s.logSubmissionRate >= 50
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                              }
                            >
                              {s.logSubmissionRate}%
                            </span>
                          </td>
                          <td className="py-2 pr-4">{s.missingLogsToday}</td>
                          <td className="py-2 pr-4">{s.pendingLogApprovals}</td>
                          <td className="py-2">{s.openHseCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">Compliance</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span>Open HSE incidents</span>
                      <Link href="/site-tracker" className="font-medium text-[#e87722]">
                        {ceoSummary.compliance.openHseCount}
                      </Link>
                    </li>
                    <li className="flex justify-between">
                      <span>Logs pending approval</span>
                      <Link href="/site-tracker" className="font-medium text-[#e87722]">
                        {ceoSummary.compliance.pendingLogApprovals}
                      </Link>
                    </li>
                    <li className="flex justify-between">
                      <span>FCDA permits missing</span>
                      <Link href="/milestones" className="font-medium text-[#e87722]">
                        {ceoSummary.compliance.fcdaMissingCount}
                      </Link>
                    </li>
                    <li className="flex justify-between">
                      <span>High-impact changes open</span>
                      <Link href="/change-log" className="font-medium text-[#e87722]">
                        {ceoSummary.compliance.highImpactChangeCount}
                      </Link>
                    </li>
                    <li className="flex justify-between">
                      <span>COREN licences expiring (30d)</span>
                      <span className="font-medium text-amber-700">
                        {ceoSummary.compliance.expiringCorenCount}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Audit trail</span>
                      <Link href="/audit-log" className="font-medium text-[#e87722]">
                        View log →
                      </Link>
                    </li>
                  </ul>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">
                    Estate Terrier — rental net income
                  </h2>
                  <p className="text-2xl font-semibold text-[#1a2744]">
                    {formatNaira(ceoSummary.rental.netIncome)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {ceoSummary.rental.unitCount} units · rent {formatNaira(ceoSummary.rental.totalRent)} ·
                    expenses {formatNaira(ceoSummary.rental.totalExpenses)}
                  </p>
                  <Link href="/estate-terrier" className="mt-3 inline-block text-sm text-[#e87722] hover:underline">
                    View terrier register →
                  </Link>
                </section>
              </div>

              {ceoSummary.fcdaMissing.length > 0 && (
                <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">FCDA permits missing</h2>
                  <ul className="space-y-2 text-sm">
                    {ceoSummary.fcdaMissing.map((p) => (
                      <li key={p.id}>
                        <Link href={`/milestones/${p.id}`} className="hover:text-[#e87722]">
                          {p.siteCode} · {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {ceoSummary.highImpactChanges.length > 0 && (
                <section className="rounded-xl border border-[#e87722]/30 bg-white p-4">
                  <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">
                    High-impact changes awaiting approval
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {ceoSummary.highImpactChanges.map((c) => (
                      <li key={c.id}>
                        <Link href={`/change-log/${c.id}`} className="hover:text-[#e87722]">
                          {c.changeId} · {c.site.code} · {c.project.name}
                        </Link>
                        <span className="ml-2 text-slate-500">({c.status.replace(/_/g, ' ')})</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {ceoSummary.corenLicences.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">COREN licence status</h2>
                  <ul className="space-y-2 text-sm">
                    {ceoSummary.corenLicences.map((l) => (
                      <li key={l.engineer.email} className="flex flex-wrap items-center gap-2">
                        <span>
                          {l.engineer.firstName} {l.engineer.lastName} · {l.licenceNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            l.status === 'EXPIRING'
                              ? 'bg-amber-100 text-amber-800'
                              : l.status === 'EXPIRED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {l.status === 'EXPIRING'
                            ? `${l.daysRemaining} days left`
                            : l.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {summary && !isExecutive && (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Pending log approvals" value={summary.pendingLogCount} href="/site-tracker" />
              <StatCard label="Material requests" value={summary.pendingMaterialCount} href="/material-requests" />
              <StatCard label="Open HSE items" value={summary.openHseCount} href="/site-tracker" />
              <StatCard label="Active projects" value={summary.activeProjects} href="/milestones" />
            </section>
          )}

          {summary && summary.pendingLogs.length > 0 && !isExecutive && (
            <section className="rounded-xl border border-[#e87722]/30 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">Logs awaiting approval</h2>
              <ul className="space-y-2">
                {summary.pendingLogs.map((log) => (
                  <li key={log.id}>
                    <Link href={`/site-tracker/${log.id}`} className="text-sm hover:text-[#e87722]">
                      {log.refCode} · {log.site.code} · {log.projectName}
                      {log.submittedBy && (
                        <span className="text-slate-500">
                          {' '}
                          — {log.submittedBy.firstName} {log.submittedBy.lastName}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary && summary.todaysIssues.length > 0 && !isExecutive && (
            <section className="rounded-xl border border-red-200 bg-red-50/50 p-4">
              <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">Today&apos;s site issues</h2>
              <ul className="space-y-2 text-sm">
                {summary.todaysIssues.map((log) => (
                  <li key={log.id}>
                    <Link href={`/site-tracker/${log.id}`} className="hover:text-[#e87722]">
                      {log.refCode} ({log.site.code}) —
                      {[
                        log.issueMaterialShortage && 'material shortage',
                        log.issueEquipmentBreakdown && 'equipment',
                        log.issueWeatherDelay && 'weather',
                        log.safetyIncidentsNearMisses && 'HSE',
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/site-tracker/new"
              className="rounded-xl border border-[#e87722]/30 bg-white p-5 shadow-sm hover:border-[#e87722]"
            >
              <h2 className="font-semibold text-[#1a2744]">New daily site log</h2>
              <p className="mt-1 text-sm text-slate-600">
                Submit today&apos;s activities, manpower, materials & safety checks
              </p>
            </Link>
            <Link
              href="/site-tracker"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">View site logs</h2>
              <p className="mt-1 text-sm text-slate-600">
                Review, submit, or approve daily tracker entries
              </p>
            </Link>
            <Link
              href="/change-log/new"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Raise project change</h2>
              <p className="mt-1 text-sm text-slate-600">
                Log variations — scope, time, or cost impact
              </p>
            </Link>
            <Link
              href="/change-log"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Change log register</h2>
              <p className="mt-1 text-sm text-slate-600">
                Review and approve project variations
              </p>
            </Link>
            <Link
              href="/material-requests/new"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Request materials</h2>
              <p className="mt-1 text-sm text-slate-600">
                Foreman → PM approve → Store issue
              </p>
            </Link>
            <Link
              href="/material-requests"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Material requests</h2>
              <p className="mt-1 text-sm text-slate-600">
                Track pending, approved, and issued materials
              </p>
            </Link>
            <Link
              href="/invoices/new"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Create invoice</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sales invoice with variations & settlement routing
              </p>
            </Link>
            <Link
              href="/invoices"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Invoices & payments</h2>
              <p className="mt-1 text-sm text-slate-600">
                Verify payment proofs & download receipts
              </p>
            </Link>
            <Link
              href="/milestones"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Project milestones</h2>
              <p className="mt-1 text-sm text-slate-600">
                FCDA gate, progress rollup & engineer certification
              </p>
            </Link>
            <Link
              href="/tenant-applications/new"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Tenant application</h2>
              <p className="mt-1 text-sm text-slate-600">
                23-field form · 20% agency fee · PM approval
              </p>
            </Link>
            <Link
              href="/estate-terrier"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Estate Terrier</h2>
              <p className="mt-1 text-sm text-slate-600">
                Dawaki rental register · occupancy & net income
              </p>
            </Link>
            <Link
              href="/listings"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">Sales listings</h2>
              <p className="mt-1 text-sm text-slate-600">
                FOR SALE catalog — 29+ properties from Abraham&apos;s PDF
              </p>
            </Link>
            <Link
              href="/crm"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#1a2744]"
            >
              <h2 className="font-semibold text-[#1a2744]">CRM pipeline</h2>
              <p className="mt-1 text-sm text-slate-600">
                Inquiry → Won/Lost · convert to client
              </p>
            </Link>
          </div>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">Active projects</h2>
            <div className="space-y-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/milestones/${p.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-[#e87722]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-slate-500">
                        {p.site.code} · {p.location}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.milestones.map((m) => (
                      <span
                        key={m.stage}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                      >
                        {m.stage}: {Number(m.progressPct).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
              {!projects.length && (
                <p className="text-sm text-slate-500">No projects assigned yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  href,
  format,
  suffix,
}: {
  label: string;
  value: number;
  href: string;
  format?: 'naira';
  suffix?: string;
}) {
  const display =
    format === 'naira'
      ? formatNaira(value)
      : `${value.toLocaleString()}${suffix ?? ''}`;

  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#e87722]"
    >
      <p className="text-2xl font-semibold text-[#1a2744]">{display}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </Link>
  );
}
