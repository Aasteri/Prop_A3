'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, PAGE_HEADER } from '@/lib/ui';

type Job = {
  id: string;
  publicId: string;
  title: string;
  status: string;
  catalogItem?: { label: string };
};

export default function ArtisanHomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const u = getUser<AuthUser>();
    if (u?.role !== 'ARTISAN' && u?.role !== 'CEO' && u?.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }
    api<Job[]>('/marketplace/jobs').then(setJobs).catch(console.error);
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
    searchKeys: ['publicId', 'title', 'status', (j) => j.catalogItem?.label ?? ''],
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className={PAGE_HEADER}>Artisan jobs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Jobs Admin assigned to you. Submit workmanship quotes; materials stay outside escrow.
        </p>
        {jobs.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search assigned jobs…"
          />
        )}
        <ul className="mt-6 space-y-3">
          {pageItems.map((j) => (
            <li key={j.id} className={`${CARD} p-4`}>
              <Link href={`/marketplace/jobs/${j.id}`} className="block hover:opacity-90">
                <p className="text-xs text-slate-500">{j.publicId}</p>
                <p className="font-medium text-[#1a2744]">{j.title}</p>
                <p className="text-sm text-slate-600">
                  {j.catalogItem?.label} · {j.status}
                </p>
              </Link>
            </li>
          ))}
          {!jobs.length && <p className="text-sm text-slate-500">No assignments yet.</p>}
        </ul>
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
    </div>
  );
}
