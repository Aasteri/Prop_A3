'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);

  const load = () => {
    api<{ count: number }>('/notifications/unread-count')
      .then((r) => setCount(r.count))
      .catch(() => {});
    if (open) {
      api<Notification[]>('/notifications')
        .then(setItems)
        .catch(() => {});
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [open]);

  const markAllRead = async () => {
    await api('/notifications/read-all', { method: 'POST' });
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20"
        aria-label="Notifications"
      >
        Alerts
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e87722] px-1 text-[10px] font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white text-slate-900 shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-[#e87722] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="border-b border-slate-100 last:border-0">
                <Link
                  href={n.linkUrl ?? '/dashboard'}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 text-sm hover:bg-slate-50 ${n.isRead ? 'opacity-70' : ''}`}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.body}</p>
                </Link>
              </li>
            ))}
            {!items.length && (
              <li className="px-3 py-4 text-center text-sm text-slate-500">No notifications</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
