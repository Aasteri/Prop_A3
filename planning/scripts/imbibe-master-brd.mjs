#!/usr/bin/env node
/**
 * Imbibe PROPA3 Master Business Requirements into ABRAHAM_MASTER_BUILD_DOCUMENT.md
 * Inserts Parts G–N before Part F and rewrites front matter + Part F.
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTER = path.join(__dirname, '..', 'ABRAHAM_MASTER_BUILD_DOCUMENT.md');
const BRD_PARTS = path.join(__dirname, '..', 'extractions', 'PROPA3_MASTER_BRD_PARTS_G_N.md');

const FRONT_MATTER = `# Abraham / Triple A — Master Build Document (Complete)

> **Single .md file for building Propa3 end-to-end.**  
> Combines: Abraham's verbal process walkthrough · extracted Google Docs/Sheets/infographics · operational form field specs · roles & access · workflows · enums · approval gates · **Master Business Requirements (Project + Property + Sales + Procurement)**.
>
> **Use for:** database schemas, APIs, UI forms, RBAC, automations, client portal, acceptance tests.  
> **Updated:** Sep 8, 2026 (Master BRD imbibe — Property, Sales, Procurement Goods/Services/Works, Artisan KYC, confirmed business rules)  
> **Generated:** Sep 3, 2026  
> **Governance:** Abraham documents > Abraham verbal instructions > Team Charter (\`PROJECT_GOVERNANCE.md\`)  
> **Evidence rules:** Mark every requirement as **CONFIRMED** (client said) · **EXTRACTED** (from Abraham docs) · **PROPOSED** (industry/logical — not client-confirmed) · **WAITING** (document expected — do not invent).

---

## Document Map

| Part | Contents |
|------|----------|
| **A** | [System design — principles, entities, enums, roles, gates, automations](#part-a-system-design) |
| **B** | [Phase-based workflows — 6 phases, user stories, organograms, embedded docs](#part-b-phase-based-workflows-detailed) |
| **C** | [Appendix — full verbatim extractions](#part-c-appendix--full-verbatim-extractions) |
| **D** | [Form field specs](#part-d-form-field-specs-operational-forms) |
| **E** | [Team roles & org structure](#part-e-team-roles--org-structure) |
| **G** | [Property Management — tenancy, scoring, maintenance, remittance](#part-g-property-management) |
| **H** | [Property Sales — listings, CRM interest, inspection, JV](#part-h-property-sales) |
| **I** | [Procurement — Goods / Services / Works + fee rules](#part-i-procurement-goods-services-works) |
| **J** | [Artisan registration & KYC](#part-j-artisan-registration--kyc) |
| **K** | [Cross-module integration](#part-k-cross-module-integration) |
| **L** | [Confirmed business rules (latest client clarifications)](#part-l-confirmed-business-rules-latest-client-clarifications) |
| **M** | [End-to-end journeys (Project → Property → Sales → Maintenance)](#part-m-end-to-end-journeys) |
| **F** | [Gaps — documents expected · do not invent · reconciliation](#part-f-gaps--validation-needed) |

### Phase quick navigation (Part B)

| Phase | Section |
|-------|---------|
| Project Initiation | [B.1](#b1-project-initiation) |
| Project Planning | [B.2](#b2-project-planning) |
| Project Execution | [B.3](#b3-project-execution) |
| Procurement | [B.4](#b4-procurement) |
| Project Monitoring & Controlling | [B.5](#b5-project-monitoring--controlling) |
| Project Closure | [B.6](#b6-project-closure) |

### Module quick navigation (Parts G–M)

| Module | Section |
|--------|---------|
| Property Management | [G](#part-g-property-management) |
| Property Sales | [H](#part-h-property-sales) |
| Procurement (3 categories) | [I](#part-i-procurement-goods-services-works) |
| Artisan KYC | [J](#part-j-artisan-registration--kyc) |
| Integration | [K](#part-k-cross-module-integration) |
| Confirmed rules | [L](#part-l-confirmed-business-rules-latest-client-clarifications) |
| Journeys | [M](#part-m-end-to-end-journeys) |

---
`;

const PART_F = `
# Part F: Gaps — Validation Needed

> **Rule:** Do not invent values for WAITING items. Build with configurable enums / draft schemas; mark UI as "pending client document" where needed. When Abraham uploads a document: extract → gap-reconcile against this Part F → mark **confirmed / contradicted / expanded / new / still unresolved** → then update schemas.

## F.1 Classification of current knowledge

| Class | Meaning | Action for builders |
|-------|---------|---------------------|
| **CONFIRMED** | Client stated explicitly in conversation | Implement as specified |
| **EXTRACTED** | From Abraham Google Docs/Sheets/infographics | Implement field-for-field |
| **PROPOSED** | Industry/logical design, not client-confirmed | Implement only behind feature flags or label as draft; validate before go-live |
| **WAITING** | Client will provide document | Schema stub + attachment slot; no invented clauses/scores/fees beyond CONFIRMED |

## F.2 Documents still expected (priority)

### Property Management — WAITING

| Document | Needed for |
|----------|------------|
| Tenant application form | Finalize FORM_TENANT_APPLICATION fields |
| Tenant selection/evaluation form | Evaluator UI beyond 4×0–10 |
| Tenant scoring document (if separate) | Pass/fail bands — **do not invent** |
| Offer letter | FORM_OFFER_LETTER |
| Offer acceptance | Acceptance workflow |
| Full tenant / facility-manager / landlord agreement | Rights, responsibilities, maintenance matrix — **critical** |
| Tenancy agreement | Contractual terms |
| Move-in inspection form | Expand FORM_MOVE_IN beyond verbal list |
| Move-out inspection form | Compare-to-move-in |
| Maintenance request form | Tenant portal form |
| Maintenance work order | Artisan dispatch |
| Maintenance invoice | Billing |
| Service-charge statement | Accounting of levy |
| Landlord remittance | Remittance report |
| Renewal notices | 3-month / 1-month templates |
| Possession / arrears notices | Legal wording — **do not invent** |

### Sales — WAITING

| Document | Needed for |
|----------|------------|
| Property listing form | Finalize listing fields |
| Buyer enquiry / interest form | CRM intake |
| Inspection / viewing form | Mandatory physical inspection record |
| Inspection feedback form | Post-inspection platform response |
| Offer document | Sales offer |
| Sales quotation | Quotation |
| Sales agreement | Contract |
| Payment schedule | Instalments |
| Receipt | Payment evidence |
| Commission arrangement | Agent commission — **do not invent %** |
| Handover document | Sale closing |
| JV property submission / proposal / agreement | Joint venture pathway |

### Procurement — WAITING

| Document | Needed for |
|----------|------------|
| Purchase requisition | FORM_PURCHASE_REQUISITION |
| Supplier registration | Expand vendor KYC |
| Supplier evaluation | Scoring methodology — **do not invent** |
| Purchase order | FORM_PO |
| Goods receipt / delivery note | GRN |
| Invoice verification | Three-way match |
| Supplier performance review | Scorecard fields |
| Artisan registration / KYC form | Formalize Part J fields |
| Artisan / service request | Photo + description |
| Artisan estimate / quotation | Estimate |
| Work completion form | Completion gate |
| User satisfaction form | Rating scale confirmation |
| Artisan invoice / payment document | Pay after confirmation |

### Works / Construction — WAITING / PARTIAL

| Document | Status |
|----------|--------|
| Contractor / subcontractor agreement | WAITING |
| BOQ template | Verbal only — WAITING upload |
| IVC | EXTRACTED (Doc 6) |
| Milestone / payment schedule | Partial via IVC |
| Inspection / approval forms | EXTRACTED (Doc 4 + pre-pour verbal) |
| Project closeout | EXTRACTED (Doc 7) |
| Handover | Partial / WAITING formal |
| Material schedule | Verbal — WAITING sample |
| Personnel log | Verbal — WAITING format |
| TDP / C of O / Arch / Structural / M&E attach rules | Types CONFIRMED; required-vs-optional WAITING |

## F.3 What we must NOT invent yet

| Area | Do not invent |
|------|----------------|
| Tenant score interpretation | Pass mark, preferred/acceptable/reject bands, weighting |
| Landlord-specific preferences | Hidden criteria content |
| Exact tenancy clauses | Responsibilities matrix |
| Maintenance responsibility matrix | Who pays what |
| Service-charge accounting | Reserved/unspent levy treatment |
| Exact renewal / termination / possession notices | Legal text & timelines beyond 3mo/1mo reminders |
| Sales stages after inspection | Offer → negotiation → agreement → payment → closing |
| Negotiation / sales approval authority | Who can accept |
| Sale payment structure / title transfer | Process |
| Commission structure | Internal or external agent |
| JV commercial structure | Shares, returns |
| Procurement approval hierarchy | Exact chain of command |
| Supplier scoring methodology | Weights |
| Exact artisan payment process | Beyond confirmation-before-pay + 2.5% rule |
| Exact rating scale | Beyond "configurable; 1–5 discussed" |
| Exact notification channels | SMS/email/WhatsApp mix |
| Exact RBAC matrix for every screen | Beyond role lists in Part E |
| Goods procurement service charge % | Not specified |
| VAT / tax on 2.5% / 10% fees | TBD |

## F.4 Confirmed items that ARE buildable now (no wait)

| Rule | Spec |
|------|------|
| Tenant scoring | 4 criteria × 0–10; FM assigns; system averages; tenant does not self-score |
| Maintenance spend boundary | Available service-charge funds — not fixed ₦ threshold; escalate if over |
| Sales interest | Show Interest → CRM; identify propA3 vs external agent listing |
| Physical inspection | Mandatory for every buyer interest path |
| Post-inspection | Platform response/update required |
| Procurement categories | Goods · Services · Works |
| Services fee | 2.5% of service/labour fee **excluding materials** |
| Professionals fee | 2.5% of professional fee |
| Works fee | ~10% of total project cost |
| Artisan service request | Photo + description + component + work required |
| Completion before payment | User confirmation + feedback/rating |
| Artisan KYC | Name, business, CAC, NIN/ID, address, phone, guarantor + phone |
| Cost model (projects) | Distinguish estimated · approved budget · actual · committed · remaining |
| Project → Property | Completed project registers/creates property asset for management/sale |

## F.5 Open stubs (build with draft schema)

| Item | Status | Action |
|------|--------|--------|
| BOQ template | Verbal | Abraham upload |
| Material Schedule | Verbal (A.7) | Confirm columns |
| Material Request / PO / GRN | Draft / missing | Upload templates |
| Personnel log | Verbal | Confirm format |
| Properties module depth | Expanded in Part G — agreements WAITING | Extract agreement when received |
| Sales pipeline post-inspection | PROPOSED in Part H | Validate with sales docs |
| UAT / Fitness certificate | Draft | Confirm forms |
| Management plans (9–10) | Named | Templates WAITING |

## F.6 Gap reconciliation procedure (when documents arrive)

1. Extract document verbatim into \`planning/extractions/\`.
2. Map each field/clause to Part G / H / I / J / B.
3. Tag each item: **confirmed** | **contradicted** | **expanded** | **new** | **still unresolved**.
4. Update Form Registry (A.7) and this Part F.
5. Do **not** rewrite the master from scratch.

---

*End of Abraham / Triple A Master Build Document*
`;

async function main() {
  const master = await readFile(MASTER, 'utf8');
  const brdParts = await readFile(BRD_PARTS, 'utf8');

  // Strip old front matter through first "---\n\n# Part A"
  const partAIdx = master.indexOf('# Part A: System Design');
  if (partAIdx < 0) throw new Error('Part A not found');

  const partFIdx = master.indexOf('# Part F: Gaps — Validation Needed');
  if (partFIdx < 0) throw new Error('Part F not found');

  // Body from Part A through end of Part E (everything before Part F)
  const bodyThroughE = master.slice(partAIdx, partFIdx).trimEnd();

  // Patch A.2 Three Pillars section if present
  let body = bodyThroughE;
  const oldPillars = `## A.2 Three Pillars (Interconnected)

\`\`\`
         CLIENT
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
 PROPERTY ◄─ PROJECT ─► PROCUREMENT
 (land)      (build)      (materials)
\`\`\``;

  const newPillars = `## A.2 Operating System Pillars (Interconnected)

> **CONFIRMED architecture:** propA3 is one connected OS — Projects · Properties (Sales + Management) · Procurement (Goods / Services / Works) · Finance · CRM · Documents · Notifications · Reporting. See [Part K](#part-k-cross-module-integration) and [Part M](#part-m-end-to-end-journeys).

\`\`\`
                         PROPA3
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     PROJECTS          PROPERTIES         PROCUREMENT
        │                  │                  │
        │          ┌───────┴───────┐          │
        │        SALES        MANAGEMENT      │
        │      (listings)   (units/tenancy)   │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                        FINANCE ← CRM ← DOCUMENTS ← NOTIFICATIONS ← REPORTING

Procurement categories (CONFIRMED):
  GOODS (materials) · SERVICES (artisans/professionals, 2.5%) · WORKS (~10% of project cost)
\`\`\``;

  if (body.includes(oldPillars)) {
    body = body.replace(oldPillars, newPillars);
  }

  // Expand A.3 entities — append if not already expanded
  if (!body.includes('tenant_evaluation_score')) {
    body = body.replace(
      '| listing | Property for sale |',
      `| listing | Property for sale / JV |
| unit | Unit within a multi-unit property |
| tenant | Occupant applicant or active tenant |
| tenancy | Agreement linking tenant ↔ unit |
| tenant_application | Screening application |
| tenant_evaluation_score | FM scores: 4 criteria × 0–10 + system average |
| offer_letter | Pre-tenancy offer (rent, service charge, deposit) |
| move_in_inspection / move_out_inspection | Condition baseline & exit compare |
| maintenance_request | Tenant/FM corrective maintenance ticket |
| service_charge_ledger | Levy balance = spend boundary for FM |
| landlord_remittance | Gross rent − expenses → landlord |
| artisan_profile | Registered service provider + KYC + guarantor |
| purchase_requisition | Goods need → PR |
| purchase_order | Approved PO to supplier |
| goods_receipt | Delivery verification vs PO/invoice |
| service_request | Services procurement (photo + artisan) |
| works_contract | Works procurement linked to project |
| buyer_interest | Sales "Show Interest" → CRM lead |
| sales_inspection | Mandatory physical viewing record |
| jv_submission | Joint-venture property pathway (fields WAITING) |`
    );
  }

  // Enrich A.7 registry with property/sales/procurement forms if missing
  if (!body.includes('FORM_TENANT_EVALUATION')) {
    const insertAfter = '| FORM_VENDOR | Vendor Directory | Procurement | Authoritative |';
    const extraForms = `| FORM_VENDOR | Vendor Directory | Procurement | Authoritative |
| FORM_TENANT_APPLICATION | Tenant Application | Property Mgmt | Partial (Part D) / WAITING full |
| FORM_TENANT_EVALUATION | Tenant Evaluation Scores (4×0–10) | Property Mgmt | CONFIRMED method; bands WAITING |
| FORM_OFFER_LETTER | Offer Letter (rent/SC/deposit) | Property Mgmt | WAITING template |
| FORM_TENANCY_AGREEMENT | Tenancy Agreement | Property Mgmt | WAITING |
| FORM_FM_LANDLORD_AGREEMENT | Tenant–FM–Landlord agreement | Property Mgmt | WAITING — critical |
| FORM_MOVE_IN_INSPECTION | Move-in Inspection | Property Mgmt | CONFIRMED components; form WAITING |
| FORM_MOVE_OUT_INSPECTION | Move-out Inspection | Property Mgmt | WAITING |
| FORM_MAINTENANCE_REQUEST | Maintenance Request | Property Mgmt | CONFIRMED flow; form WAITING |
| FORM_MAINTENANCE_WORK_ORDER | Maintenance Work Order | Property Mgmt | WAITING |
| FORM_SERVICE_CHARGE_STATEMENT | Service Charge Statement | Property Mgmt | WAITING |
| FORM_LANDLORD_REMITTANCE | Landlord Remittance | Property Mgmt | CONFIRMED concept |
| FORM_PROPERTY_LISTING | Sale / JV Listing | Sales | Partial (Part D); expand WAITING |
| FORM_BUYER_INTEREST | Buyer Show Interest → CRM | Sales | CONFIRMED trigger |
| FORM_SALES_INSPECTION | Physical Sales Inspection + Response | Sales | CONFIRMED mandatory; form WAITING |
| FORM_PURCHASE_REQUISITION | Purchase Requisition (Goods) | Procurement | WAITING template |
| FORM_PURCHASE_ORDER | Purchase Order | Procurement | WAITING |
| FORM_GOODS_RECEIPT | Goods Receipt / Delivery Note | Procurement | WAITING |
| FORM_SUPPLIER_PERFORMANCE | Supplier Performance Review | Procurement | WAITING method |
| FORM_ARTISAN_KYC | Artisan / Professional Registration | Procurement | CONFIRMED fields |
| FORM_SERVICE_REQUEST | Service Request (photo + artisan) | Procurement | CONFIRMED |
| FORM_WORKS_CONTRACT | Works / Construction Contract Link | Procurement | CONFIRMED link to project; agreement WAITING |`;
    if (body.includes(insertAfter)) {
      body = body.replace(insertAfter, extraForms);
    }
  }

  const out = `${FRONT_MATTER}\n${body}\n\n${brdParts.trim()}\n\n${PART_F.trim()}\n`;
  await writeFile(MASTER, out, 'utf8');
  console.log('Updated', MASTER);
  console.log('Lines:', out.split('\\n').length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
