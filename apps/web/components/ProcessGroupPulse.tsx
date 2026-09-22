'use client';

import Link from 'next/link';
import {
  PROCESS_GROUP_META,
  PROJECT_PROCESS_GROUPS,
  type ProjectProcessGroup,
} from '@/lib/process-stages';

export function ProcessGroupPulse({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: ProjectProcessGroup;
  onChange?: (next: ProjectProcessGroup) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'flex flex-wrap gap-1' : 'flex flex-wrap gap-2'}>
      {PROJECT_PROCESS_GROUPS.map((g) => {
        const meta = PROCESS_GROUP_META[g];
        const active = g === value;
        const className = active
          ? 'rounded-md bg-[#e87722] px-2.5 py-1 text-xs font-semibold text-white'
          : 'rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 hover:bg-slate-50';

        if (onChange && !disabled) {
          return (
            <button
              key={g}
              type="button"
              onClick={() => onChange(g)}
              className={className}
              title={meta.label}
            >
              {compact ? meta.label : meta.short}
            </button>
          );
        }

        return (
          <Link key={g} href={meta.href} className={className} title={meta.label}>
            {compact ? meta.label : meta.short}
          </Link>
        );
      })}
    </div>
  );
}
