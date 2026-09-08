#!/usr/bin/env node
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'provisional');
const hdr = (title, id, extra = '') =>
  `# ${title} — Production Default\n\n> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.\n> **Form ID:** \`${id}\`\n${extra}\n---\n\n`;

const files = {};

files['PROPERTY_LISTING.md'] = hdr('Property Listing (Sale / JV)', 'FORM_PROPERTY_LISTING', '> Capture list aligned with Master BRD Part H (CONFIRMED).') + `
## 1. Listing identity

| Field | Rules |
|-------|-------|
| Listing No. | \`LST-{YYYY}-{SEQ}\` |
| Listing source | \`propa3\` · \`external_agent\` |
| Listed by (agent user) | Required |
| External agent org | Required if external |
| Purpose | Sale · JV · Both |
| Status | draft · published · under_offer · sold · withdrawn · jv_active |

## 2. Classification

| Field | Values |
|-------|--------|
| Category | Residential · Commercial |
| Land/building | Vacant land · Building · Occupied land/property |
| Density | low · medium · high |
| Title type | C of O · R of O · None · Other (text) |

## 3. Location & physical

| Field | Rules |
|-------|-------|
| Location name / estate | |
| Neighbourhood / character | |
| Access road / road condition | |
| Year built | Optional |
| GPS coordinates | lat/lng |
| Electricity / water / central sewage | Available · Not · Partial |
| Door type / window type | |
| Description | Rich text |
| Asking price ₦ | |
| Price negotiable | Y/N |

## 4. Media & documents

Photos (min 3 recommended) · Title docs · Survey · Other attachments

## 5. App model

\`\`\`
listings: id, number, source, purpose, category, title_type, density, price, status, agent_id, property_id
listing_media: listing_id, url, kind
\`\`\`
`;

files['BUYER_INTEREST.md'] = hdr('Buyer Interest (Show Interest → CRM)', 'FORM_BUYER_INTEREST', '> CONFIRMED: interest creates CRM lead; branch on propA3 vs external listing.') + `
## Fields

| Field | Rules |
|-------|-------|
| Interest No. | \`INT-{YYYYMM}-{SEQ}\` |
| Listing | Required |
| Buyer name | Required |
| Phone | Required |
| Email | Optional |
| Message | Optional |
| Source channel | Web · Portal · Referral |
| Listing ownership snapshot | propA3 · external (immutable copy) |
| Assigned agent | System: propA3 agent or notify external |
| CRM lead id | Created on submit |
| Status | new · inspection_requested · inspecting · responded · negotiating · won · lost |

## Automation

On create → CRM lead → if propA3 assign agent else notify external agent → require physical inspection → require platform response.
`;

files['SALES_VIEWING_INSPECTION.md'] = hdr(
  'Sales Viewing / Physical Inspection',
  'FORM_SALES_INSPECTION',
  '> Physical inspection MANDATORY; platform response REQUIRED (Abraham CONFIRMED).',
) + `
## 1. Request

| Field | Value |
|-------|-------|
| Inspection No. | \`VIN-{YYYYMM}-{SEQ}\` |
| Interest / CRM lead | Required |
| Property / listing | |
| Proposed slots | datetime multi |
| Confirmed slot | |
| Inspector / agent | |

## 2. Attendance & outcome (platform response)

| Field | Rules |
|-------|-------|
| Inspection occurred | Y/N — if N, reason required |
| Actual datetime | |
| Buyer attended | Y/N |
| Other attendees | |
| Observations | Required if occurred |
| Buyer feedback | |
| Interest level | Hot · Warm · Cold · Not interested |
| Next action | Follow-up · Offer · Disqualify · Re-schedule |
| Photos | Optional |
| Response submitted at | Required to close inspection step |
| Submitted by | Agent |

## 3. Status

\`requested\` → \`scheduled\` → \`completed_response_logged\` → \`follow_up\`
`;

files['SALES_OFFER_QUOTATION.md'] = hdr('Sales Offer / Quotation', 'FORM_SALES_OFFER') + `
## Fields

| Field | Rules |
|-------|-------|
| Offer No. | \`SOF-{YYYY}-{SEQ}\` |
| Listing / property | |
| Buyer | |
| Offer price ₦ | |
| Validity until | |
| Conditions | Financing, inspection contingencies, etc. |
| Deposit required ₦ | |
| Payment terms summary | |
| Prepared by | |
| Buyer response | Pending · Accepted · Countered · Rejected |
| Counter price | Optional |

Linked to CRM stage after inspection response.
`;

files['SALES_AGREEMENT.md'] = hdr(
  'Contract of Sale (Operational Default)',
  'FORM_SALES_AGREEMENT',
  '> Full conveyancing should still involve counsel for title transfer; this is the operational commercial agreement captured in-app.',
) + `
## 1. Parties & property

Vendor · Purchaser · Property description · Title type · Listing ref

## 2. Consideration

| Field | Value |
|-------|-------|
| Purchase price ₦ | |
| Deposit ₦ / % | |
| Balance ₦ | |
| Completion / closing date | |

## 3. Vendor warranties (default)

Vendor warrants authority to sell; property free of undisclosed encumbrances known to vendor; to deliver vacant possession on completion unless agreed otherwise.

## 4. Purchaser obligations

Pay per schedule; accept title process; pay agreed fees/taxes as allocated.

## 5. Allocations

Outgoings apportioned as of completion date · Risk passes on completion · Keys/handover checklist

## 6. Default & termination

Failure to pay → notice · cure period (configurable, default 14 days) · termination/forfeiture per schedule

## 7. Signatures

Vendor · Purchaser · Witnesses · Date · Counsel acknowledgment optional

## 8. App model

\`\`\`
sale_agreements: id, listing_id, buyer_id, vendor_id, price, deposit, completion_date, status
\`\`\`
`;

files['SALES_PAYMENT_SCHEDULE.md'] = hdr('Sales Payment Schedule', 'FORM_SALES_PAYMENT_SCHEDULE') + `
## Header

Sale agreement ref · Total price · Currency NGN

## Instalments

| # | Due date | Description | % | Amount ₦ | Status | Receipt ref |
|---|----------|-------------|---|----------|--------|-------------|
| 1 | | Deposit | | | | |
| 2 | | Instalment | | | | |
| 3 | | Balance on completion | | | | |

Receipts use \`PAYMENT_RECEIPT.md\` template.
`;

files['COMMISSION_ARRANGEMENT.md'] = hdr(
  'Commission Arrangement',
  'FORM_COMMISSION',
  '> Defaults provided for operations; override per deal. Not invented as Abraham mandate — clearly marked defaults.',
) + `
## Default schedule (PRODUCTION DEFAULT — editable per org)

| Scenario | Default commission |
|----------|-------------------|
| propA3 sole listing | 5% of sale price to firm (configurable) |
| External agent listing | Split: external 3% / propA3 2% (configurable) |
| Co-brokerage intro | As deal memo |

## Fields

Deal / listing · Gross price · Commission % · Amount · Payee parties · When payable (on deposit / on completion) · Invoice refs · Signatures

## Rule

Never hard-code hidden fees; always show schedule on deal before acceptance.
`;

files['JV_SUBMISSION.md'] = hdr('Joint Venture Property Submission', 'FORM_JV_SUBMISSION') + `
## Fields

| Field | Rules |
|-------|-------|
| JV No. | \`JV-{YYYY}-{SEQ}\` |
| Owner name / contact | Required |
| Property address | Required |
| Title type / docs | |
| Land size / building description | |
| Proposed partnership model | Equity · Develop-and-share · Other |
| Owner contribution | Land · Cash · Other |
| Desired return / profit share % | |
| Timeline expectation | |
| Supporting documents | Title, survey, photos |
| Status | submitted · under_review · term_sheet · agreed · rejected |

Commercial term sheet produced as next artefact after review.
`;

files['SUPPLIER_REGISTRATION.md'] = hdr('Supplier / OEM Registration', 'FORM_SUPPLIER_REGISTRATION') + `
## Identity

Legal name · Trading name · CAC · TIN · Registered address · Warehouse address · Contacts (sales, accounts) · Categories (cement, steel, electrical, finishing, OEM devices, other)

## Banking

Bank · Account name · Account number

## Compliance docs

CAC cert · Tax clearance · Catalogue · Price list

## Status

pending_kyc · approved · suspended · blacklisted

## App model

\`\`\`
suppliers: id, legal_name, cac, tin, status, rating_avg
supplier_categories: supplier_id, category_code
\`\`\`
`;

files['SUPPLIER_EVALUATION.md'] = hdr('Supplier Performance Review', 'FORM_SUPPLIER_PERFORMANCE') + `
## Scoring (default equal weights — configurable)

| Criterion | Score 1–5 |
|-----------|-----------|
| Quality | |
| Delivery time | |
| Price competitiveness | |
| Responsiveness | |
| Documentation accuracy | |

Overall = average. Recommendation: retain · probation · replace  
Linked POs in period · Comments · Reviewer · Date
`;

files['MATERIAL_SCHEDULE.md'] = hdr('Material Schedule', 'FORM_MATERIAL_SCHEDULE', '> Links BOQ ↔ WBS ↔ Procurement.') + `
## Header

Project · Phase · Prepared by (QS/PM) · Date · Revision

## Lines

| S/N | Material | Spec/Grade | Unit | Qty | BOQ ref | WBS task | Required-by date | Source | PR/PO ref | Status |
|-----|----------|------------|------|-----|---------|----------|------------------|--------|-----------|--------|
| | | | | | | | | Warehouse · External | | planned·ordered·received·issued |

## App model

\`\`\`
material_schedule_lines: id, project_id, material_name, spec, unit, qty, boq_line_id, wbs_task_id, required_by, status
\`\`\`
`;

files['PERSONNEL_LOG.md'] = hdr('Personnel / Attendance Log', 'FORM_PERSONNEL_LOG') + `
## Header

Project · Date · Shift · Supervisor · Weather (optional)

## Entries

| # | Full name | Role/Trade | Company (internal/sub) | Planned | Time in | Time out | Hours | Performance 1–5 | Notes |
|---|-----------|------------|------------------------|---------|---------|----------|-------|-----------------|-------|

## Daily totals

Headcount · Total hours · Trades present

## App model

\`\`\`
personnel_logs: id, project_id, date, supervisor_id
personnel_log_entries: log_id, person_name, trade, time_in, time_out, performance, notes
\`\`\`
`;

files['SUBCONTRACTOR_AGREEMENT.md'] = hdr(
  'Subcontractor / Works Agreement',
  'FORM_WORKS_CONTRACT',
  '> Connects Procurement Works → Project. Platform works fee ~10% of project cost is a commercial rule (Abraham CONFIRMED) — show on engagement commercials separately from subcontractor contract sum.',
) + `
## 1. Parties & project

Employer (Triple A / Client as applicable) · Subcontractor · Project · Site · Scope summary · Contract documents (BOQ, drawings, specs)

## 2. Commercial

| Field | Value |
|-------|-------|
| Contract sum ₦ | |
| Mobilisation % / amount | |
| Retention % | Default 5% (configurable) |
| Measurement | IVC / milestone |
| Payment cycle | After measurement + approval |

## 3. Time

Start · Completion · Liquidated damages (configurable / optional)

## 4. Obligations

Execute per drawings · HSE compliance · Daily cooperation with site log · No assignment without consent · Defects liability period (default 6 months)

## 5. Measurement & payment

Work → Measure → % complete → IVC → Approval → Payment (Abraham monitoring principle)

## 6. Termination

Material breach · insolvency · convenience with notice (configurable)

## 7. Signatures

Employer · Subcontractor · Witness · Date
`;

files['PROJECT_HANDOVER.md'] = hdr('Project Handover Pack', 'FORM_HANDOVER') + `
## 1. Header

Project · Client · Handover date · PM · Site supervisor

## 2. Completion gates

| Gate | Done |
|------|------|
| UAT passed | Y/N + ref |
| Fitness / completion certificate | Y/N + ref |
| Snag list closed | Y/N |
| As-built drawings handed over | Y/N |
| O&M manuals | Y/N |
| Warranties / test certificates | Y/N |
| Keys / access devices schedule | Attached |
| Financial closure (subs/vendors) | Y/N |
| Client satisfaction captured | Y/N |
| Property master record created | Y/N (auto for company-developed) |

## 3. Keys & assets schedule

Item · Qty · Serial · Received by client (sign)

## 4. Outstanding items

Description · Owner · Due date

## 5. Signatures

Client · PM · Witness
`;

await Promise.all(Object.entries(files).map(([n, b]) => writeFile(path.join(dir, n), b.trim() + '\n')));
console.log('Batch B upgraded', Object.keys(files).length);
