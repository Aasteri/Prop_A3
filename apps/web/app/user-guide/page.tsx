'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, INPUT, PAGE_HEADER } from '@/lib/ui';
import {
  ALL_ROLES,
  GLOSSARY,
  GUIDE_SECTIONS,
  ROLE_GUIDES,
  type RoleGuide,
} from '@/lib/user-guide-content';

function UserGuideInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const user = getUser<AuthUser>();
    const fromQuery = searchParams.get('role')?.toUpperCase() ?? '';
    const validQuery = ALL_ROLES.includes(fromQuery) ? fromQuery : '';
    if (user?.role) setUserRole(user.role);
    setRoleFilter(validQuery || user?.role || 'ALL');
  }, [router, searchParams]);

  const query = q.trim().toLowerCase();

  const roleGuides = useMemo(() => {
    let list: RoleGuide[] =
      roleFilter === 'ALL' ? ROLE_GUIDES : ROLE_GUIDES.filter((r) => r.role === roleFilter);
    if (!query) return list;
    return list.filter((r) => {
      const blob = [
        r.role,
        r.title,
        r.summary,
        ...r.dailyFocus,
        ...r.doThis.map((d) => `${d.title} ${d.body}`),
        ...(r.neverDo ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(query);
    });
  }, [query, roleFilter]);

  const glossary = useMemo(() => {
    if (!query) return GLOSSARY;
    return GLOSSARY.filter(
      (t) =>
        t.term.toLowerCase().includes(query) || t.definition.toLowerCase().includes(query),
    );
  }, [query]);

  const sections = useMemo(() => {
    const selected =
      roleFilter === 'ALL'
        ? null
        : ROLE_GUIDES.find((r) => r.role === roleFilter) ?? null;
    const allowedIds = selected?.relatedGuideSectionIds;

    let list = GUIDE_SECTIONS;
    if (allowedIds?.length) {
      list = GUIDE_SECTIONS.filter((s) => allowedIds.includes(s.id));
    }
    if (!query) return list;
    return list.filter((s) => {
      const blob = [
        s.title,
        s.summary,
        s.who,
        ...s.steps.map((st) => `${st.title} ${st.body}`),
        ...(s.tips ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(query);
    });
  }, [query, roleFilter]);

  function selectRole(role: string) {
    setRoleFilter(role);
    const url = role === 'ALL' ? '/user-guide' : `/user-guide?role=${role}`;
    router.replace(url);
  }

  return (
    <div className="space-y-8">
      <header className={PAGE_HEADER}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
          Platform · Help
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Propa3 user guide
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200/90">
          Pick your role for a day-to-day playbook, or browse All. Glossary defines FM, JV, IVC,
          Terrier, and other terms so nobody has to guess.
        </p>
      </header>

      <div className={`${CARD} space-y-3 p-4`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Role playbooks
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectRole('ALL')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                roleFilter === 'ALL'
                  ? 'bg-[#e87722] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All roles
            </button>
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => selectRole(role)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  roleFilter === role
                    ? 'bg-[#1a2744] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {role.replace(/_/g, ' ')}
                {userRole === role ? ' · you' : ''}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search guide & glossary
          </label>
          <input
            className={`${INPUT} mt-1`}
            placeholder="e.g. IVC, terrier, tenant score, remittance…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <nav className={`${CARD} p-4`}>
        <h2 className="text-sm font-semibold text-[#1a2744]">Contents</h2>
        <ol className="mt-3 columns-1 gap-x-8 text-sm text-slate-700 sm:columns-2">
          <li className="mb-1 break-inside-avoid">
            <a href="#by-role" className="text-[#e87722] hover:underline">
              By role
            </a>
          </li>
          <li className="mb-1 break-inside-avoid">
            <a href="#glossary" className="text-[#e87722] hover:underline">
              Glossary
            </a>
          </li>
          {GUIDE_SECTIONS.map((s) => (
            <li key={s.id} className="mb-1 break-inside-avoid">
              <a href={`#${s.id}`} className="text-[#e87722] hover:underline">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="by-role" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-semibold text-[#1a2744]">By role</h2>
        <p className="text-sm text-slate-600">
          Every account type has a playbook: what to focus on daily, what to click, and what not to
          invent.
        </p>
        {roleGuides.map((r) => (
          <article
            key={r.role}
            id={`role-${r.role}`}
            className={`${CARD} scroll-mt-24 space-y-4 p-5`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#e87722]">
                {r.role.replace(/_/g, ' ')}
                {userRole === r.role ? ' · your role' : ''}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#1a2744]">{r.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{r.summary}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Daily focus
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {r.dailyFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Do this</p>
              <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm text-slate-700">
                {r.doThis.map((step) => (
                  <li key={step.title}>
                    <span className="font-medium text-[#1a2744]">{step.title}.</span> {step.body}{' '}
                    {step.href ? (
                      <Link href={step.href} className="font-medium text-[#e87722] hover:underline">
                        Open {step.href}
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
            {r.neverDo && r.neverDo.length > 0 && (
              <ul className="space-y-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                {r.neverDo.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
        {!roleGuides.length && (
          <p className={`${CARD} p-6 text-sm text-slate-500`}>No role playbooks match “{q}”.</p>
        )}
      </section>

      <section id="glossary" className="scroll-mt-24 space-y-3">
        <h2 className="text-xl font-semibold text-[#1a2744]">Glossary</h2>
        <p className="text-sm text-slate-600">
          Short definitions for terms users often ask about. If something is still WAITING from
          Abraham, the guide says so — do not invent fields.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {glossary.map((t) => (
            <article key={t.term} className={`${CARD} p-4`}>
              <h3 className="font-semibold text-[#1a2744]">{t.term}</h3>
              <p className="mt-2 text-sm text-slate-600">{t.definition}</p>
            </article>
          ))}
          {!glossary.length && (
            <p className="text-sm text-slate-500">No glossary matches for “{q}”.</p>
          )}
        </div>
      </section>

      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
          <div className={`${CARD} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#e87722]">
              Who: {s.who}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#1a2744]">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{s.summary}</p>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-700">
              {s.steps.map((st) => (
                <li key={st.title}>
                  <span className="font-medium text-[#1a2744]">{st.title}.</span> {st.body}
                </li>
              ))}
            </ol>
            {s.tips && s.tips.length > 0 && (
              <ul className="mt-4 space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {s.tips.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            )}
            {s.related && s.related.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="text-slate-500">Open:</span>
                {s.related.map((href) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-md bg-[#1a2744]/5 px-2 py-0.5 font-medium text-[#1a2744] hover:bg-[#1a2744]/10"
                  >
                    {href}
                  </Link>
                ))}
              </p>
            )}
          </div>
        </section>
      ))}

      {!sections.length && (
        <p className={`${CARD} p-6 text-sm text-slate-500`}>No guide sections match “{q}”.</p>
      )}

      <p className="pb-8 text-center text-xs text-slate-500">
        Triple A Realty / Propa3 · Role playbooks for CEO, Admin, PM, Foreman, Engineer, Architect,
        Store, Finance, Sales, Client
      </p>
    </div>
  );
}

export default function UserGuidePage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading guide…</p>}>
        <UserGuideInner />
      </Suspense>
    </AppShell>
  );
}
