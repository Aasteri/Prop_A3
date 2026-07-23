'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, downloadPdf, getToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type LogDetail = {
  id: string;
  refCode: string;
  date: string;
  status: string;
  projectName: string;
  projectLocation: string;
  startTime: string | null;
  endTime: string | null;
  ironBenders: number;
  carpenters: number;
  masons: number;
  activities: { activity: string; status: string; progressPercent: number }[];
  machinery: { equipment: string; unitsHours: number | string | null; remark: string | null }[];
  materials: { material: string; receivedQty: number; consumedQty: number; balance: number }[];
  qualitySlumpTest: boolean;
  safetyPpeCompliance: boolean;
  nextDayActivities: string | null;
  supervisorSignature: string | null;
  rejectReason: string | null;
  site: { code: string; name: string };
  photos: { id: string; url: string; filename: string; section: string | null }[];
};

export default function SiteLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<LogDetail | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<LogDetail>(`/site-tracker/logs/${id}`).then(setLog).catch(() => router.push('/site-tracker'));
  }, [id, router]);

  if (!log) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/site-tracker" className="text-sm text-[#e87722]">
          ← Back to logs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{log.projectName}</h1>
        <p className="text-slate-600">
          {log.refCode} · {log.site.code} · {new Date(log.date).toLocaleDateString()} ·{' '}
          <span className="font-medium">{log.status}</span>
        </p>
        <button
          type="button"
          onClick={() => downloadPdf(`/site-tracker/logs/${log.id}/pdf`, `${log.refCode.replace(/\//g, '-')}.pdf`)}
          className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Download PDF
        </button>
      </div>

      <div className="space-y-4">
        <Card title="Timing & location">
          <p>
            {log.startTime} – {log.endTime} · {log.projectLocation}
          </p>
        </Card>

        <Card title="Activities">
          <ul className="space-y-2">
            {log.activities.map((a, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{a.activity}</span>
                <span className="text-slate-500">
                  {a.status} · {a.progressPercent}%
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Manpower">
          <p className="text-sm">
            Iron benders: {log.ironBenders} · Carpenters: {log.carpenters} · Masons:{' '}
            {log.masons}
          </p>
        </Card>

        {log.machinery.length > 0 && (
          <Card title="Machinery">
            <ul className="space-y-1 text-sm">
              {log.machinery.map((m, i) => (
                <li key={i}>
                  {m.equipment}: {m.unitsHours ?? 0} hrs
                  {m.remark ? ` — ${m.remark}` : ''}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card title="Materials">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th>Material</th>
                <th>Recv</th>
                <th>Used</th>
                <th>Bal</th>
              </tr>
            </thead>
            <tbody>
              {log.materials.map((m, i) => (
                <tr key={i}>
                  <td>{m.material}</td>
                  <td>{m.receivedQty}</td>
                  <td>{m.consumedQty}</td>
                  <td className={m.balance < 0 ? 'text-red-600 font-medium' : ''}>
                    {m.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Quality & safety">
          <p className="text-sm">
            Slump test: {log.qualitySlumpTest ? 'Yes' : 'No'} · PPE:{' '}
            {log.safetyPpeCompliance ? 'Yes' : 'No'}
          </p>
        </Card>

        {log.nextDayActivities && (
          <Card title="Next day plan">
            <p className="text-sm whitespace-pre-wrap">{log.nextDayActivities}</p>
          </Card>
        )}

        {log.supervisorSignature && (
          <Card title="Signature">
            <p className="text-sm">{log.supervisorSignature}</p>
          </Card>
        )}

        {log.rejectReason && (
          <Card title="Rejection reason">
            <p className="text-sm text-red-700">{log.rejectReason}</p>
          </Card>
        )}

        {log.photos?.length > 0 && (
          <Card title="Site photos">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {log.photos.map((p) => (
                <a
                  key={p.id}
                  href={`${API_URL}${p.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_URL}${p.url}`}
                    alt={p.filename}
                    className="h-28 w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-2 font-semibold text-[#1a2744]">{title}</h2>
      {children}
    </section>
  );
}
