'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { OfflineBanner } from '@/components/OfflineBanner';
import { api, getToken, ApiError, uploadSiteLogPhotos } from '@/lib/api';
import {
  enqueueOfflineLog,
  fileToDataUrl,
} from '@/lib/offline-site-log';

type Project = {
  id: string;
  name: string;
  location: string | null;
  site: { code: string };
};

type ActivityRow = {
  activity: string;
  status: 'TODO' | 'ONGOING' | 'DONE';
  progressPercent: number;
  remark: string;
};

type MaterialRow = {
  material: string;
  receivedQty: number;
  consumedQty: number;
  remark: string;
};

type MachineryRow = {
  equipment: string;
  unitsHours: number;
  remark: string;
};

const defaultActivities: ActivityRow[] = [
  { activity: '', status: 'TODO', progressPercent: 0, remark: '' },
];

const defaultMaterials: MaterialRow[] = [
  { material: 'Cement', receivedQty: 0, consumedQty: 0, remark: '' },
  { material: 'Steel', receivedQty: 0, consumedQty: 0, remark: '' },
];

const defaultMachinery: MachineryRow[] = [
  { equipment: 'Excavator', unitsHours: 0, remark: '' },
  { equipment: 'Mixer', unitsHours: 0, remark: '' },
  { equipment: 'Vibrator', unitsHours: 0, remark: '' },
];

const INPUT =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export default function NewSiteLogPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('17:00');
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [siteSupervisors, setSiteSupervisors] = useState('');
  const [activities, setActivities] = useState(defaultActivities);
  const [materials, setMaterials] = useState(defaultMaterials);
  const [machinery, setMachinery] = useState(defaultMachinery);

  const [ironBenders, setIronBenders] = useState(0);
  const [carpenters, setCarpenters] = useState(0);
  const [masons, setMasons] = useState(0);
  const [plumbers, setPlumbers] = useState(0);
  const [electricians, setElectricians] = useState(0);
  const [unskilledWorkers, setUnskilledWorkers] = useState(0);

  const [qualitySlumpTest, setQualitySlumpTest] = useState(false);
  const [qualityCubeCasting, setQualityCubeCasting] = useState(false);
  const [safetyPpeCompliance, setSafetyPpeCompliance] = useState(false);
  const [safetyToolboxTalk, setSafetyToolboxTalk] = useState(false);
  const [issueMaterialShortage, setIssueMaterialShortage] = useState(false);

  const [nextDayActivities, setNextDayActivities] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Project[]>('/projects').then((list) => {
      setProjects(list);
      if (list[0]) {
        setProjectId(list[0].id);
        setProjectName(list[0].name);
        setProjectLocation(list[0].location ?? list[0].site.code);
      }
    });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
      );
    }
  }, [router]);

  function onProjectChange(id: string) {
    setProjectId(id);
    const p = projects.find((x) => x.id === id);
    if (p) {
      setProjectName(p.name);
      setProjectLocation(p.location ?? p.site.code);
    }
  }

  async function onSubmit(e: FormEvent, submitNow: boolean) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      projectId,
      date: new Date().toISOString().slice(0, 10),
      startTime,
      endTime,
      projectName,
      projectLocation,
      siteSupervisors: siteSupervisors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      ironBenders,
      carpenters,
      masons,
      plumbers,
      electricians,
      unskilledWorkers,
      skilledWorkers: ironBenders + carpenters + masons + plumbers + electricians,
      activities: activities.filter((a) => a.activity.trim()),
      machinery: machinery.filter((m) => m.unitsHours > 0 || m.remark.trim()),
      materials,
      qualitySlumpTest,
      qualityCubeCasting,
      safetyPpeCompliance,
      safetyToolboxTalk,
      issueMaterialShortage,
      nextDayActivities,
    };

    try {
      if (submitNow && !supervisorSignature.trim()) {
        setError('Supervisor signature required to submit');
        setLoading(false);
        return;
      }

      if (!navigator.onLine) {
        if (!submitNow) {
          setError('Save draft requires connection — use Submit to queue offline');
          setLoading(false);
          return;
        }
        const photoDataUrls = await Promise.all(
          photoFiles.map(async (f) => ({ name: f.name, dataUrl: await fileToDataUrl(f) })),
        );
        enqueueOfflineLog({
          localId: crypto.randomUUID(),
          payload,
          supervisorSignature,
          photoDataUrls,
          createdAt: new Date().toISOString(),
        });
        router.push('/site-tracker');
        return;
      }

      const log = await api<{ id: string }>('/site-tracker/logs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (photoFiles.length) {
        await uploadSiteLogPhotos(log.id, photoFiles, {
          section: 'site',
          lat: geo?.lat,
          lng: geo?.lng,
        });
      }

      if (submitNow) {
        await api(`/site-tracker/logs/${log.id}/submit`, {
          method: 'POST',
          body: JSON.stringify({
            supervisorSignature,
            submitLat: geo?.lat,
            submitLng: geo?.lng,
          }),
        });
      }

      router.push('/site-tracker');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save log');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <OfflineBanner />
      <h1 className="mb-4 text-2xl font-semibold text-[#1a2744]">New Daily Site Log</h1>

      <form className="space-y-6">
        <Section title="1. Header">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project">
              <select
                value={projectId}
                onChange={(e) => onProjectChange(e.target.value)}
                className={INPUT}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.site.code} — {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={INPUT} readOnly />
            </Field>
            <Field label="Start time">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={INPUT} />
            </Field>
            <Field label="End time">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Project name">
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Location">
              <input value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} className={INPUT} />
            </Field>
            <Field label="Site supervisors (comma-separated)">
              <input value={siteSupervisors} onChange={(e) => setSiteSupervisors(e.target.value)} className={INPUT} placeholder="Name 1, Name 2" />
            </Field>
          </div>
        </Section>

        <Section title="2. Daily Activities">
          {activities.map((row, i) => (
            <div key={i} className="mb-3 grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-4">
              <input
                placeholder="Activity"
                value={row.activity}
                onChange={(e) => {
                  const next = [...activities];
                  next[i] = { ...next[i], activity: e.target.value };
                  setActivities(next);
                }}
                className={`${INPUT} sm:col-span-2`}
              />
              <select
                value={row.status}
                onChange={(e) => {
                  const next = [...activities];
                  next[i] = { ...next[i], status: e.target.value as ActivityRow['status'] };
                  setActivities(next);
                }}
                className={INPUT}
              >
                <option value="TODO">To do</option>
                <option value="ONGOING">Ongoing</option>
                <option value="DONE">Done</option>
              </select>
              <input
                type="number"
                min={0}
                max={100}
                value={row.progressPercent}
                onChange={(e) => {
                  const next = [...activities];
                  next[i] = { ...next[i], progressPercent: Number(e.target.value) };
                  setActivities(next);
                }}
                className={INPUT}
                placeholder="%"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setActivities([...activities, { activity: '', status: 'TODO', progressPercent: 0, remark: '' }])}
            className="text-sm text-[#e87722]"
          >
            + Add activity
          </button>
        </Section>

        <Section title="3. Manpower by trade">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumField label="Iron benders" value={ironBenders} onChange={setIronBenders} />
            <NumField label="Carpenters" value={carpenters} onChange={setCarpenters} />
            <NumField label="Masons" value={masons} onChange={setMasons} />
            <NumField label="Plumbers" value={plumbers} onChange={setPlumbers} />
            <NumField label="Electricians" value={electricians} onChange={setElectricians} />
            <NumField label="Unskilled" value={unskilledWorkers} onChange={setUnskilledWorkers} />
          </div>
        </Section>

        <Section title="4. Machinery used">
          {machinery.map((row, i) => (
            <div key={i} className="mb-2 grid grid-cols-3 gap-2 text-sm">
              <span className="self-center font-medium">{row.equipment}</span>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="Units / hours"
                value={row.unitsHours}
                onChange={(e) => {
                  const next = [...machinery];
                  next[i] = { ...next[i], unitsHours: Number(e.target.value) };
                  setMachinery(next);
                }}
                className={INPUT}
              />
              <input
                placeholder="Remark"
                value={row.remark}
                onChange={(e) => {
                  const next = [...machinery];
                  next[i] = { ...next[i], remark: e.target.value };
                  setMachinery(next);
                }}
                className={INPUT}
              />
            </div>
          ))}
        </Section>

        <Section title="5. Materials">
          {materials.map((row, i) => (
            <div key={i} className="mb-2 grid grid-cols-4 gap-2 text-sm">
              <span className="self-center font-medium">{row.material}</span>
              <input
                type="number"
                min={0}
                placeholder="Received"
                value={row.receivedQty}
                onChange={(e) => {
                  const next = [...materials];
                  next[i] = { ...next[i], receivedQty: Number(e.target.value) };
                  setMaterials(next);
                }}
                className={INPUT}
              />
              <input
                type="number"
                min={0}
                placeholder="Consumed"
                value={row.consumedQty}
                onChange={(e) => {
                  const next = [...materials];
                  next[i] = { ...next[i], consumedQty: Number(e.target.value) };
                  setMaterials(next);
                }}
                className={INPUT}
              />
              <span className="self-center text-slate-600">
                Bal: {row.receivedQty - row.consumedQty}
              </span>
            </div>
          ))}
        </Section>

        <Section title="6–8. Quality, Safety & Issues">
          <div className="flex flex-wrap gap-4">
            <Check label="Slump test" checked={qualitySlumpTest} onChange={setQualitySlumpTest} />
            <Check label="Cube casting" checked={qualityCubeCasting} onChange={setQualityCubeCasting} />
            <Check label="PPE compliance" checked={safetyPpeCompliance} onChange={setSafetyPpeCompliance} />
            <Check label="Toolbox talk" checked={safetyToolboxTalk} onChange={setSafetyToolboxTalk} />
            <Check label="Material shortage" checked={issueMaterialShortage} onChange={setIssueMaterialShortage} />
          </div>
        </Section>

        <Section title="9. Plan for next day">
          <textarea
            value={nextDayActivities}
            onChange={(e) => setNextDayActivities(e.target.value)}
            rows={3}
            className={`${INPUT} w-full`}
            placeholder="Scheduled activities…"
          />
        </Section>

        <Section title="Site photos">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
            className="text-sm"
          />
          {photoFiles.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {photoFiles.length} photo(s) selected
              {geo ? ` · GPS ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : ''}
            </p>
          )}
        </Section>

        <Section title="10. Supervisor signature">
          <input
            value={supervisorSignature}
            onChange={(e) => setSupervisorSignature(e.target.value)}
            className={`${INPUT} w-full`}
            placeholder="Type full name as signature"
          />
        </Section>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={(e) => onSubmit(e, false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => onSubmit(e, true)}
            className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Submit log'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-semibold text-[#1a2744]">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${INPUT} w-full`}
      />
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
