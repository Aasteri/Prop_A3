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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<AuthUser>('/auth/me').then(setUser).catch(() => router.replace('/login'));
    api<Project[]>('/projects').then(setProjects).catch(console.error);
  }, [router]);

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
              {user.primarySite
                ? `Primary site: ${user.primarySite.name}`
                : 'All sites access'}
            </p>
          </div>

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
