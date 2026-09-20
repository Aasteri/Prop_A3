'use client';

import { useMemo, useState, useEffect } from 'react';

export type FilterDef = {
  key: string;
  label: string;
  /** All filter option values; labels default to the value */
  options: { value: string; label: string }[];
  /** Read filter value from an item. Empty string means “all”. */
  getValue: (item: unknown) => string;
};

function readPath(obj: unknown, path: string): string {
  if (obj == null) return '';
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return '';
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur == null) return '';
  if (Array.isArray(cur)) return cur.map(String).join(' ');
  return String(cur);
}

export type UseFilteredListArgs<T> = {
  items: T[];
  /** Dot-paths or custom getters used for free-text search */
  searchKeys: (string | ((item: T) => string))[];
  filters?: FilterDef[];
  pageSize?: number;
};

export function useFilteredList<T>({
  items,
  searchKeys,
  filters = [],
  pageSize = 20,
}: UseFilteredListArgs<T>) {
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  function setFilter(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      for (const f of filters) {
        const selected = filterValues[f.key] ?? '';
        if (selected && f.getValue(item) !== selected) return false;
      }
      if (!q) return true;
      const hay = searchKeys
        .map((k) => (typeof k === 'function' ? k(item) : readPath(item, k)))
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, filterValues, filters, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    setPage(1);
  }, [query, filterValues, items.length, pageSize]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return {
    query,
    setQuery,
    filterValues,
    setFilter,
    page: safePage,
    setPage,
    pageSize,
    pageItems,
    filtered,
    total: items.length,
    filteredCount: filtered.length,
    pageCount,
  };
}
