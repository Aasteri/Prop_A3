'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { MarketplaceShell } from '@/components/MarketplaceShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, PAGE_HEADER } from '@/lib/ui';

type Job = {
  id: string;
  publicId: string;
  title: string;
  status: string;
  locationText: string;
  createdAt: string;
  escrowPaidAt?: string | null;
  catalogItem?: { label: string; category?: string };
  quotes?: { id: string }[];
  assignments?: { id: string }[];
  payments?: { id: string; status: string }[];
  chatThread?: {
    id: string;
    addressUnlocked: boolean;
    _count?: { messages: number };
  } | null;
};

const CHAT_OPEN_STATUSES = new Set([
  'SELECTED',
  'AWAITING_PAYMENT',
  'IN_PROGRESS',
  'AWAITING_CONFIRM',
  'COMPLETED',
  'DISPUTED',
]);

function chatHint(job: Job): { label: string; tone: string } {
  if (!CHAT_OPEN_STATUSES.has(job.status)) {
    return {
      label: 'Chat opens after you select a quote',
      tone: 'text-slate-500',
    };
  }
  const msgs = job.chatThread?._count?.messages ?? 0;
  if (job.chatThread?.addressUnlocked || job.escrowPaidAt) {
    return {
      label: msgs ? `Chat open · ${msgs} message${msgs === 1 ? '' : 's'} · address unlocked` : 'Chat open · address unlocked (escrow paid)',
      tone: 'text-emerald-700',
    };
  }
  return {
    label: msgs
      ? `Chat open · ${msgs} message${msgs === 1 ? '' : 's'} · address locked until escrow`
      : 'Chat open · address locked until workmanship escrow',
    tone: 'text-sky-700',
  };
}

const STATUS_FLOW = [
  'SUBMITTED',
  'ASSIGNED',
  'QUOTED',
  'SELECTED',
  'AWAITING_PAYMENT',
  'IN_PROGRESS',
  'AWAITING_CONFIRM',
  'COMPLETED',
] as const;

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SUBMITTED: 'Submitted',
    ASSIGNED: 'Artisans assigned',
    QUOTED: 'Quotes ready',
    SELECTED: 'Artisan selected',
    AWAITING_PAYMENT: 'Awaiting payment',
    IN_PROGRESS: 'In progress',
    AWAITING_CONFIRM: 'Awaiting your confirm',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
  };
  return map[status] ?? status.replace(/_/g, ' ');
}

function progressPct(status: string): number {
  if (status === 'CANCELLED' || status === 'DISPUTED') return 0;
  const idx = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STATUS_FLOW.length) * 100);
}

function statusTone(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-800';
  if (status === 'CANCELLED' || status === 'DISPUTED') return 'bg-red-100 text-red-800';
  if (status === 'IN_PROGRESS' || status === 'AWAITING_CONFIRM') return 'bg-sky-100 text-sky-800';
  if (status === 'QUOTED' || status === 'SELECTED' || status === 'AWAITING_PAYMENT')
    return 'bg-amber-100 text-amber-900';
  return 'bg-slate-100 text-slate-700';
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/marketplace/requests');
      return;
    }
    const u = getUser<AuthUser>();
    const allowed = ['MARKETPLACE_SEEKER', 'CLIENT', 'CEO', 'ADMIN', 'PROJECT_MANAGER'];
    if (u && !allowed.includes(u.role)) {
      router.replace('/marketplace');
      return;
    }
    api<Job[]>('/marketplace/jobs')
      .then(setJobs)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load requests'))
      .finally(() => setLoading(false));
  }, [router]);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<Job>({
    items: jobs,
    searchKeys: [
      'publicId',
      'title',
      'status',
      'locationText',
      (j) => j.catalogItem?.label ?? '',
      (j) => statusLabel(j.status),
    ],
  });

  return (
    <MarketplaceShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={PAGE_HEADER}>My requests</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track every artisan job you submitted — status, quotes, escrow payment, and the
              per-request chat (phones always blocked; full address only after workmanship is paid).
            </p>
          </div>
          <Link
            href="/marketplace"
            className="rounded-lg bg-[#e87722] px-3 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
          >
            New request
          </Link>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {!loading && !error && jobs.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search by id, title, status…"
          />
        )}

        <ul className="mt-6 space-y-3">
          {pageItems.map((j) => {
            const pct = progressPct(j.status);
            const quoteCount = j.quotes?.length ?? 0;
            const assignCount = j.assignments?.length ?? 0;
            const chat = chatHint(j);
            return (
              <li key={j.id} className={`${CARD} p-4`}>
                <Link href={`/marketplace/jobs/${j.id}`} className="block hover:opacity-90">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{j.publicId}</p>
                      <p className="font-medium text-[#1a2744]">{j.title}</p>
                      <p className="text-sm text-slate-600">
                        {j.catalogItem?.label ?? 'Job'}
                        {j.locationText ? ` · ${j.locationText}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(j.status)}`}
                    >
                      {statusLabel(j.status)}
                    </span>
                  </div>

                  {j.status !== 'CANCELLED' && j.status !== 'DISPUTED' && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#e87722] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className={`mt-2 text-xs font-medium ${chat.tone}`}>{chat.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {assignCount > 0
                      ? `${assignCount} artisan${assignCount === 1 ? '' : 's'} assigned`
                      : 'Awaiting assignment'}
                    {quoteCount > 0
                      ? ` · ${quoteCount} quote${quoteCount === 1 ? '' : 's'}`
                      : ''}
                    {' · '}
                    {new Date(j.createdAt).toLocaleDateString()}
                    {' · Open request for quotes, payment & chat'}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>

        {!loading && !error && !jobs.length && (
          <div className={`${CARD} mt-6 p-6 text-center`}>
            <p className="text-sm text-slate-600">You have not submitted any artisan requests yet.</p>
            <Link
              href="/marketplace"
              className="mt-3 inline-block text-sm font-medium text-[#e87722] hover:underline"
            >
              Browse jobs and submit a request
            </Link>
          </div>
        )}

        {jobs.length > 0 && (
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            filteredCount={filteredCount}
            onPageChange={setPage}
          />
        )}
      </div>
    </MarketplaceShell>
  );
}
