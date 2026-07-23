'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { api, getToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Progress = {
  project: { name: string; location: string | null };
  logs: {
    id: string;
    refCode: string;
    date: string;
    activities: { activity: string; status: string; progressPercent: number }[];
    photos: { id: string; url: string; caption: string | null }[];
  }[];
};

export default function PortalProgressPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [data, setData] = useState<Progress | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Progress>(`/client-portal/projects/${projectId}/progress`)
      .then(setData)
      .catch(() => router.push('/portal'));
  }, [projectId, router]);

  if (!data) {
    return (
      <PortalShell>
        <p className="text-slate-500">Loading…</p>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <Link href="/portal" className="text-sm text-[#e87722] hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{data.project.name}</h1>
      <p className="text-slate-600">Approved site progress — PM verified summaries only</p>

      <div className="mt-6 space-y-4">
        {data.logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{log.refCode}</p>
                <p className="text-sm text-slate-500">{new Date(log.date).toLocaleDateString()}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {log.activities.slice(0, 5).map((a, i) => (
                <li key={i} className="text-slate-700">
                  {a.activity} — {a.progressPercent}%
                </li>
              ))}
            </ul>
            {log.photos.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {log.photos.map((ph) => (
                  <a key={ph.id} href={`${API_URL}${ph.url}`} target="_blank" rel="noopener noreferrer">
                    <img
                      src={`${API_URL}${ph.url}`}
                      alt={ph.caption ?? 'Site photo'}
                      className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {!data.logs.length && (
          <p className="text-sm text-slate-500">No approved progress logs yet.</p>
        )}
      </div>
    </PortalShell>
  );
}
