'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, getToken, type DocumentRecord } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';

import { getApiBaseUrl } from '@/lib/api-base';

const API_URL = getApiBaseUrl();

function labelCategory(c: string) {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function PortalDocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<DocumentRecord>({
    items: docs,
    searchKeys: ['title', 'category', 'version'],
  });

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<DocumentRecord[]>('/client-portal/documents')
      .then(setDocs)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <PortalShell>
      <h1 className="text-2xl font-semibold text-[#1a2744]">Your documents</h1>
      <p className="mt-1 text-sm text-slate-600">
        Contracts, allocation letters, and project files shared with you
      </p>

      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="mt-6 text-slate-500">No documents available yet.</p>
      ) : (
        <>
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search documents…"
          />
          <ul className="mt-6 space-y-3">
            {pageItems.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-[#1a2744]">{d.title}</p>
                  <p className="text-sm text-slate-600">
                    {labelCategory(d.category)} · v{d.version} ·{' '}
                    {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`${API_URL}${d.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white hover:bg-[#253660]"
                >
                  View / download
                </a>
              </li>
            ))}
          </ul>
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            filteredCount={filteredCount}
            onPageChange={setPage}
          />
        </>
      )}
    </PortalShell>
  );
}
