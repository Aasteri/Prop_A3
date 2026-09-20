'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, getToken } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';

type Estate = {
  id: string;
  code: string;
  name: string;
  title: string;
  location: string | null;
};

export default function EstateTerrierIndexPage() {
  const router = useRouter();
  const [estates, setEstates] = useState<Estate[]>([]);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<Estate>({
    items: estates,
    searchKeys: ['code', 'name', 'title', 'location'],
  });

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Estate[]>('/estate-terrier/estates').then(setEstates).catch(console.error);
  }, [router]);

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-[#1a2744]">Estate Terrier</h1>
        <p className="text-sm text-slate-600">16-column rental register per managed estate</p>
      </div>

      {estates.length > 0 && (
        <ListToolbar
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="Search estates…"
        />
      )}

      <div className="space-y-3">
        {pageItems.map((e) => (
          <Link
            key={e.id}
            href={`/estate-terrier/${e.id}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-[#e87722]"
          >
            <p className="font-medium text-[#1a2744]">{e.title}</p>
            <p className="text-sm text-slate-500">
              {e.code} · {e.location}
            </p>
          </Link>
        ))}
        {!estates.length && <p className="text-sm text-slate-500">No rental estates configured.</p>}
      </div>
      {estates.length > 0 && (
        <PaginationBar
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          filteredCount={filteredCount}
          onPageChange={setPage}
        />
      )}
    </AppShell>
  );
}
