import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const planning = path.join(dir, '..');
const read = (p) => fs.readFileSync(path.join(planning, p), 'utf8');

const fullExtraction = read('extractions/ABRAHAM_FULL_EXTRACTION.md');
const operationalForms = read('OPERATIONAL_FORMS.md');
const teamCharter = read('TEAM_CHARTER.md');

const header = `# Abraham / Triple A — Master Build Document (Complete)

> **Single .md file for building Propa3 end-to-end.**  
> Combines: Abraham's verbal process walkthrough · extracted Google Docs/Sheets/infographics · operational form field specs · roles & access · workflows · enums · approval gates.
>
> **Use for:** database schemas, APIs, UI forms, RBAC, automations, client portal, acceptance tests.  
> **Generated:** Sep 3, 2026  
> **Governance:** Abraham documents > Abraham verbal instructions > Team Charter (\`PROJECT_GOVERNANCE.md\`)

---

## Document Map

| Part | Contents |
|------|----------|
| **A** | [System design — principles, entities, enums, roles, gates, automations](#part-a-system-design) |
| **B** | [Verbal process — full 5 process groups from Abraham conversation](#part-b-verbal-process-full-workflow) |
| **C** | [Authoritative extractions — all docs, sheets, infographics verbatim](#part-c-authoritative-extractions) |
| **D** | [Form field specs — exact columns for every system form](#part-d-form-field-specs) |
| **E** | [Team roles & org structure](#part-e-team-roles--org-structure) |
| **F** | [Gaps — items to validate with Abraham](#part-f-gaps--validation-needed) |

---

# Part A: System Design

## A.1 Design Principle — Controlled Workflow, Not a Tracker

Abraham described a **controlled operational workflow**. The system must **block** the next stage until prerequisites pass.

\`\`\`
Lead → Initial Proposal → Project Charter (sign-off) → Planning → Design/BOQ/Permits
  → Procurement → Execution → Inspection → Measurement → Valuation → Payment
  → Progress Reporting → UAT → Handover → Closure → Retrospective
\`\`\`

**Approval gates (non-negotiable):**

| Transition | Blocked until |
|------------|---------------|
| Initiation → Planning | Client + company charter signatures |
| Planning → Execution | Dev Control approval + BOQ approved + schedule published |
| Concrete pour | Pre-pour checklist pass + engineer sign-off |
| Subcontractor payment | IVC measured % + PM recommendation |
| Major scope change | Client approval (+ Dev Control if structural) |
| Handover | UAT pass + fitness certificate + financial closure |
| Project closed | Retrospective completed |

## A.2 Three Pillars (Interconnected)

\`\`\`
         CLIENT
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
 PROPERTY ◄─ PROJECT ─► PROCUREMENT
 (land)      (build)      (materials)
\`\`\`

## A.3 Core Entities

| Entity | Description |
|--------|-------------|
| organization | Triple A Realty Projects Ltd. |
| site | Jikwoyi, Mpape, Guzape I/II/III, Lugbe, Rockvilla |
| property | Land, plot, unit, building |
| project | Construction engagement |
| client | Owner, purchaser, tenant |
| stakeholder | Registered party with comms plan |
| user | System user with role(s) |
| document | Drawing, permit, certificate, report |
| milestone / task | WBS schedule row |
| daily_site_log | 10-section daily report |
| inspection | Phase QC or pre-pour checklist |
| change_request | Scope variation row |
| subcontract + ivc | Subcontractor work + valuation certificate |
| invoice / payment | Billing and ledger |
| material_request | Site indent |
| vendor | Supplier directory row |
| progress_report | Weekly/monthly stakeholder report |
| personnel_log | Attendance (verbal — no template yet) |
| retrospective | Post-project lessons |
| listing | Property for sale |

## A.4 Project Status State Machine

\`lead\` → \`initiation\` → \`charter_draft\` → \`charter_approved\` → \`planning\` → \`design_review\` → \`permits_pending\` → \`active_construction\` → \`monitoring\` → \`commissioning\` → \`handover\` → \`closed\` → \`archived\`

## A.5 Global Enums & Dropdown Values

### Sites
| Code | Name |
|------|------|
| JKW | Jikwoyi |
| MPP | Mpape Plaza |
| GZP2 | Guzape II — Vida Shelter Estate |
| GZP3 | Guzape III — Boing Estate |
| GZP | Guzape (duplex / general) |
| LGB | Lugbe / River Park |
| RCK | Rockvilla Estate, Guzape |

### Project types
\`residential_detached\` · \`residential_apartment\` · \`commercial_mall\` · \`mixed_use\` · \`renovation\` · \`infrastructure\`

### Stakeholder types
client · government_dev_control · government_fcta · architect · structural_engineer · mechanical_engineer · electrical_engineer · subcontractor · vendor · consultant · community_leader · internal_pm · internal_supervisor · logistics_officer · media_team

### Change request status
\`draft\` → \`in_review\` → \`approved\` | \`rejected\` | \`pending_client\` | \`pending_dev_control\`

### Change impact
\`low\` · \`medium\` · \`high\`

### IVC payment stages
\`mobilization\` · \`milestone_1\` … \`milestone_5\` · \`final\`

### Purchaser payment schedule (default %)
Month1=20% · Month2=15% · Month3=15% · Month4=15% · Month5=15% · Month6=20%

### Ref code patterns
| Module | Pattern | Example |
|--------|---------|---------|
| Daily Site Log | AAA/{SITE}/{PROJECT_NUM}/{MONTH}/{YEAR}/{SEQ} | AAA/GZP/530/JULY/2026/01 |
| Change ID | CHG-{PROJECT}-{SEQ} | CHG-JKW-001 |
| Invoice | {PREFIX}/{YEAR}/{TYPE}-{SEQ} | AAA/2026/SOL-084 |
| Variation | V-{SEQ} | V-01 |

## A.6 System Roles

ceo · project_manager · site_supervisor · store_manager · architect · structural_engineer · mechanical_engineer · electrical_engineer · surveyor · procurement · logistics · qs · finance · sales · client · subcontractor · consultant · media · hse · admin · artisan

## A.7 Complete Form Registry

| Form ID | Name | Process group | Source status |
|---------|------|---------------|---------------|
| FORM_INITIAL_PROPOSAL | Initial Proposal | Initiation | Draft (verbal) |
| FORM_PROJECT_CHARTER | Project Charter | Initiation | Authoritative |
| FORM_KICKOFF_MEETING | Kick-off Meeting | Planning | Authoritative |
| FORM_SITE_SURVEY | Site Survey | Planning | Draft (verbal) |
| FORM_BOQ | Bill of Quantities | Planning | Draft (verbal) |
| FORM_WORK_SCHEDULE | WBS / Gantt | Planning | Authoritative |
| FORM_LABOUR_SCHEDULE | Labour Schedule | Planning | Headers only |
| FORM_PERSONNEL_LOG | Personnel Log | Planning/Execution | Draft (verbal) |
| FORM_DAILY_SITE_LOG | Daily Site Log | Execution | Authoritative |
| FORM_PRE_POUR_CHECKLIST | Pre-Concrete Pour | Execution | Authoritative (verbal) |
| FORM_PHASE_INSPECTION | 20-Category Inspection | Execution/QC | Authoritative |
| FORM_PROGRESS_REPORT | Progress Report | Monitoring | Authoritative |
| FORM_CHANGE_LOG | Change Request Log | Monitoring | Authoritative headers |
| FORM_IVC | Interim Valuation Certificate | Monitoring | Authoritative |
| FORM_PURCHASER_INSTALMENT | Purchaser Instalment | Property/Finance | Authoritative |
| FORM_CLOSEOUT_REPORT | Closeout Report | Closure | Authoritative |
| FORM_RETROSPECTIVE | Retrospective | Closure | Authoritative |
| FORM_INVOICE | Invoice | Finance | Authoritative |
| FORM_VENDOR | Vendor Directory | Procurement | Authoritative |

## A.8 Automation Rules

| Trigger | Action |
|---------|--------|
| 06:00 weekday | Daily log reminder → foreman |
| 18:00 no log | Alert foreman + PM |
| Log submitted | Notify PM to approve |
| PM approves log | Update milestone %; push photos to client portal |
| Incident checked | Auto HSE draft |
| Material balance negative | Alert store manager |
| Pre-pour fail | Block pour; notify structural engineer |
| Charter unsigned | Block planning phase |

---

# Part B: Verbal Process (Full Workflow)

*From Abraham's recorded conversation — structured for implementation.*

## B.1 Product Concept

Platform covers **Project Management**, **Property**, and **Procurement** — interconnected.

## B.2 Five Process Groups

Initiation · Planning · Execution · Monitoring & Controlling · Closure

## B.3 Initiation

- Client inquiry with building requirement; may need land acquisition (Property link)
- Initial high-level proposal → Project Charter (~1 page) → client + company sign-off
- Charter: goal, cost range (not exact), duration range, benefits, risks, scope, team, success criteria
- Commercial projects: cost-benefit; personal projects: client priorities

### FORM_INITIAL_PROPOSAL

| Field | Type | Required |
|-------|------|----------|
| proposal_id | auto | Yes |
| client_id | FK | Yes |
| property_id | FK | No |
| proposed_building_type | select | Yes |
| proposed_location | text | Yes |
| high_level_requirements | textarea | Yes |
| company_recommendations | textarea | Yes |
| estimated_cost_min_ngn | currency | No |
| estimated_cost_max_ngn | currency | No |
| estimated_duration_min_months | number | No |
| estimated_duration_max_months | number | No |
| status | draft/sent/accepted/rejected | Yes |

## B.4 Planning

Kick-off · site survey · design (arch + structural + MEP) · soil test · BOQ · Dev Control approval · WBS/Gantt · HR · equipment · stakeholders · quality · procurement · safety · communication plan

**9–10 professional plans** Abraham prepares including time, budget, quality, procurement, safety, communication.

### Daily / Weekly / Monthly rhythm (infographic)
See Part C — Document 3 infographic.

## B.5 Execution — Construction Sequence

Site clearance → setting out (surveyor/theodolite) → excavation → blinding → column footings → trench walls → plinth beam (if needed) → DPC → holo-fill/backfill → MEP sleeves → slab cast (~150mm) → curing → blockwork → head course/columns/lift shaft → upper floors (beams, slab, stair, reinforcement, MEP, pre-pour check, cast) → finishes

### Pre-Concrete Pour Checklist (verbal — full)

**Drawing:** approved drawings on site; slab thickness; beam sizes/position/level; design changes approved

**Formwork:** complete, aligned, soffit level, thickness, supported, braced, props, beam support, cleaned, load-safe

**Reinforcement:** diameter, grade, spacing, main/distribution/top/bottom/beam, lap length, anchorage, tied, spacers, cover

**MEP:** openings, conduits, plumbing/drainage sleeves, floor drains, unapproved openings closed

**Site:** clean, materials ready, mixer/vibrator/manpower, weather forecast, media assigned

**Safety:** access, PPE, formwork stability, no unauthorized personnel below

**Approvals:** Dev Control, structural engineer, site manager, all inspections complete, defects corrected, signatures

## B.6 Monitoring & Controlling

**IVC:** pay subcontractors on measured % — mobilization + milestones; performance comments; PM recommendation

**Progress:** daily / weekly / monthly / milestone reports with photos

**Change log:** requester, justification, impact (cost/time), approver, status

## B.7 Closure

UAT (test all components) → fitness certificate → settle all payments → client feedback → retrospective → testimonials → continuous improvement

## B.8 Property & Procurement (Partial)

Property: land acquisition, listings, purchaser instalment — conversation incomplete  
Procurement: vendor directory exists; need PO/delivery templates

---

# Part C: Authoritative Extractions

`;

const partC = fullExtraction.replace(
  /^# Abraham — Complete Extraction[^\n]*\n\n>[^\n]*\n>[^\n]*\n\n---\n\n## Table of Contents[\s\S]*?---\n\n/,
  ''
);

const partDHeader = `\n\n---\n\n# Part D: Form Field Specs\n\n`;
const partD = operationalForms.replace(
  /^# Propa3 — Operational Forms[^\n]*\n\n>[\s\S]*?---\n\n/,
  ''
);

const partEHeader = `\n\n---\n\n# Part E: Team Roles & Org Structure\n\n`;
const partE = teamCharter.replace(
  /^# Triple Realty Projects Limited — Team Charter[^\n]*\n\n>[\s\S]*?---\n\n/,
  ''
);

const partF = `\n\n---\n\n# Part F: Gaps — Validation Needed

| Item | Status | Action |
|------|--------|--------|
| BOQ template | Verbal only | Abraham to upload sample |
| Material Request signed form | Draft | Confirm approval chain |
| Personnel log | Verbal only | Confirm format |
| Pre-pour checklist | Verbal detailed | Confirm paper doc if exists |
| Properties module | Conversation incomplete | Resume walkthrough |
| Procurement PO/GRN | Missing | Upload templates |
| Product name | Strew vs Triple A | Confirm branding |
| Commission rules | Unknown | Confirm % splits |
| Corporate bank details | Laucarie on sample | Confirm entities |

---

*End of Abraham / Triple A Master Build Document*
`;

const out = header + partC + partDHeader + partD + partEHeader + partE + partF;
const outPath = path.join(planning, 'ABRAHAM_MASTER_BUILD_DOCUMENT.md');
fs.writeFileSync(outPath, out);
console.log('Written:', outPath);
console.log('Lines:', out.split('\n').length);
console.log('Size KB:', (out.length / 1024).toFixed(1));
