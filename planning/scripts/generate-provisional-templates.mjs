#!/usr/bin/env node
/** Generate provisional templates (industry-informed; replace when Abraham uploads). */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'provisional');

const H = (title, formId, notes = '') =>
  `# ${title}\n\n> **Status: PROVISIONAL** — Industry-informed draft for propA3 build. Replace when Abraham provides authoritative version.\n> **Form ID:** \`${formId}\`\n> **Policy:** Show UI badge “Provisional template — pending client document”.\n${notes}\n---\n\n`;

const files = {
  'TENANCY_AGREEMENT.md':
    H(
      'Tenancy Agreement (Provisional)',
      'FORM_TENANCY_AGREEMENT',
      '> Informed by common Nigerian residential tenancy practice; counsel review before production legal use.',
    ) +
    `## Parties\n| Field | Value |\n|-------|-------|\n| Landlord / Owner | |\n| Managing Agent | Triple A Realty / A. Laucarie Consulting (as appointed) |\n| Tenant | |\n| Guarantor | |\n| Property / Unit address | |\n| Property type | |\n\n## Term & rent\n| Field | Value |\n|-------|-------|\n| Commencement date | |\n| Expiry date | |\n| Fixed rent (per annum) | ₦ |\n| Payment due date | |\n| Payment mode | |\n| Caution / security deposit | ₦ |\n| Service charge (per annum) | ₦ |\n| Agency fee | Configurable (see offer) |\n| Legal fee | Configurable |\n\n## Responsibilities (provisional matrix — replace with Abraham agreement)\n| Area | Landlord | Tenant | Facility Manager |\n|------|----------|--------|------------------|\n| Structural (roof, walls, foundation) | Primary | Report defects | Coordinate |\n| Major plumbing / electrical | Primary | Report | Coordinate / escalate |\n| Minor internal repairs / cleanliness | — | Primary | Advise |\n| Service-charge funded works | Fund via SC | — | Execute within available SC |\n| Works exceeding available SC | Approve/fund | — | Escalate to landlord |\n\n## Occupancy rules (placeholders)\nQuiet enjoyment; no unauthorized subletting; no structural alteration without written consent; utilities as agreed.\n\n## Signatures\nLandlord/Agent · Tenant · Guarantor · Date · Witness (optional)\n`,

  'FM_LANDLORD_AGREEMENT.md':
    H(
      'Facility Manager – Landlord Engagement Agreement (Provisional)',
      'FORM_FM_LANDLORD_AGREEMENT',
      '> Aligns with Doc 11 PM proposal + industry practice. Maintenance spend boundary = available service charge (Abraham CONFIRMED).',
    ) +
    `## Parties & property\nOwner · Manager · Property · Term (e.g. 1 year renewable)\n\n## Scope of services\n1. Tenant acquisition & screening\n2. Rent collection & remittance\n3. Maintenance & repairs coordination\n4. Lease administration & renewals\n5. Financial reporting\n\n## Fees (defaults from Abraham EXTRACTED — configurable)\n| Fee | Default |\n|-----|--------|\n| Letting fee (new tenant) | 10% of gross rent |\n| Management fee | Agreed % of gross yearly rent collected |\n| Agency / Legal on application | Configurable (Doc 12: 20% Agency+Legal) |\n\n## Authority\nAdvertise + signage · Sign tenancies within limits · Spend within available SC; above → landlord approval\n\n## Signatures\nOwner · Manager · Dates\n`,

  'OFFER_ACCEPTANCE.md':
    H('Offer Acceptance (Provisional)', 'FORM_OFFER_ACCEPTANCE') +
    `## Reference\nOffer letter ref · Property/unit · Applicant · Offer date · Acceptance deadline\n\n## Acceptance\nI/We accept the Offer Letter terms (rent, caution, SC, professional fees).\n\nAccepted rent ₦ · Caution ₦ · SC ₦ · Tenant signature · Date · Agent ack\n`,

  'TENANT_EVALUATION_SCORES.md':
    H(
      'Tenant Evaluation Scores (Provisional bands)',
      'FORM_TENANT_EVALUATION',
      '> Scoring method CONFIRMED. Bands PROVISIONAL until Abraham defines pass marks.',
    ) +
    `## Scores (CONFIRMED)\n| Criterion | Score 0–10 |\n|-----------|------------|\n| Compatibility | |\n| Ability to pay | |\n| Vacating reason | |\n| Guarantor | |\n| Average (system) | (sum)/4 |\n\n## Provisional bands (editable)\n| Average | Label |\n|---------|-------|\n| ≥ 7.5 | Preferred |\n| 5.0–7.4 | Acceptable / further review |\n| < 5.0 | Likely reject |\n\nDecision: Accepted · Rejected · Further review · Notes\n`,

  'MAINTENANCE_REQUEST.md':
    H('Maintenance Request (Provisional)', 'FORM_MAINTENANCE_REQUEST', '> Photo required (CONFIRMED).') +
    `Request No · Date/time · Property · Unit · Tenant · Contact · Component\nDescription · Photos (required) · Urgency\nFM triage: minor remote? · Resolution · Or artisan + responsibility (FM/Landlord/Tenant)\n`,

  'MAINTENANCE_WORK_ORDER.md':
    H('Maintenance Work Order (Provisional)', 'FORM_MAINTENANCE_WORK_ORDER') +
    `WO No · Request ref · Scope · Tools/materials · Labour ₦ · Materials ₦ · Service fee excl materials · 2.5% if Services · Within SC? · Landlord approval if over · Artisan · Evidence · Tenant confirm · Invoice\n`,

  'MAINTENANCE_INVOICE.md':
    H('Maintenance Invoice (Provisional)', 'FORM_MAINTENANCE_INVOICE') +
    `Invoice No · Bill to · WO ref · Labour · Materials · 2.5% on labour if applicable · Total · Payment status\n`,

  'SERVICE_CHARGE_STATEMENT.md':
    H('Service Charge Statement (Provisional)', 'FORM_SERVICE_CHARGE_STATEMENT', '> SC balance = spend boundary (CONFIRMED).') +
    `Period · Opening · Levies · Expenditure · Closing available · Line register\n`,

  'LANDLORD_REMITTANCE.md':
    H('Landlord Remittance Advice (Provisional)', 'FORM_LANDLORD_REMITTANCE') +
    `Period · Gross rent · Expenses · Net (= Gross − expenses) · Date · Bank · Refs\n`,

  'RENEWAL_NOTICE.md':
    H('Tenancy Renewal Reminder (Provisional)', 'FORM_RENEWAL_NOTICE', '> 3-month and 1-month (CONFIRMED).') +
    `Notice type · Tenant · Unit · Expiry · Rent · Action · Reply-by\n`,

  'POSSESSION_ARREARS_NOTICE.md':
    H(
      'Arrears / Possession Notice (Provisional)',
      'FORM_POSSESSION_NOTICE',
      '> Legal wording needs counsel/Abraham before production.',
    ) +
    `Type · Tenant · Amount · Period · Deadline · Consequences (counsel) · Service method\n`,

  'PROPERTY_LISTING.md':
    H('Property Sale / JV Listing (Provisional)', 'FORM_PROPERTY_LISTING') +
    `Source propA3/external · Sale/JV · Type · Title · Density · Location fields · Utilities · Photos · Price · Agent\n`,

  'BUYER_INTEREST.md':
    H('Buyer Show Interest → CRM (Provisional)', 'FORM_BUYER_INTEREST') +
    `Buyer · Contact · Listing · Property · Source · Listing ownership · Agent → CRM lead\n`,

  'SALES_VIEWING_INSPECTION.md':
    H('Sales Viewing / Inspection + Response (Provisional)', 'FORM_SALES_INSPECTION', '> Mandatory inspection (CONFIRMED).') +
    `Date · Inspector · Buyer · Property · Attendance · Observations · Feedback · Interest · Next action · Platform response time\n`,

  'SALES_OFFER_QUOTATION.md':
    H('Sales Offer / Quotation (Provisional)', 'FORM_SALES_OFFER') +
    `Offer No · Buyer · Property · Price · Validity · Conditions · Response\n`,

  'SALES_AGREEMENT.md':
    H('Sales Agreement (Provisional stub)', 'FORM_SALES_AGREEMENT', '> Stub — Abraham/counsel doc required for production.') +
    `Parties · Property · Price · Deposit · Completion · Title · Signatures\n`,

  'SALES_PAYMENT_SCHEDULE.md':
    H('Sales Payment Schedule (Provisional)', 'FORM_SALES_PAYMENT_SCHEDULE') +
    `Sale ref · Total · Deposit · Instalments · Receipts\n`,

  'COMMISSION_ARRANGEMENT.md':
    H('Commission Arrangement (Provisional)', 'FORM_COMMISSION', '> % blank/configurable — do not invent.') +
    `Internal % · External % · When payable · Split · Signatures\n`,

  'JV_SUBMISSION.md':
    H('Joint Venture Property Submission (Provisional)', 'FORM_JV_SUBMISSION') +
    `Owner · Property · Title · Partnership · Contribution · Desired share · Docs\n`,

  'PURCHASE_REQUISITION.md':
    H('Purchase Requisition — Goods (Provisional)', 'FORM_PURCHASE_REQUISITION') +
    `PR No · Project · Item · Why · When · Qty · Cost · BOQ ref · Approvals\n`,

  'PURCHASE_ORDER.md':
    H('Purchase Order (Provisional)', 'FORM_PURCHASE_ORDER') +
    `PO No · PR · Supplier · Lines · Destination · Expected days · Payment before delivery (CONFIRMED pattern) · Approvals\n`,

  'GOODS_RECEIPT_NOTE.md':
    H('Goods Receipt / Delivery Note (Provisional)', 'FORM_GOODS_RECEIPT') +
    `GRN · PO · Invoice · Ordered/received/accepted/rejected · Discrepancies · Store update\n`,

  'SUPPLIER_REGISTRATION.md':
    H('Supplier / OEM Registration (Provisional)', 'FORM_SUPPLIER_REGISTRATION') +
    `Name · CAC · Tax · Address · Contacts · Categories · Bank · Status\n`,

  'SUPPLIER_EVALUATION.md':
    H('Supplier Performance Review (Provisional)', 'FORM_SUPPLIER_PERFORMANCE') +
    `Quality · Delivery · Price · Responsiveness (1–5) · Overall · Retain/replace\n`,

  'ARTISAN_KYC.md':
    H('Artisan / Professional KYC (Provisional)', 'FORM_ARTISAN_KYC', '> Fields CONFIRMED.') +
    `Name · Business · CAC · NIN · ID · Addresses · Phone · Guarantor + phone · Trades\n`,

  'SERVICE_REQUEST.md':
    H('Service Request (Provisional)', 'FORM_SERVICE_REQUEST', '> Photo CONFIRMED.') +
    `Problem · Photo · Component · Work · Tools/materials · Artisan type · Notify\n`,

  'ARTISAN_ESTIMATE.md':
    H('Artisan Estimate (Provisional)', 'FORM_ARTISAN_ESTIMATE') +
    `Labour ₦ · Materials ₦ · Days · 2.5% on labour only · Approval\n`,

  'WORK_COMPLETION.md':
    H('Work Completion (Provisional)', 'FORM_WORK_COMPLETION') +
    `Ref · Date · Evidence · Artisan · User confirm before pay (CONFIRMED)\n`,

  'USER_SATISFACTION_RATING.md':
    H('User Satisfaction Rating (Provisional)', 'FORM_USER_SATISFACTION', '> Default 1–5 configurable.') +
    `Satisfactory Y/N · Rating 1–5 · Feedback\n`,

  'MATERIAL_SCHEDULE.md':
    H('Material Schedule (Provisional)', 'FORM_MATERIAL_SCHEDULE') +
    `| S/N | Material | Spec | Unit | Qty | BOQ | WBS | Required date | Source | Status |\n`,

  'PERSONNEL_LOG.md':
    H('Personnel Log (Provisional)', 'FORM_PERSONNEL_LOG') +
    `| Name | Role/Trade | Planned days | Actual | Performance | Supervisor |\n`,

  'SUBCONTRACTOR_AGREEMENT.md':
    H(
      'Subcontractor / Works Agreement (Provisional)',
      'FORM_WORKS_CONTRACT',
      '> ~10% works fee CONFIRMED commercially — confirm in contract text.',
    ) +
    `Parties · Project · Scope · Sum · Duration · Mobilisation · Milestones · IVC · Retention · HSE · Signatures\n`,

  'PROJECT_HANDOVER.md':
    H('Project Handover Pack (Provisional)', 'FORM_HANDOVER') +
    `UAT · Fitness cert · Keys · As-builts · O&M · Warranties · Snags · Payments · Property created Y/N · Signatures\n`,
};

await mkdir(dir, { recursive: true });
for (const [name, body] of Object.entries(files)) {
  await writeFile(path.join(dir, name), body.trim() + '\n', 'utf8');
}
console.log('Wrote', Object.keys(files).length, 'files to', dir);
