# Propa3 — MVP Scope (Internal-First)

> **Codename:** Sell & Build — Internal Core  
> **Priority:** Abraham's documents + Team Charter + Agile operating model **over** Samuel's marketplace/AI features  
> **Audience:** This list is for **what to build first** — staff-facing tools that run Triple A's real operations  
> **Companion:** `FEATURES_MASTER.md` (full catalog) · `PHASE1_SCOPE.md` (acceptance tests)

---

## MVP Principle

```
Build what Abraham's team uses every day on site, in the office, and with clients.
Public website exists to feed leads and show progress — not to replicate Zillow.
```

**Module pattern:** Every Abraham document = one reusable module for **all** sites / projects / estates — the sample file shows exact form layout only.

---

## What Defines This MVP

| Source | Weight in MVP |
|---|---|
| Abraham's uploaded documents (Jul 16) | **Highest — exact replication** |
| Team Charter — 10 business rules + reporting cadence | **High — automate in P1 where possible** |
| Company Profile — Agile milestones, 4 sites, org chart | **High — structure and workflows** |
| Adobe Site Activities sheet + NNQP quality checks | **Medium — merged into Site Tracker** |
| Samuel's Zillow/AI/IoT ideas | **Out of MVP** |

---

## Tier 1 — Must Ship (Abraham's Documents → Internal Modules)

These are non-negotiable MVP items. Each maps to a real document Abraham sent.

### 1.1 Site Tracker Module ⭐
**Sample:** `Guzape Site Daily activities Tracker - 15_7_26-1.pdf`  
**Used by:** Foreman, Site Supervisor · **All sites**

| # | Sub-feature | Detail |
|---|---|---|
| 1 | 10-section daily form | Exact fields from sample (timing, activities, manpower by trade, machinery, materials, quality, safety, issues, next-day plan, signatures) |
| 2 | Auto ref code | `AAA/{SITE}/{PROJECT_NUM}/{MONTH}/{YEAR}/{SEQ}` |
| 3 | Activity status | To do / Ongoing / Done + progress % |
| 4 | Trade-level manpower | Iron benders, carpenters, masons, plumbers, electricians |
| 5 | Material balance | Received − consumed = balance; negative → alert |
| 6 | Quality checks | Slump test, cube casting, reinforcement, concrete |
| 7 | Safety flags | PPE, toolbox talk, incidents → auto HSE draft |
| 8 | Issue alerts | Material shortage, breakdown, weather → immediate PM notify |
| 9 | Offline PWA | Submit without signal; sync on reconnect |
| 10 | PM approval | Approve → lock log → feed milestone % |
| 11 | Site photos | Upload with EXIF GPS/date |

**Workflow:**
```
Foreman opens app (any site) → fills 10 sections → signs → submits (offline OK)
  → PM notified → approves → milestone % updates → weekly report data ready
  → 18:00 if missing: alert foreman + PM
```

---

### 1.2 Organization & Sites Module ⭐
**Sample:** `Triple A PROJECT STRUCTURE.pdf`  
**Used by:** CEO, Admin · **All operations**

| # | Sub-feature | Detail |
|---|---|---|
| 1 | Org hierarchy | CEO → QC Team, Design, Procurement, Marketing, Site Teams |
| 2 | Four active sites | Jikwoyi, Mpape, Guzape II (Vida Shelter), Guzape III (Boing Estate) |
| 3 | Per-site team template | Site Manager, Store Mgr, Supervisor ×2, Artisans |
| 4 | Design team roles | Architectural, Structural, Mechanical, Electrical |
| 5 | User-to-site assignment | `primary_site_id` scopes all site data |
| 6 | Project registry | Project per site with contract ref, client, dates |

**Workflow:**
```
Admin creates site → assigns PM + team → users only see their site(s)
  → all logs, materials, changes scoped to site/project
```

---

### 1.3 Project Change Log Module ⭐
**Sample:** `PROJECT CHANGE LOG.xlsx` (Jikwoyi mix-use)  
**Used by:** PM, CEO, Originator · **All projects**

| # | Sub-feature | Detail |
|---|---|---|
| 1 | 9 exact columns | CHANGE ID, DATE, ORIGINATOR, DESCRIPTION, JUSTIFICATION, REVISED BY, STATUS, APPROVED BY, IMPACT |
| 2 | Status values | in review / approved / rejected |
| 3 | Impact levels | High / Med / Low |
| 4 | CEO gate | High impact requires CEO approval |
| 5 | Invoice link | Approved → variation line V-01, V-02 on invoice |
| 6 | Excel export | Download matching Abraham's `.xlsx` layout |
| 7 | Client visibility | Approved changes visible in client portal (Agile open-book) |

**Workflow:**
```
Anyone raises change → PM reviews impact → CEO if High → approved
  → BOQ/schedule adjusted → invoice variation → client notified
```

---

### 1.4 Invoicing & Payment Module ⭐
**Sample:** `invoice Triple A.docx`  
**Used by:** Finance, PM · **All clients/contracts**

| # | Sub-feature | Detail |
|---|---|---|
| 1 | Invoice layout | Invoice no, contract ref, client, project, line items |
| 2 | Variation block | V-01 linked to change log |
| 3 | Summary block | Base + variations = revised total − paid = outstanding |
| 4 | Settlement routing | Bank name, account name, number (configurable per entity) |
| 5 | Invoice types | Sales, variation, agency, service, rental |
| 6 | Payment proof upload | Client/staff uploads screenshot → finance verifies |
| 7 | Receipt PDF | Auto-generated on verification |
| 8 | Installment schedule | From payment plan (Outright / 6M / 12M / 18M) |
| 9 | Milestone payments | Milestone 1, 2, 3 tied to Foundation/Shell/Finishing |

**Workflow:**
```
Finance creates invoice → sends to client portal
  → client pays via bank transfer → uploads proof
  → finance verifies → receipt + ledger updated
  → if reservation: trigger allocation
```

---

### 1.5 Milestones Module ⭐
**Source:** Company Profile Agile model + Abraham's operating philosophy  
**Used by:** PM, Engineer, Client (read-only)

| # | Sub-feature | Detail |
|---|---|---|
| 1 | Standard stages | Foundation → Shell → Finishing → Handover |
| 2 | Progress % | Rollup from site tracker + PM override |
| 3 | FCDA permit gate | Block Foundation 100% without permit uploaded |
| 4 | Engineer certification | Interim cert at milestone complete |
| 5 | Phase retrospective | Form after each milestone (Agile principle #12) |
| 6 | Client portal sync | Approved progress + photos visible |

**Workflow:**
```
Project created → milestones set → daily logs feed %
  → gate checks at 100% → engineer certifies → client sees update
```

---

### 1.6 Material Request Module ⭐
**Source:** Team Charter rule #2 + draft template (Abraham's version pending)  
**Used by:** Foreman, PM, Store Manager

| # | Sub-feature | Detail |
|---|---|---|
| 1 | Request form | Material, spec, qty, urgency, area, required date |
| 2 | Approval chain | Foreman creates → PM approves → Store issues |
| 3 | Link to daily log | Optional reference to today's log |
| 4 | Zero unrecorded rule | Cannot issue without approved request (Charter #6) |

**Workflow:**
```
Foreman requests → PM approves qty → Store Manager issues
  → recorded against project (full inventory in P2)
```

---

### 1.7 Tenant Application Module ⭐
**Sample:** `TENANT APPLICATION FORM.docx`  
**Used by:** PM, Sales · **Any rental unit**

| # | Sub-feature | Detail |
|---|---|---|
| 1 | 23 exact fields | Personal, guarantor, next of kin, inspection date |
| 2 | Legal clause 1 | Not a rental agreement until approved |
| 3 | Legal clause 2 | 20% agency/legal fee acceptance |
| 4 | Agency fee calc | `rent_accepted × 0.20` → auto invoice |
| 5 | Digital fill + sign | Tenant + guarantor signature capture |
| 6 | PM review | Approve → create tenant profile |

**Workflow:**
```
Prospect applies → accepts clauses → agency fee invoiced
  → PM approves → tenant profile created → Estate Terrier row ready
```

---

### 1.8 Estate Terrier Module ⭐
**Sample:** `Estate Terrier 2.pdf` (Dawaki Block of Flats)  
**Used by:** PM, Finance · **Every managed estate**

| # | Sub-feature | Detail |
|---|---|---|
| 1 | 16-column register | S/NO through net rental income |
| 2 | Net income calc | Rent − expenses = auto |
| 3 | Rent status | Paid / Fixed tracking |
| 4 | Tenancy dates | Start, termination, alerts at 60 days |
| 5 | Caution deposit & service charge | Per row |
| 6 | Clone per estate | Dawaki first; add Lugbe, etc. later |

**Workflow:**
```
Tenant approved → row created → rent paid → dates updated
  → expenses logged → net income recalculated → arrears flagged
```

---

### 1.9 Document Management ⭐
**Used by:** All internal roles

| # | Sub-feature | Detail |
|---|---|---|
| 1 | Upload & categorize | Contract, Permit, Receipt, Drawing, Certificate, BOQ, Other |
| 2 | Link to entity | Project, client, plot, tenant, employee |
| 3 | Version history | v1, v2 retained |
| 4 | PDF generation | Site log, invoice, receipt, allocation letter, tenant app |
| 5 | FCDA permit storage | Required for milestone gate |

**Workflow:**
```
User uploads permit/drawing/contract → tagged to project
  → versioned → role-controlled download
```

---

### 1.10 Sales Listings (Internal Admin) ⭐
**Sample:** `FOR SALE PROPERTIES TRIPLE A REALTY.pdf`  
**Used by:** Sales, PM, Admin

| # | Sub-feature | Detail |
|---|---|---|
| 1 | Listing CRUD | Location, type, finish (FF/SF), payment plans |
| 2 | Multi-tier pricing | Outright, 6M, 12M, 18M per listing |
| 3 | Import seed data | `data/LISTINGS_SEED.json` + manual add |
| 4 | Status management | Available → Reserved → Sold |
| 5 | Link to CRM | Inquiry tied to `listing_id` |

**Workflow:**
```
Admin maintains catalog → sales uses in client conversations
  → public site displays subset → inquiry → CRM lead
```

---

## Tier 2 — Abraham-Mentioned (Team Charter + Agile + Profile)

Internal rules and operating model Abraham defined — automate in MVP where marked **P1**.

### 2.1 RBAC & Access Control
**Source:** Team Charter — 15 site roles

| # | Sub-feature | MVP? |
|---|---|---|
| 1 | Roles: CEO, PM, Foreman, Engineer, Architect, Store Mgr, Finance, Sales, Client | **P1** |
| 2 | Site-scoped data access | **P1** |
| 3 | Artisan sub-roles by trade | P2 |
| 4 | Security personnel role | P2 |
| 5 | Field-level permissions | P2 |

**Workflow:** User logs in → sees only modules and sites their role allows.

---

### 2.2 Reporting Automation (Charter Cadence)

| # | Report | Frequency | MVP? | How |
|---|---|---|---|---|
| 1 | Daily site logs | Daily | **P1** | Site Tracker module |
| 2 | Weekly PM status report | Weekly | **P1** | Auto-draft from logs + PM narrative edit |
| 3 | Monthly inventory reconciliation | Monthly | P2 | Store module |
| 4 | Monthly financial progress | Monthly | **P1** | Finance dashboard export |
| 5 | HSE incidents same-day | Immediate | **P1** | Incident flag → PM + HR alert |

**Workflow:** System generates draft → PM/Store reviews → export PDF or send to client.

---

### 2.3 Team Charter Business Rules in Software

| # | Rule (Abraham/Charter) | MVP Feature | P1? |
|---|---|---|---|
| 1 | No construction without FCDA permit | Milestone gate | **Yes** |
| 2 | Material requests need Foreman/PM auth | Approval workflow | **Yes** |
| 3 | Daily logs before leaving site | 18:00 deadline + alerts | **Yes** |
| 4 | Design discrepancies within 24h | SLA task escalation | P2 |
| 5 | Client sign-off on major variations | Change log + portal | **Yes** (log P1; e-sign P2) |
| 6 | Zero unrecorded material issuances | Request approval gate | **Yes** |
| 7 | Charter ack on onboarding | HR e-signature | P2 |
| 8 | Subcontractor NSITF/tax on file | Compliance checklist | P2 |
| 9 | Site photos need mgmt approval before social | Approval queue | P2 |
| 10 | Whistleblower channel | Confidential report | P2 |

---

### 2.4 Engineer & Compliance (Abraham's Team)

| # | Sub-feature | MVP? |
|---|---|---|
| 1 | Engineer profile (Engr. Kanadi, COREN R.53757) | **P1** |
| 2 | COREN licence expiry alerts (90/30/7 days) | **P1** |
| 3 | Inspection checklist at milestone gates | **P1** |
| 4 | Interim completion certificate generation | **P1** |
| 5 | Structural risk flag → immediate PM + CEO alert | **P1** |
| 6 | NNQP quality alignment (slump, cube, rebar) | **P1** (in Site Tracker §6) |

**Workflow:** Milestone at gate → engineer inspects → Pass/Fail → cert or remedial list.

---

### 2.5 HSE Incident Module
**Source:** Team Charter §5.2 + Site Tracker §7

| # | Sub-feature | MVP? |
|---|---|---|
| 1 | Auto-draft from site tracker incident flag | **P1** |
| 2 | Classification (accident, near miss, unsafe, etc.) | **P1** |
| 3 | Same-day PM notification | **P1** |
| 4 | Root cause investigation (48h) | **P1** |
| 5 | Regulatory notification flags | P2 |

---

### 2.6 CRM (Internal Sales Tool)
**Source:** Needed to close sales loop — not Zillow-style

| # | Sub-feature | MVP? |
|---|---|---|
| 1 | Lead capture (manual + web form) | **P1** |
| 2 | Pipeline: Inquiry → … → Won/Lost | **P1** |
| 3 | Source tracking (WhatsApp, Web, Instagram, Referral) | **P1** |
| 4 | Communication notes | **P1** |
| 5 | Convert lead → client | **P1** |
| 6 | Lead scoring, auto-assign | P2 |

**Workflow:** Inquiry → sales follows up → reserved → Won → client account + portal.

---

### 2.7 PM Dashboard
**Used by:** Project Manager · **P1**

| # | Widget |
|---|---|
| 1 | My projects + milestone % |
| 2 | Pending daily log approvals |
| 3 | Open material requests |
| 4 | Issues/delays from today's logs |
| 5 | Client payment status |
| 6 | Open change log items |
| 7 | Upcoming inspections |

---

### 2.8 CEO Dashboard
**Used by:** Abraham · **P1**

| # | Widget |
|---|---|
| 1 | All 4 sites health (log submission rate) |
| 2 | Revenue + outstanding receivables |
| 3 | Active leads / conversion |
| 4 | Open high-impact change requests |
| 5 | COREN licence status |
| 6 | FCDA permits missing per project |
| 7 | Rental net income (Estate Terrier) |

---

### 2.9 Audit Log
**Source:** PROJECT_GOVERNANCE — required from day one

| # | Sub-feature | MVP? |
|---|---|---|
| 1 | Log all financial changes | **P1** |
| 2 | Log document uploads/changes | **P1** |
| 3 | Log milestone/approval changes | **P1** |
| 4 | Who, when, before/after values | **P1** |

---

### 2.10 Notifications (Internal)
**MVP?** **P1**

| Event | Notify |
|---|---|
| Daily log submitted | PM |
| Daily log missing 18:00 | Foreman + PM |
| Material request pending | PM |
| Material shortage flagged | PM + Store |
| HSE incident flagged | PM + CEO |
| Change log needs approval | PM / CEO |
| Payment proof uploaded | Finance |
| COREN licence expiring | Engineer + CEO |

---

### 2.11 Agile Operating Model (Abraham's Philosophy)

| # | Principle | MVP Implementation |
|---|---|---|
| 1 | Open-book — no hidden costs | Change log + invoices visible to client |
| 2 | Foundation → Shell → Finishing | Milestone template |
| 3 | Functional progress = work done | Site tracker activity % |
| 4 | Client collaboration over contract negotiation | Client portal + change visibility |
| 5 | Phase retrospectives | Retrospective form after each milestone |
| 6 | Weekly client sync | Auto weekly report from logs |

---

## Tier 3 — Minimal External (Supports Internal Loop Only)

Not the focus of MVP, but required so sales → client → payment → progress works end-to-end.

| # | Feature | Why in MVP |
|---|---|---|
| 1 | Basic marketing homepage + about | Trust badges (CAC, SCUML, COREN) |
| 2 | Project showcase (6 portfolio projects) | Proof for sales conversations |
| 3 | Listing pages with inquiry CTA | Feeds CRM |
| 4 | WhatsApp + phone CTAs | Primary Nigeria channel |
| 5 | Contact / lead form | Feeds CRM |
| 6 | Basic search/filter on listings | Sales reference |
| 7 | Privacy policy (NDPR template) | Legal requirement for portal |
| 8 | Client portal (Tier 1.4 + 1.5 views) | Abraham's open-book promise |
| 9 | Plot map (basic Leaflet) | Sales + allocation visual |

**Explicitly minimal:** No AI search, no comparison tool, no 3D tours, no mortgage calculator in MVP.

---

## Explicitly OUT of MVP

| Feature | Why deferred | Source |
|---|---|---|
| IoT / smart building | Abraham deferred | Governance |
| AI valuation, AI match, conversational search | Samuel — P3 | REQUIREMENTS |
| Zillow comparison, saved collections, AR/VR | Samuel — P2/P3 | REQUIREMENTS |
| Paystack live payments | P2 — MVP uses bank transfer + proof | PRODUCT_DECISIONS |
| Agent commissions & full agent app | P2 | PHASE1_SCOPE |
| Social media calendar scheduler | P2 (Adobe doc exists) | Document 1 |
| Full ERP (payroll, vehicles, petty cash) | P2 | PHASE1_SCOPE |
| Full store/inventory | P2 — MVP has material request only | PHASE1_SCOPE |
| Security gate / visitor log | P2 | Team Charter |
| Whistleblower module | P2 | Charter rule #10 |
| Full HR (recruitment, performance reviews) | P2 | Team Charter |
| Facilities maintenance tickets | P2 | PHASE1_SCOPE |
| SMS gateway | P2 | PRODUCT_DECISIONS |
| Property comparison | P2 | Samuel |
| Multi-branch / white-label | P3 | Samuel |

---

## MVP Build Order (Internal-First)

| Week block | Deliverable | Primary user |
|---|---|---|
| **1–2** | Auth + RBAC + 4 sites + org structure | Admin, CEO |
| **3–4** | Projects + milestones + FCDA gate | PM |
| **5–7** | Site Tracker PWA (offline) — all sites | Foreman |
| **8** | PM dashboard + log approval + notifications | PM |
| **9** | Project Change Log | PM, CEO |
| **10** | Invoicing + payment proof + receipts | Finance |
| **11** | Material requests | Foreman, PM |
| **12** | Engineer inspections + COREN alerts | Engineer |
| **13** | Tenant Application + Estate Terrier (Dawaki) | PM, Finance |
| **14** | CRM + lead pipeline | Sales |
| **15** | Client portal | Client |
| **16** | Listings admin + basic public pages | Sales, Public |
| **17** | CEO dashboard + audit log + seed data | CEO |
| **18** | QA against acceptance criteria | All |

*Adjust timeline to team size — Abraham has not confirmed schedule.*

---

## MVP Acceptance Criteria (Internal Focus)

| # | Test | Pass condition |
|---|---|---|
| **M1** | Foreman at any site submits offline log | Syncs; PM notified; ref code generated |
| **M2** | PM approves log at Jikwoyi | Milestone % updates; appears in weekly report draft |
| **M3** | Change raised on Mpape project | PM approves; variation line ready for invoice |
| **M4** | Finance verifies payment | Receipt PDF; outstanding recalculated |
| **M5** | Foundation gate without FCDA | System blocks with clear message |
| **M6** | Material request without PM approval | Store cannot issue |
| **M7** | Tenant applies for Dawaki unit | 20% fee calculated; PM review queue |
| **M8** | CEO opens dashboard | Sees all 4 sites log submission rate today |
| **M9** | COREN licence 30 days out | Engineer + CEO alerted |
| **M10** | HSE incident flagged on site | PM notified same day |

---

## Abraham Sign-Off Required Before Build Complete

| Item | Status |
|---|---|
| Triple A corporate bank details (vs Laucarie Consulting on sample invoice) | ⏳ |
| TBD listing prices policy | ⏳ |
| Remaining documents (BOQ, material request, allocation letter, sales agreement) | ⏳ Incoming |
| Phase 1 scope approval | ⏳ |
| DPO designation (NDPR) | ⏳ |

---

## Quick Reference: Document → MVP Module

| Abraham's document | MVP module | Internal users |
|---|---|---|
| Guzape Site Tracker PDF | Site Tracker | Foreman, PM |
| PROJECT STRUCTURE PDF | Org & Sites | CEO, Admin |
| PROJECT CHANGE LOG xlsx | Change Log | PM, CEO |
| invoice Triple A docx | Invoicing & Payments | Finance |
| TENANT APPLICATION docx | Tenant Application | PM, Sales |
| Estate Terrier 2 PDF | Estate Terrier | PM, Finance |
| FOR SALE PROPERTIES PDF | Listings Admin | Sales, Admin |
| Team Charter | RBAC, rules, reporting | All staff |
| Company Profile | Milestones, Agile, seed projects | PM, CEO |
| NNQP / Adobe site log | Quality checks in Site Tracker §6 | Engineer, Foreman |

---

## Document Index

| File | Role |
|---|---|
| `MVP_INTERNAL.md` | **This file** — what to build first |
| `FEATURES_MASTER.md` | Full system catalog (all phases) |
| `OPERATIONAL_FORMS.md` | Exact field specs per form |
| `APP_WORKFLOWS.md` | Module workflow detail |
| `PHASE1_SCOPE.md` | Original Phase 1 checklist + AC |

---

*MVP = everything in Tier 1 + Tier 2 (P1 items) + Tier 3 minimum. Tier 2 (P2) and OUT list ship after Abraham validates core operations on live sites.*
