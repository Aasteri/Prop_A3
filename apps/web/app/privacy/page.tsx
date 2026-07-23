import { PublicShell } from '@/components/PublicShell';

export default function PrivacyPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
        <h1 className="text-3xl font-semibold text-[#1a2744]">Privacy Policy</h1>
        <p className="text-sm text-slate-500">Last updated: July 2026</p>

        <section className="mt-8 space-y-4 text-slate-700">
          <p>
            Triple A Realty Projects Ltd. (&quot;Triple A&quot;, &quot;we&quot;) operates the Propa3 platform
            at propa3.com. This policy describes how we collect and use personal data in compliance
            with the Nigeria Data Protection Regulation (NDPR).
          </p>

          <h2 className="text-xl font-semibold text-[#1a2744]">Data we collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Contact details when you submit a property inquiry (name, phone, email)</li>
            <li>Account information for client portal access</li>
            <li>Payment proof uploads linked to your invoices</li>
            <li>Construction progress data visible in your client portal</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#1a2744]">Lawful basis</h2>
          <p>
            We process data under contract (client portal services), legitimate interest (CRM follow-up),
            and consent (marketing communications where applicable).
          </p>

          <h2 className="text-xl font-semibold text-[#1a2744]">Your rights</h2>
          <p>
            You may request access, correction, or deletion of your personal data by contacting{' '}
            <a href="mailto:info@triplea.ng" className="text-[#e87722]">info@triplea.ng</a>.
          </p>

          <h2 className="text-xl font-semibold text-[#1a2744]">Contact</h2>
          <p>Triple A Realty Projects Ltd. · Abuja, Nigeria · info@triplea.ng</p>
        </section>
      </div>
    </PublicShell>
  );
}
