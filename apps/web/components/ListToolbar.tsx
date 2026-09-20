'use client';

import { INPUT } from '@/lib/ui';
import { SearchableSelect, type SearchableOption } from '@/components/SearchableSelect';
import type { FilterDef } from '@/lib/use-filtered-list';

type ListToolbarProps = {
  query: string;
  onQueryChange: (q: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  rightSlot?: React.ReactNode;
};

export function ListToolbar({
  query,
  onQueryChange,
  searchPlaceholder = 'Search…',
  filters = [],
  filterValues = {},
  onFilterChange,
  rightSlot,
}: ListToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
        <input
          className={INPUT}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {filters.map((f) => {
        const opts: SearchableOption[] = [
          { value: '', label: `All ${f.label.toLowerCase()}` },
          ...f.options,
        ];
        return (
          <div key={f.key} className="w-full min-w-[160px] sm:w-48">
            <label className="mb-1 block text-xs font-medium text-slate-600">{f.label}</label>
            <SearchableSelect
              options={opts}
              value={filterValues[f.key] ?? ''}
              onChange={(v) => onFilterChange?.(f.key, v)}
              emptyLabel={`All ${f.label.toLowerCase()}`}
              placeholder={`Filter ${f.label.toLowerCase()}…`}
            />
          </div>
        );
      })}
      {rightSlot}
    </div>
  );
}

type PaginationBarProps = {
  page: number;
  pageCount: number;
  pageSize: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
};

export function PaginationBar({
  page,
  pageCount,
  pageSize,
  filteredCount,
  onPageChange,
}: PaginationBarProps) {
  if (filteredCount === 0) {
    return (
      <p className="mt-3 text-sm text-slate-500">No matching results.</p>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filteredCount);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <p>
        Showing {from}–{to} of {filteredCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="tabular-nums">
          Page {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
