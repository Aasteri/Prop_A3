'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { api, getToken, type AuthUser } from '@/lib/api';
import { PAGE_HEADER, SECTION_TITLE, STAT_CARD } from '@/lib/ui';

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

type WeeklyReport = {
  period: { from: string; to: string };
  summary: {
    approvedLogs: number;
    pendingLogApprovals: number;
    pendingMaterialRequests: number;
  };
  bySite: {
    siteCode: string;
    siteName: string;
    approvedLogs: number;
    openIssues: number;
    latestRefs: string[];
  }[];
  highlights: {
    refCode: string;
    date: string;
    siteCode: string;
    projectName: string;
    progressNotes: string | null;
  }[];
  narrative: string;
};

const MODULE_HUBS = [
  {
    href: '/projects-hub',
    label: 'Projects',
    desc: 'Site logs, milestones, change control, inspections',
  },
  {
    href: '/properties-hub',
    label: 'Properties',
    desc: 'PM, tenancies, maintenance, sales & CRM',
  },
  {
    href: '/procurement',
    label: 'Procurement',
    desc: 'Goods, services, works, vendors',
  },
  {
    href: '/invoices',
    label: 'Finance',
    desc: 'Invoices, remittances, service charges',
  },
];

const QUICK_ACTIONS = [
  { href: '/site-tracker/new', label: 'New site log', desc: 'Daily tracker entry' },
  { href: '/change-log/new', label: 'Raise change', desc: 'Scope or cost variation' },
  { href: '/material-requests/new', label: 'Request materials', desc: 'Site requisition' },
  { href: '/maintenance', label: 'Maintenance', desc: 'Log or triage a request' },
  { href: '/tenant-applications/new', label: 'Tenant application', desc: 'Screening intake' },
  { href: '/crm/leads/new', label: 'New lead', desc: 'Sales CRM inquiry' },
];

function formatNaira(v: number) {
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function formatDate() {
  return new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<PmSummary | null>(null);
  const [ceoSummary, setCeoSummary] = useState<CeoSummary | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);

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
        if (u.role === 'CEO' || u.role === 'ADMIN' || u.role === 'PROJECT_MANAGER') {
          api<WeeklyReport>('/dashboard/weekly-report').then(setWeeklyReport).catch(console.error);
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
          <header className={PAGE_HEADER}>
            <p className="text-sm text-slate-300">{formatDate()}</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Welcome back, {user.firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              {isExecutive
                ? 'Executive overview across projects, properties, procurement, finance, and compliance.'
                : user.primarySite
                  ? `Primary site: ${user.primarySite.name} (${user.primarySite.code})`
                  : 'Your workspace for site operations and project delivery.'}
            </p>
          </header>

          {ceoSummary && isExecutive && (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Outstanding receivables"
                value={ceoSummary.revenue.totalOutstanding}
                href="/invoices"
                format="naira"
                accent="orange"
              />
              <StatCard
                label="Revenue collected"
                value={ceoSummary.revenue.totalCollected}
                href="/invoices"
                format="naira"
                accent="green"
              />
              <StatCard label="Active leads" value={ceoSummary.leads.active} href="/crm" accent="navy" />
              <StatCard
                label="Lead conversion"
                value={ceoSummary.leads.conversionRate}
                href="/crm"
                suffix="%"
                accent="navy"
              />
            </section>
          )}

          {summary && !isExecutive && (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Pending log approvals"
                value={summary.pendingLogCount}
                href="/site-tracker"
                accent="orange"
              />
              <StatCard
                label="Material requests"
                value={summary.pendingMaterialCount}
                href="/material-requests"
                accent="navy"
              />
              <StatCard
                label="Open HSE items"
                value={summary.openHseCount}
                href="/site-tracker"
                accent="red"
              />
              <StatCard
                label="Active projects"
                value={summary.activeProjects}
                href="/milestones"
                accent="green"
              />
            </section>
          )}

          <section>
            <h2 className={`${SECTION_TITLE} mb-3`}>Platform modules</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {MODULE_HUBS.map((h) => (
                <Link
                  key={h.href}
                  href={h.href}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[#e87722]/50 hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-[#1a2744]">{h.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{h.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className={`${SECTION_TITLE} mb-3`}>Quick actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-[#e87722]/50 hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-[#1a2744]">{a.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              {weeklyReport && (
                <Panel title="Weekly site report" badge={`${weeklyReport.period.from} → ${weeklyReport.period.to}`}>
                  <p className="text-sm leading-relaxed text-slate-600">{weeklyReport.narrative}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Approved logs" value={weeklyReport.summary.approvedLogs} />
                    <MiniStat
                      label="Pending approvals"
                      value={weeklyReport.summary.pendingLogApprovals}
                      variant="warning"
                    />
                    <MiniStat
                      label="Material requests"
                      value={weeklyReport.summary.pendingMaterialRequests}
                    />
                  </div>
                  {weeklyReport.bySite.length > 0 && (
                    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Site</th>
                            <th className="px-4 py-3">Approved</th>
                            <th className="px-4 py-3">Issues</th>
                            <th className="px-4 py-3">Recent refs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {weeklyReport.bySite.map((s) => (
                            <tr key={s.siteCode} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3 font-medium text-[#1a2744]">{s.siteCode}</td>
                              <td className="px-4 py-3">{s.approvedLogs}</td>
                              <td className="px-4 py-3">{s.openIssues}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                {s.latestRefs.join(', ') || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              )}

              {ceoSummary && isExecutive && (
                <Panel title="Site health (today)">
                  <div className="overflow-x-auto rounded-lg border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Site</th>
                          <th className="px-4 py-3">Projects</th>
                          <th className="px-4 py-3">Log rate</th>
                          <th className="px-4 py-3">Missing</th>
                          <th className="px-4 py-3">Approvals</th>
                          <th className="px-4 py-3">HSE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ceoSummary.siteHealth.map((s) => (
                          <tr key={s.siteCode} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3">
                              <span className="font-medium text-[#1a2744]">{s.siteCode}</span>
                              <span className="block text-xs text-slate-500">{s.siteName}</span>
                            </td>
                            <td className="px-4 py-3">{s.activeProjects}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  s.logSubmissionRate >= 100
                                    ? 'bg-green-100 text-green-800'
                                    : s.logSubmissionRate >= 50
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {s.logSubmissionRate}%
                              </span>
                            </td>
                            <td className="px-4 py-3">{s.missingLogsToday}</td>
                            <td className="px-4 py-3">{s.pendingLogApprovals}</td>
                            <td className="px-4 py-3">{s.openHseCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}

              {summary && summary.pendingLogs.length > 0 && !isExecutive && (
                <AlertPanel title="Logs awaiting approval" variant="warning">
                  <ul className="space-y-2">
                    {summary.pendingLogs.map((log) => (
                      <li key={log.id}>
                        <Link href={`/site-tracker/${log.id}`} className="text-sm hover:text-[#e87722]">
                          <span className="font-medium">{log.refCode}</span>
                          <span className="text-slate-500">
                            {' '}
                            · {log.site.code} · {log.projectName}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AlertPanel>
              )}

              {summary && summary.todaysIssues.length > 0 && !isExecutive && (
                <AlertPanel title="Today's site issues" variant="danger">
                  <p className="mb-3 text-xs text-slate-600">
                    Logs submitted today with material, equipment, weather, or HSE flags set on the daily site tracker form.
                  </p>
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
                </AlertPanel>
              )}

              <Panel title="Active projects">
                <div className="space-y-3">
                  {projects.map((p) => {
                    const avg =
                      p.milestones.length > 0
                        ? p.milestones.reduce((s, m) => s + Number(m.progressPct), 0) /
                          p.milestones.length
                        : 0;
                    return (
                      <Link
                        key={p.id}
                        href={`/milestones/${p.id}`}
                        className="block rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-[#e87722]/40 hover:bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#1a2744]">{p.name}</p>
                            <p className="text-sm text-slate-500">
                              {p.site.code} · {p.location ?? p.site.name}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#1a2744] px-2.5 py-1 text-xs font-medium text-white">
                            {avg.toFixed(0)}% avg
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-[#e87722] transition-all"
                            style={{ width: `${Math.min(100, avg)}%` }}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {p.milestones.map((m) => (
                            <span
                              key={m.stage}
                              className="rounded-md bg-white px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                            >
                              {m.stage}: {Number(m.progressPct).toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                  {!projects.length && (
                    <p className="text-sm text-slate-500">No projects assigned yet.</p>
                  )}
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              {ceoSummary && isExecutive && (
                <>
                  <Panel title="Compliance snapshot">
                    <ul className="space-y-3 text-sm">
                      <ComplianceRow label="Open HSE incidents" value={ceoSummary.compliance.openHseCount} href="/site-tracker" />
                      <ComplianceRow label="Logs pending approval" value={ceoSummary.compliance.pendingLogApprovals} href="/site-tracker" />
                      <ComplianceRow label="FCDA permits missing" value={ceoSummary.compliance.fcdaMissingCount} href="/milestones" />
                      <ComplianceRow label="High-impact changes" value={ceoSummary.compliance.highImpactChangeCount} href="/change-log" />
                      <li className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-slate-600">COREN expiring (30d)</span>
                        <span className="font-semibold text-amber-700">
                          {ceoSummary.compliance.expiringCorenCount}
                        </span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-slate-600">Audit trail</span>
                        <Link href="/audit-log" className="text-sm font-medium text-[#e87722] hover:underline">
                          View →
                        </Link>
                      </li>
                    </ul>
                  </Panel>

                  <Panel title="Estate terrier">
                    <p className="text-3xl font-bold text-[#1a2744]">
                      {formatNaira(ceoSummary.rental.netIncome)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Net rental income</p>
                    <p className="mt-3 text-xs text-slate-500">
                      {ceoSummary.rental.unitCount} units · rent {formatNaira(ceoSummary.rental.totalRent)} ·
                      expenses {formatNaira(ceoSummary.rental.totalExpenses)}
                    </p>
                    <Link href="/estate-terrier" className="mt-4 inline-block text-sm font-medium text-[#e87722] hover:underline">
                      Open register →
                    </Link>
                  </Panel>

                  {ceoSummary.fcdaMissing.length > 0 && (
                    <AlertPanel title="FCDA permits missing" variant="warning">
                      <ul className="space-y-2 text-sm">
                        {ceoSummary.fcdaMissing.map((p) => (
                          <li key={p.id}>
                            <Link href={`/milestones/${p.id}`} className="hover:text-[#e87722]">
                              {p.siteCode} · {p.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </AlertPanel>
                  )}

                  {ceoSummary.highImpactChanges.length > 0 && (
                    <AlertPanel title="High-impact changes" variant="warning">
                      <ul className="space-y-2 text-sm">
                        {ceoSummary.highImpactChanges.map((c) => (
                          <li key={c.id}>
                            <Link href={`/change-log/${c.id}`} className="hover:text-[#e87722]">
                              {c.changeId} · {c.site.code}
                            </Link>
                            <span className="ml-1 text-slate-500">({c.status.replace(/_/g, ' ')})</span>
                          </li>
                        ))}
                      </ul>
                    </AlertPanel>
                  )}

                  {ceoSummary.corenLicences.length > 0 && (
                    <Panel title="COREN licences">
                      <ul className="space-y-3 text-sm">
                        {ceoSummary.corenLicences.map((l) => (
                          <li key={l.engineer.email} className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-slate-700">
                              {l.engineer.firstName} {l.engineer.lastName}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                l.status === 'EXPIRING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : l.status === 'EXPIRED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {l.status === 'EXPIRING' ? `${l.daysRemaining}d left` : l.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Panel({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className={SECTION_TITLE}>{title}</h2>
        {badge && <span className="text-xs text-slate-500">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function AlertPanel({
  title,
  variant,
  children,
}: {
  title: string;
  variant: 'warning' | 'danger';
  children: React.ReactNode;
}) {
  const styles =
    variant === 'danger'
      ? 'border-red-200 bg-red-50/60'
      : 'border-amber-200 bg-amber-50/60';
  return (
    <section className={`rounded-xl border p-5 ${styles}`}>
      <h2 className={`${SECTION_TITLE} mb-3`}>{title}</h2>
      {children}
    </section>
  );
}

function MiniStat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: 'warning';
}) {
  return (
    <div
      className={`rounded-lg p-3 text-center ${
        variant === 'warning' ? 'bg-amber-50' : 'bg-slate-50'
      }`}
    >
      <p className={`text-2xl font-bold ${variant === 'warning' ? 'text-amber-800' : 'text-[#1a2744]'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}

function ComplianceRow({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <Link href={href} className="font-semibold text-[#e87722] hover:underline">
        {value}
      </Link>
    </li>
  );
}

function StatCard({
  label,
  value,
  href,
  format,
  suffix,
  accent = 'navy',
}: {
  label: string;
  value: number;
  href: string;
  format?: 'naira';
  suffix?: string;
  accent?: 'navy' | 'orange' | 'green' | 'red';
}) {
  const accentBar = {
    navy: 'bg-[#1a2744]',
    orange: 'bg-[#e87722]',
    green: 'bg-emerald-500',
    red: 'bg-red-500',
  }[accent];

  const display =
    format === 'naira'
      ? formatNaira(value)
      : `${value.toLocaleString()}${suffix ?? ''}`;

  return (
    <Link href={href} className={STAT_CARD}>
      <div className={`mb-3 h-1 w-10 rounded-full ${accentBar}`} />
      <p className="text-2xl font-bold tracking-tight text-[#1a2744]">{display}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </Link>
  );
}
