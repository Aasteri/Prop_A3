'use client';

import { useEffect, useState } from 'react';
import { getOfflineQueue } from '@/lib/offline-site-log';
import { syncOfflineSiteLogs } from '@/lib/api';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  function refresh() {
    setPending(getOfflineQueue().length);
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }

  useEffect(() => {
    refresh();
    const onOnline = () => {
      refresh();
      if (navigator.onLine && getOfflineQueue().length > 0) {
        sync();
      }
    };
    const onOffline = () => refresh();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  async function sync() {
    setSyncing(true);
    try {
      await syncOfflineSiteLogs();
      refresh();
    } finally {
      setSyncing(false);
    }
  }

  if (online && pending === 0) return null;

  return (
    <div
      className={`mb-4 rounded-lg px-4 py-3 text-sm ${
        online ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-900'
      }`}
    >
      {!online && <p className="font-medium">You are offline — logs will be queued locally.</p>}
      {pending > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span>
            {pending} site log{pending > 1 ? 's' : ''} waiting to sync
          </span>
          {online && (
            <button
              type="button"
              disabled={syncing}
              onClick={sync}
              className="rounded bg-[#e87722] px-3 py-1 text-xs text-white disabled:opacity-60"
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
