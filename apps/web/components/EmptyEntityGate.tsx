'use client';

import Link from 'next/link';
import { CARD } from '@/lib/ui';

export function EmptyEntityGate({
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className={`${CARD} p-8 text-center`}>
      <h2 className="text-lg font-semibold text-[#1a2744]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={actionHref}
          className="inline-flex rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          {actionLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyProjectGate({
  moduleLabel = 'this module',
}: {
  moduleLabel?: string;
}) {
  return (
    <EmptyEntityGate
      title="No projects yet"
      description={`Create a project before you can use ${moduleLabel}. Charters, schedules, site logs, and finance all hang off a project.`}
      actionHref="/projects/new"
      actionLabel="Create project"
      secondaryHref="/projects-hub"
      secondaryLabel="Project pulse"
    />
  );
}
