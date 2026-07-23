'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';

type Lead = {
  id: string;
  leadRef: string;
  firstName: string;
  lastName: string;
  phone: string;
  source: string;
  stage: string;
  listing: { listingRef: string; location: string } | null;
};

type Pipeline = {
  stages: { stage: string; label: string; count: number; leads: Lead[] }[];
  totals: { active: number; won: number; lost: number };
};

export default function CrmPipelinePage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [clients, setClients] = useState<{ id: string; clientRef: string; firstName: string; lastName: string }[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Pipeline>('/crm/pipeline').then(setPipeline).catch(console.error);
    api<typeof clients>('/crm/clients').then(setClients).catch(console.error);
  }, [router]);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">CRM pipeline</h1>
          {pipeline && (
            <p className="text-sm text-slate-600">
              {pipeline.totals.active} active · {pipeline.totals.won} won · {pipeline.totals.lost} lost
            </p>
          )}
        </div>
        <Link href="/crm/leads/new" className="rounded-md bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]">
          New lead
        </Link>
      </div>

      {!pipeline ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline.stages
            .filter((s) => s.stage !== 'WON' && s.stage !== 'LOST')
            .map((col) => (
              <div key={col.stage} className="min-w-[240px] flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50">
                <div className="border-b border-slate-200 px-3 py-2">
                  <p className="font-semibold text-[#1a2744]">{col.label}</p>
                  <p className="text-xs text-slate-500">{col.count} leads</p>
                </div>
                <div className="space-y-2 p-2">
                  {col.leads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/crm/leads/${lead.id}`}
                      className="block rounded-md border border-slate-200 bg-white p-3 text-sm hover:border-[#e87722]"
                    >
                      <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-slate-500">{lead.leadRef}</p>
                      {lead.listing && (
                        <p className="mt-1 text-xs text-slate-600">{lead.listing.location}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-[#1a2744]">Clients</h2>
        <div className="rounded-lg border bg-white">
          {clients.length ? (
            <ul className="divide-y">
              {clients.map((c) => (
                <li key={c.id} className="px-4 py-3 text-sm">
                  <span className="font-medium">{c.clientRef}</span> — {c.firstName} {c.lastName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-slate-500">No converted clients yet. Win a lead to create one.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
