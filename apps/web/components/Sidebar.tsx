'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIcon } from '@/components/NavIcon';
import type { NavGroup, NavItem } from '@/lib/navigation';

type SidebarProps = {
  groups?: NavGroup[];
  items?: NavItem[];
  brand: { title: string; subtitle: string; href: string };
  footer?: React.ReactNode;
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ groups, items, brand, footer, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    return item.match ? item.match(pathname) : pathname === item.href;
  }

  const content = (
  <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <Link href={brand.href} onClick={onClose} className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-white">
            {brand.title}
          </p>
          <p className="truncate text-xs text-slate-400">{brand.subtitle}</p>
        </Link>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        {groups?.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={isActive(item)}
                  onNavigate={onClose}
                />
              ))}
            </ul>
          </div>
        ))}

        {items && (
          <ul className="space-y-0.5">
            {items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isActive(item)}
                onNavigate={onClose}
              />
            ))}
          </ul>
        )}
      </nav>

      {footer && (
        <div className="shrink-0 border-t border-white/10 p-3">{footer}</div>
      )}
    </>
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1a2744] transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? 'bg-[#e87722] text-white shadow-sm'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <NavIcon name={item.icon} className="h-5 w-5 shrink-0 opacity-90" />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
