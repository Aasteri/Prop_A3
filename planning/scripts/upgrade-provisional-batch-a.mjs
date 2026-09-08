#!/usr/bin/env node
/**
 * Upgrade remaining provisional templates to production-default quality.
 */
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'provisional');
const hdr = (title, id, extra = '') =>
  `# ${title} — Production Default\n\n> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.\n> **Form ID:** \`${id}\`\n${extra}\n---\n\n`;

const files = {};

files['OFFER_ACCEPTANCE.md'] = hdr('Offer Acceptance', 'FORM_OFFER_ACCEPTANCE', '> Follows Offer Letter (Doc 10 EXTRACTED).') + `
## 1. Reference

| Field | Value |
|-------|-------|
| Acceptance No. | \`OAC-{YYYY}-{SEQ}\` |
| Offer letter ref | Required |
| Property / unit | |
| Applicant / tenant | |
| Offer date | |
| Acceptance deadline | |
| Accepted at | datetime |

## 2. Accepted commercial terms (copied from offer, editable only with audit)

| Line | Amount ₦ | Payee account |
|------|----------|---------------|
| Rent (per annum) | | Landlord |
| Caution (one-off) | | Landlord |
| Management fee | | Management |
| Legal fee | | Management |
| Service charge | | Management |
| Estate surcharge (if any) | | As offer |
| Agency fee | | Agency |

## 3. Declarations

1. I have read and accept the Offer Letter terms and conditions.  
2. I understand this acceptance is not yet the Tenancy Agreement until executed.  
3. I agree to pay the sums listed to the stated accounts by the due dates.

## 4. Signatures

| Party | Name | Signature | Date |
|-------|------|-----------|------|
| Tenant | | | |
| Agent acknowledgment | | | |

## 5. App model

\`\`\`
offer_acceptances: id, offer_letter_id, tenant_id, accepted_at, status[pending|accepted|expired|withdrawn]
\`\`\`
`;

files['TENANT_EVALUATION_SCORES.md'] = hdr(
  'Tenant Evaluation Scores',
  'FORM_TENANT_EVALUATION',
  '> Method CONFIRMED by Abraham. Default bands included so the product works without further input; Owner may override per property.',
) + `
## 1. Header

| Field | Value |
|-------|-------|
| Evaluation No. | \`TEV-{YYYYMM}-{SEQ}\` |
| Application ref | Required |
| Property / unit | |
| Evaluator (FM) | Required — tenant does **not** self-score |
| Evaluation date | |

## 2. Scores (CONFIRMED)

| # | Criterion | Guidance | Score (0–10) |
|---|-----------|----------|--------------|
| 1 | Compatibility of tenant/use with property | Family size vs unit size, intended use, pressure on facilities | |
| 2 | Ability to pay | Employment/business; market income knowledge allowed | |
| 3 | Reason for vacating previous property | From application + investigation | |
| 4 | Guarantor | Character, reliability, ability to stand for obligations | |

**System average** = (C1+C2+C3+C4) / 4 — display to 1 decimal.

## 3. Default decision bands (PRODUCTION DEFAULT — configurable)

| Average | Decision label | Default system action |
|---------|----------------|----------------------|
| ≥ 7.5 | Preferred | Recommend Accept |
| 6.0 – 7.4 | Acceptable | Accept allowed; FM may request further review |
| 4.0 – 5.9 | Borderline | Further review required |
| < 4.0 | Unsuitable | Recommend Reject |

FM may override with mandatory reason code.

## 4. Internal notes (never shown to applicant)

Investigation notes · Landlord preferences applied · References checked

## 5. Decision

| Field | Value |
|-------|-------|
| Decision | Accepted · Rejected · Further review |
| Override used? | Y/N + reason |
| Next step | Issue offer · Notify reject · Request docs |

## 6. App model

\`\`\`
tenant_evaluations: id, application_id, evaluator_id, c1, c2, c3, c4, average, decision, notes_internal
\`\`\`
`;

files['MAINTENANCE_INVOICE.md'] = hdr('Maintenance Invoice', 'FORM_MAINTENANCE_INVOICE') + `
## 1. Header

| Field | Value |
|-------|-------|
| Invoice No. | \`MINV-{YYYY}-{SEQ}\` |
| Date | |
| Work order ref | Required |
| Bill to | SC ledger · Landlord · Tenant (if liable) |
| Property / unit | |

## 2. Lines

| Description | Labour ₦ | Materials ₦ | Line total ₦ |
|-------------|----------|-------------|--------------|
| | | | |

| Summary | ₦ |
|---------|---|
| Labour subtotal | |
| Materials subtotal | |
| Platform fee 2.5% on labour (if Services) | |
| Tax (if configured) | |
| **Grand total** | |

## 3. Payment

| Field | Value |
|-------|-------|
| Payable to | Artisan / firm bank details |
| Payment blocked until | Tenant confirmation = Yes |
| Paid at | |
| Payment ref | |

## 4. App model

\`\`\`
maintenance_invoices: id, work_order_id, bill_to_type, labour, materials, platform_fee, total, status
\`\`\`
`;

files['SERVICE_CHARGE_STATEMENT.md'] = hdr(
  'Service Charge Statement',
  'FORM_SERVICE_CHARGE_STATEMENT',
  '> Available balance = FM maintenance spend ceiling (Abraham CONFIRMED).',
) + `
## 1. Header

| Field | Value |
|-------|-------|
| Statement No. | \`SCS-{PROPERTY}-{YYYY}-{MM}\` |
| Property | |
| Period start / end | |
| Opening balance | ₦ |
| Levies received this period | ₦ |
| Expenditure this period | ₦ |
| Closing **available** balance | ₦ |
| Reserved / held (optional) | ₦ |
| Notes on unspent treatment | Default: remains credited to property SC account |

## 2. Ledger lines

| Date | Description | WO/Ref | Debit ₦ | Credit ₦ | Running balance ₦ | Evidence |
|------|-------------|--------|---------|----------|-------------------|----------|
| | | | | | | |

## 3. App model

\`\`\`
service_charge_accounts: id, property_id, balance_available, balance_reserved
service_charge_entries: id, account_id, date, description, debit, credit, work_order_id, media_url
\`\`\`
`;

files['LANDLORD_REMITTANCE.md'] = hdr('Landlord Remittance Advice', 'FORM_LANDLORD_REMITTANCE') + `
## 1. Header

| Field | Value |
|-------|-------|
| Remittance No. | \`REM-{YYYYMM}-{SEQ}\` |
| Period | |
| Property | |
| Landlord | |
| Prepared by / Approved by | |

## 2. Computation

| Item | ₦ |
|------|---|
| Gross rent collected | |
| Other receipts | |
| **Gross total** | |
| Less: approved expenses (itemised below) | |
| **Net remittance** | |

## 3. Expense schedule

| Date | Description | Amount ₦ | Approval |

## 4. Payment

| Field | Value |
|-------|-------|
| Remittance date | |
| Bank / account | |
| Transfer ref | |
| Landlord acknowledgment | |

## 5. App model

\`\`\`
landlord_remittances: id, property_id, landlord_id, period_start, period_end, gross, expenses, net, paid_at
\`\`\`
`;

files['RENEWAL_NOTICE.md'] = hdr(
  'Tenancy Renewal Reminder',
  'FORM_RENEWAL_NOTICE',
  '> Timing CONFIRMED: at least 3 months and 1 month before expiry.',
) + `
## Template body

**Subject:** Reminder — Tenancy expiry ({3 months|1 month}) — {Property/Unit}

Dear {Tenant Name},

This is a formal reminder that your tenancy for **{Property/Unit}** is due to expire on **{Expiry Date}**.

Current rent: **₦{Rent}** per annum · Service charge: **₦{SC}**

Please contact the Facility Manager on or before **{Reply-by Date}** to:
1. Confirm renewal and payment arrangements, or  
2. Give notice that you will vacate and schedule move-out inspection.

Failure to renew or vacate may result in holdover procedures and recovery action.

Yours faithfully,  
{Agent Name} · {Firm} · {Date}

## Fields

notice_type[three_month|one_month], tenancy_id, sent_at, channel[email|sms|print], reply_by
`;

files['POSSESSION_ARREARS_NOTICE.md'] = hdr(
  'Arrears / Possession Notice',
  'FORM_POSSESSION_NOTICE',
  '> Production-ready operational notice. For court recovery, engage counsel to align with FCT/state procedure.',
) + `
## 1. Types

| Type | When used |
|------|-----------|
| \`rent_arrears\` | Rent outstanding beyond grace period |
| \`holdover\` | Occupancy after expiry without renewal/payment |
| \`intention_to_recover\` | Pre-recovery formal notice (counsel may customise wording) |

## 2. Fields

| Field | Value |
|-------|-------|
| Notice No. | \`NTC-{YYYY}-{SEQ}\` |
| Type | |
| Tenant / property / unit | |
| Amount outstanding ₦ | |
| Period covered | |
| Prior reminders sent | dates |
| Remedy deadline | |
| Service method | Hand · Email · WhatsApp logged · Courier |
| Date served | |
| Server name | |

## 3. Standard arrears wording (default)

You are hereby notified that the sum of **₦{Amount}** is outstanding in respect of rent/charges for **{Property}** covering **{Period}**.

You are required to pay the full outstanding sum on or before **{Deadline}**.

Failure to comply may result in further recovery steps including termination process and recovery of possession in accordance with applicable law and your tenancy agreement.

## 4. App model

\`\`\`
tenancy_notices: id, tenancy_id, type, amount, deadline, served_at, method, body_snapshot
\`\`\`
`;

files['ARTISAN_KYC.md'] = hdr('Artisan / Professional KYC', 'FORM_ARTISAN_KYC', '> All identity fields CONFIRMED by Abraham; none are universally mandatory if absent — capture what exists.') + `
## 1. Identity

| Field | Required | Notes |
|-------|----------|-------|
| Full name | Yes | |
| Business name | No | Where applicable |
| Phone | Yes | Primary |
| Alt phone | No | |
| Email | No | |
| Residential address | Yes | |
| Business location | No | |
| Trades / skills | Yes | Multi-select: mason, carpenter, iron bender, welder, electrician, plumber, gypsum, solar, architect, SE, other |

## 2. KYC documents (attach what applies)

| Document | Number / details | File |
|----------|------------------|------|
| NIN | | |
| Voter’s Card / other ID | | |
| CAC registration | | |
| Passport photo | | |

## 3. Guarantor (CONFIRMED)

| Field | Required |
|-------|----------|
| Guarantor full name | Yes |
| Guarantor phone | Yes |
| Relationship / details | Recommended |
| Guarantor address | Recommended |

## 4. Banking & compliance

Bank name · Account name · Account number · Tax ID optional · Status: pending_review · approved · suspended · blacklisted

## 5. Performance rollup (system)

Jobs completed · Avg rating · On-time % · Rework count · Total paid

## 6. App model

\`\`\`
artisan_profiles: id, full_name, business_name, phone, nin, cac, address, business_address,
  guarantor_name, guarantor_phone, status, avg_rating
artisan_trades: artisan_id, trade_code
artisan_documents: artisan_id, doc_type, file_url
\`\`\`
`;

files['SERVICE_REQUEST.md'] = hdr('Service Request (Artisan / Professional)', 'FORM_SERVICE_REQUEST', '> Photo + description CONFIRMED.') + `
## 1. Header

| Field | Rules |
|-------|-------|
| Request No. | \`SRQ-{YYYYMM}-{SEQ}\` |
| Source | Maintenance · Project · Property · Standalone |
| Linked maintenance request / project | Optional |
| Requester | |
| Property / project / site | |

## 2. Problem pack (required)

| Field | Rules |
|-------|-------|
| Description | Required |
| Item / component | Required |
| Work required | Required |
| Photo(s) | **≥ 1 required** |
| Suggested tools | Optional |
| Suggested materials | Optional |
| Required artisan trade | Required from registry |

## 3. Workflow

Select artisan → Notify → Assess → Estimate → Funding/approval → Assign → Complete → User confirm + rating → Invoice → Pay (2.5% on service fee excl. materials) → Performance record

## 4. App model

\`\`\`
service_requests: id, number, trade_code, description, component, status, artisan_id, labour_amount, materials_amount
service_request_media: request_id, url
\`\`\`
`;

files['ARTISAN_ESTIMATE.md'] = hdr('Artisan Estimate / Quotation', 'FORM_ARTISAN_ESTIMATE') + `
## Fields

| Field | Rules |
|-------|-------|
| Estimate No. | \`EST-{YYYYMM}-{SEQ}\` |
| Service request ref | Required |
| Labour / service fee ₦ | Required — **chargeable base for 2.5%** |
| Materials ₦ | Excluded from 2.5% |
| Duration (days/hours) | |
| Validity date | |
| Notes / exclusions | |
| Platform fee preview | 2.5% × labour |
| Approval | Pending · Approved · Rejected |

## App model

\`\`\`
artisan_estimates: id, service_request_id, labour, materials, days, valid_until, status
\`\`\`
`;

files['WORK_COMPLETION.md'] = hdr('Work Completion Record', 'FORM_WORK_COMPLETION') + `
## Fields

| Field | Rules |
|-------|-------|
| Completion No. | \`WCC-{YYYYMM}-{SEQ}\` |
| WO / Service request | Required |
| Completed at | |
| Evidence photos | ≥ 1 |
| Artisan declaration | Work completed per scope |
| User confirmation | Required before payment |
| Rating | 1–5 |
| Feedback | |

Status: \`completed_pending_confirm\` → \`confirmed\` → unlock payment
`;

files['USER_SATISFACTION_RATING.md'] = hdr(
  'User Satisfaction Rating',
  'FORM_USER_SATISFACTION',
  '> Default scale 1–5 stars. Org setting may change scale later without schema break.',
) + `
## Fields

| Field | Rules |
|-------|-------|
| Job ref (WO / SRQ) | Required |
| Completed satisfactorily | Y/N |
| Rating | Integer 1–5 (default) |
| Feedback | Optional text |
| Submitted at | |
| Submitted by | Tenant / client / PM |

Payment release requires satisfactorily = Y **or** explicit waive by FM with reason.
`;

await Promise.all(Object.entries(files).map(([n, b]) => writeFile(path.join(dir, n), b.trim() + '\n')));
console.log('Batch A upgraded', Object.keys(files).length);
