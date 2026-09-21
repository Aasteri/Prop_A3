'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/api';
import { CARD, PAGE_HEADER } from '@/lib/ui';
import {
  CONNECT_SUMMARY,
  ENTITY_NOTES,
  FLOWS,
  PILLARS,
  ROLE_HOMES,
} from '@/lib/workflow-content';

export default function WorkflowMapPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 text-slate-600">
        Loading workflow map…
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 pb-16">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Internal · not in menus
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            System workflow map
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
            How every Propa3 pillar connects — roles, modules, and end-to-end flows. Bookmark{' '}
            <span className="font-mono text-white">/workflow</span>. Not linked from navigation.
          </p>
        </header>

        <nav className={`${CARD} p-4 text-sm`}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            On this page
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="#roles" className="text-[#e87722] hover:underline">
              Role entry points
            </a>
            <a href="#connect" className="text-[#e87722] hover:underline">
              How it connects
            </a>
            <a href="#flows" className="text-[#e87722] hover:underline">
              End-to-end flows
            </a>
            <a href="#pillars" className="text-[#e87722] hover:underline">
              Pillars & modules
            </a>
            <a href="#entities" className="text-[#e87722] hover:underline">
              Entity legend
            </a>
          </div>
        </nav>

        <section id="roles" className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1a2744]">Role entry points</h2>
          <p className="text-sm text-slate-600">
            After login, home depends on role. Account menu always exposes Profile, home, and Help.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Home</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ROLE_HOMES.map((r) => (
                  <tr key={r.role}>
                    <td className="px-4 py-3 font-medium text-[#1a2744]">{r.role}</td>
                    <td className="px-4 py-3">
                      <Link href={r.home} className="font-medium text-[#e87722] hover:underline">
                        {r.homeLabel}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-slate-400">{r.home}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="connect" className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1a2744]">How the system connects</h2>
          <ul className="space-y-2">
            {CONNECT_SUMMARY.map((line) => (
              <li
                key={line}
                className={`${CARD} border-l-4 border-l-[#e87722] px-4 py-3 text-sm text-slate-700`}
              >
                {line}
              </li>
            ))}
          </ul>
          <div className={`${CARD} overflow-x-auto p-4`}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Big-picture chain
            </p>
            <div className="flex min-w-max flex-wrap items-center gap-2 text-sm">
              {[
                'Public / Marketplace',
                'CRM / Admin',
                'Client / Seeker',
                'Projects OS',
                'Procurement',
                'Finance',
                'Portal',
              ].map((node, i, arr) => (
                <span key={node} className="flex items-center gap-2">
                  <span className="rounded-lg bg-[#1a2744] px-3 py-1.5 font-medium text-white">
                    {node}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-slate-400" aria-hidden>
                      →
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="flows" className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1a2744]">End-to-end flows</h2>
          <p className="text-sm text-slate-600">
            Each strip is a real path through the app. Click a step when it has a route.
          </p>
          <div className="space-y-4">
            {FLOWS.map((flow) => (
              <article key={flow.id} id={flow.id} className={`${CARD} p-5`}>
                <h3 className="text-base font-semibold text-[#1a2744]">{flow.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{flow.summary}</p>
                <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                  {flow.steps.map((step, idx) => (
                    <li key={`${flow.id}-${idx}`} className="flex items-stretch gap-2 sm:max-w-[11rem]">
                      <div className="flex min-h-[4.5rem] flex-1 flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Step {idx + 1}
                        </span>
                        {step.href ? (
                          <Link
                            href={step.href}
                            className="mt-1 text-sm font-medium text-[#e87722] hover:underline"
                          >
                            {step.label}
                          </Link>
                        ) : (
                          <span className="mt-1 text-sm font-medium text-slate-800">{step.label}</span>
                        )}
                        {step.note && (
                          <span className="mt-1 text-xs text-slate-500">{step.note}</span>
                        )}
                      </div>
                      {idx < flow.steps.length - 1 && (
                        <span
                          className="hidden self-center text-slate-300 sm:inline"
                          aria-hidden
                        >
                          →
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section id="pillars" className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1a2744]">Pillars & modules</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article key={pillar.id} id={pillar.id} className={`${CARD} p-5`}>
                <h3 className="text-base font-semibold text-[#1a2744]">{pillar.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{pillar.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pillar.hubs.map((h) => (
                    <Link
                      key={h.href}
                      href={h.href}
                      className="rounded-md bg-[#e87722] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#d06818]"
                    >
                      {h.label}
                    </Link>
                  ))}
                </div>
                <ul className="mt-4 space-y-2">
                  {pillar.modules.map((m) => (
                    <li key={m.href + m.label} className="text-sm">
                      <Link href={m.href} className="font-medium text-[#1a2744] hover:text-[#e87722]">
                        {m.label}
                      </Link>
                      <span className="text-slate-500"> — {m.blurb}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="entities" className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1a2744]">Entity legend</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ENTITY_NOTES.map((e) => (
              <div key={e.title} className={`${CARD} p-4`}>
                <h3 className="text-sm font-semibold text-[#1a2744]">{e.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-slate-400">
          Direct URL only · not listed in sidebar or public menus ·{' '}
          <Link href="/user-guide" className="text-[#e87722] hover:underline">
            User guide
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
