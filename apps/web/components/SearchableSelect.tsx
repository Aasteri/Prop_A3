'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { INPUT } from '@/lib/ui';

export type SearchableOption = {
  value: string;
  label: string;
  keywords?: string;
};

type SearchableSelectProps = {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  emptyLabel,
  disabled,
  required,
  className = '',
  id,
  name,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.value} ${o.keywords ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={value} required={required && !value} /> : null}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`${INPUT} flex items-center justify-between gap-2 text-left disabled:opacity-60`}
      >
        <span className={selected ? 'truncate text-slate-900' : 'truncate text-slate-500'}>
          {selected?.label ?? emptyLabel ?? placeholder}
        </span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              className={INPUT}
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
                if (e.key === 'Enter' && filtered[0]) {
                  e.preventDefault();
                  pick(filtered[0].value);
                }
              }}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1 text-sm"
          >
            {emptyLabel !== undefined && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!value}
                  className={`w-full px-3 py-2 text-left hover:bg-slate-50 ${!value ? 'bg-orange-50 text-[#e87722]' : 'text-slate-600'}`}
                  onClick={() => pick('')}
                >
                  {emptyLabel || '—'}
                </button>
              </li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={`w-full px-3 py-2 text-left hover:bg-slate-50 ${
                    o.value === value ? 'bg-orange-50 font-medium text-[#e87722]' : 'text-slate-900'
                  }`}
                  onClick={() => pick(o.value)}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {!filtered.length && (
              <li className="px-3 py-2 text-slate-500">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Helper: turn string enums into searchable options */
export function optionsFromValues(
  values: string[],
  labelFn?: (v: string) => string,
): SearchableOption[] {
  return values.map((v) => ({ value: v, label: labelFn ? labelFn(v) : v }));
}
