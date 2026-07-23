# Propa3 — Master Features Catalog

> **Complete inventory** of every feature, sub-feature, and workflow in the Triple A Realty platform  
> **Sources:** REQUIREMENTS.md, OPERATIONAL_FORMS.md, APP_WORKFLOWS.md, TEAM_CHARTER.md, COMPANY_PROFILE.md, real documents (Jul 16, 2026)  
> **Principle:** Uploaded forms are **samples** — each defines a **reusable module** used across many sites, projects, estates, and clients  
> **Phase key:** **P1** = Phase 1 MVP · **P2** = Growth · **P3** = Intelligence & Scale · **DEF** = Deferred

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Public Website & Marketplace](#2-public-website--marketplace)
3. [Property Pillar](#3-property-pillar)
4. [Project Pillar — Construction OS](#4-project-pillar--construction-os)
5. [Procurement & Internal Operations](#5-procurement--internal-operations)
6. [CRM & Sales](#6-crm--sales)
7. [Finance & Payments](#7-finance--payments)
8. [Client Portal](#8-client-portal)
9. [Rentals & Estate Terrier](#9-rentals--estate-terrier)
10. [Facilities Management](#10-facilities-management)
11. [Maps & GIS](#11-maps--gis)
12. [Document Management](#12-document-management)
13. [People, HR & Access Control](#13-people-hr--access-control)
14. [Communication Hub](#14-communication-hub)
15. [Marketing & Social Media](#15-marketing--social-media)
16. [Workflow Automation & Notifications](#16-workflow-automation--notifications)
17. [Executive Dashboard & Analytics](#17-executive-dashboard--analytics)
18. [Compliance, Trust & Security](#18-compliance-trust--security)
19. [Search, Discovery & Intelligence](#19-search-discovery--intelligence)
20. [Advanced Differentiators](#20-advanced-differentiators)
21. [Cross-Cutting Platform Services](#21-cross-cutting-platform-services)
22. [Phase Summary Matrix](#22-phase-summary-matrix)

---

## 1. System Overview

### 1.1 Brand Pillars → App Structure

| Pillar | Modules |
|---|---|
| **Property** | Listings, Estates, Plots, Rentals, Maps, Client Portal (property view) |
| **Project** | Site Tracker, Milestones, Change Log, BOQ, Inspections, Engineer Portal |
| **Procurement** | Material Requests, Store/Inventory, Purchase Orders, Vendor Management |

### 1.2 Architecture Layers

| Layer | Modules |
|---|---|
| **Public** | Website, listings, search, inquiry, tours |
| **Core** | CRM, finance, documents, workflows, communications |
| **Construction** | Site tracker, change log, milestones, material requests |
| **Operations** | HR, procurement, ERP, social calendar, facilities |

### 1.3 Module + Instance Pattern

Every operational form is built **once** as a module, then used across **many instances**:

```
Module → Instance (site_id / project_id / estate_id) → Records
```

---

## 2. Public Website & Marketplace

**Phase:** P1 (core) · P2/P3 (advanced search)  
**Users:** Public visitors, investors, buyers

### 2.1 Marketing Homepage

**Sub-features:**
- Hero with Triple A branding (navy, orange, logo)
- Featured projects carousel
- Trust badges (CAC RC 8168740, SCUML, COREN)
- Services overview (PM, Development, Facility Mgmt, Procurement)
- CTA: Book consultation, WhatsApp, phone
- Tagline: *Building Quality Projects — One Structure at a Time*

**Workflow:**
```
Visitor lands → views featured projects → clicks CTA
  → Inquiry form OR WhatsApp deep-link OR phone
  → CRM lead created with source tagged
```

### 2.2 Project Showcase Pages

**Sub-features:**
- Project gallery (4-stage construction photos: foundation → complete)
- Location, type, duration, status (Completed / Ongoing)
- Milestone summary (Foundation → Shell → Finishing)
- Linked listings/units available
- Team credentials (COREN engineer, etc.)
- Inquiry CTA per project

**Workflow:**
```
Admin publishes project → links photos from site tracker
  → Public views progress history → inquires on available units
```

**Sample data:** Million Dollar View Guzape, Jikwoyi Plaza, Mall Mpape, etc.

### 2.3 About & Compliance Pages

**Sub-features:**
- Company story (founded 2020, incorporated 2025)
- Leadership team with credentials
- Agile operating philosophy
- CAC, SCUML, COREN document viewer
- Contact details (Jahi office, email, phone, Instagram)
- Privacy policy (NDPR)
- Terms of use

**Workflow:**
```
Static content from COMPANY_PROFILE.md → legal docs uploaded to document store → public read-only view
```

### 2.4 Contact & Lead Capture

**Sub-features:**
- Contact form (name, phone, email, message, property interest)
- WhatsApp click-to-chat (`wa.me/2349121061221`)
- Phone click-to-call
- Email link
- Source UTM tracking

**Workflow:**
```
Form submitted → validate → create CRM lead (source=Web)
  → notify sales → auto-acknowledgment email
WhatsApp click → log analytics event → user opens WA externally
```

---

## 3. Property Pillar

**Phase:** P1  
**Sample:** `FOR SALE PROPERTIES TRIPLE A REALTY.pdf`

### 3.1 Sales Listings Catalog Module

**Sub-features:**
- Listing CRUD (admin)
- Bulk import from catalog / CSV / JSON seed
- Location + estate name
- Property type (flat, terrace, duplex, villa, plot, commercial, etc.)
- Finish status: **FF** (Fully Finished) / **SF** (Shell Finish) / **DPC**
- Payment plan types: Outright, 6M, 12M, 18M, Flexible, TBD, On request
- Multi-tier pricing (`price_outright_ngn`, `price_6m_ngn`, `price_12m_ngn`, `price_18m_ngn`)
- Listing status: `available` → `reserved` → `sold` → `archived`
- Image/video gallery per listing
- SEO fields (title, meta, URL slug)
- Featured listings flag
- Amenities and nearby landmarks
- Floor plans (PDF/image)
- Short let / rental flag (separate from sale)

**Workflow:**
```
Admin creates/imports listing → sets prices and plan options
  → publishes to public site
  → buyer searches/filters → views detail → inquires
  → CRM lead linked to listing_id
  → on reservation: status → reserved
  → on sale close: status → sold
```

### 3.2 Property Search & Filter (Public)

**Sub-features:**
- Filter by area (Guzape, Wuse II, Katampe, Kubwa, etc.)
- Filter by property type
- Filter by finish (FF/SF)
- Filter by price range
- Filter by payment plan availability
- Filter by bedrooms
- Sort by price, date listed
- Full-text search (PostgreSQL tsvector)

**Workflow:**
```
User applies filters → query listings table → paginated results
  → save search (P2) → email alert on new matches (P2)
```

### 3.3 Property Development — Estates & Plots

**Sub-features:**
- Estate registry (name, location, GPS, description)
- Phases within estate
- Blocks within phase
- Plots/units with unique ref
- Plot status: Available / Reserved / Sold / Under Construction / Allocated
- Infrastructure progress (roads, drainage, power)
- Plot-to-client allocation
- Plot-to-project linkage (construction)
- Reservation queue

**Workflow:**
```
Admin defines estate structure → creates plots
  → plots appear on map with status colors
  → client reserves → plot status = reserved
  → payment verified → allocation letter → status = allocated
  → construction starts → status = under_construction
  → handover → status = sold/occupied
```

### 3.4 Listing Approval Workflow

**Sub-features:**
- Draft listing state
- Submit for review
- Manager approval/reject
- Publish to public site
- Unpublish / archive

**Workflow:**
```
Sales creates draft → PM/CEO approves → published
  → rejection returns to draft with comments
```

### 3.5 Submit Unlisted Property (Research)

**Sub-features:**
- Public form: "Can't find what you need?"
- Capture requirements (area, type, budget)
- Route to CRM as research lead

**Workflow:**
```
User submits request → CRM lead (type=research) → agent assigned
```

### 3.6 Sold Properties Archive

**Sub-features:**
- Sold listing display (social proof)
- Case study linkage
- Hide price or show "Sold"

**Workflow:**
```
Listing marked sold → moves to archive → optional case study page
```

---

## 4. Project Pillar — Construction OS

**Phase:** P1 (core) · P2 (full ERP links)  
**Users:** Foreman, PM, Engineer, Architect, Store Manager, CEO

### 4.1 Organization & Sites Module

**Sub-features:**
- Company org chart (from PROJECT STRUCTURE.pdf)
- Site registry: Jikwoyi, Mpape, Guzape II, Guzape III, + future
- Per-site team template: Site Manager, Store Mgr, Supervisor ×2, Artisans
- Design team: Architectural, Structural, Mechanical, Electrical
- Cross-cutting: Procurement, QC Team, Digital Marketing
- User-to-site assignment (`primary_site_id`)
- Programme Manager / CEO oversight

**Workflow:**
```
Admin creates site → assigns PM and team members
  → all site records (logs, materials) scoped to site_id
  → CEO dashboard aggregates across sites
```

### 4.2 Projects Module

**Sub-features:**
- Project registry per site
- Project name, location, type (residential, commercial, mixed-use)
- Client/sponsor linkage
- Contract reference
- Start/end dates, duration estimate
- FCDA permit document (required gate)
- Assigned PM, engineer, architect
- BOQ linkage
- Status: Planning / Active / On Hold / Complete

**Workflow:**
```
PM creates project → uploads FCDA permit → assigns team
  → milestones created from template
  → daily logs and changes scoped to project_id
```

### 4.3 Site Tracker Module (Daily Site Log)

**Sample:** Guzape tracker PDF · **Module for ALL sites**  
**Feature ID:** `FORM_DAILY_SITE_LOG` · **Phase:** P1

**Sub-features:**
- **Header:** start_time, end_time, project_name, date, location, supervisors, ref_code (auto `AAA/{SITE}/{NUM}/{MONTH}/{YEAR}/{SEQ}`)
- **§2 Activities:** rows with To do / Ongoing / Done, progress %, remark
- **§3 Manpower:** skilled (iron benders, carpenters, masons, plumbers, electricians), unskilled, supervisors + remarks
- **§4 Machinery:** excavator, mixer, vibrator, crane, other + units/hours + remark
- **§5 Materials:** cement, steel, sand, aggregate, blocks, tiles, other — received/consumed/balance/remark
- **§6 Quality:** slump test, cube casting, reinforcement, concrete, other
- **§7 Safety:** PPE, toolbox talk, incidents/near misses
- **§8 Issues:** material shortage, equipment breakdown, weather, other
- **§9 Next day plan:** activities, materials needed, manpower needed
- **§10 Signatures:** supervisor (required), PM, consultant (optional)
- Offline PWA with IndexedDB queue
- Photo attachments with EXIF GPS
- PDF export on PM approval

**Workflow:**
```
06:00 → reminder to foreman
Foreman fills log on-site (offline OK)
  → submits before leaving site
  → ref_code generated server-side
  → PM notified
  → if incidents: HSE draft created
  → if issues: immediate PM alert
  → PM reviews → approves → locked
  → milestone % updated from activity progress
  → approved summary visible in client portal
18:00 → if missing: alert foreman + PM
```

### 4.4 Milestones Module

**Sub-features:**
- Standard template: Foundation → Shell → Finishing → Handover
- Sub-stages (7-stage detail from portfolio)
- Progress % per milestone (rollup from site logs + PM override)
- Milestone gates (FCDA permit, engineer inspection)
- Interim completion certificates
- Phase retrospective log (Agile principle #12)
- Client-visible milestone timeline

**Workflow:**
```
Project created → milestones instantiated
  → daily log progress rolls up
  → PM can override %
  → at 100%: gate checks (permit, inspection)
  → engineer certifies → interim certificate generated
  → client portal updated
  → retrospective form opened for PM
```

### 4.5 Project Change Log Module

**Sample:** Jikwoyi Excel · **Module for ALL projects**  
**Feature ID:** `FORM_PROJECT_CHANGE_LOG` · **Phase:** P1

**Sub-features:**
- Sheet title per project (auto-generated)
- Columns: CHANGE ID, DATE OF REVISION, ORIGINATOR, DESCRIPTION, JUSTIFICATION, REVISED BY, STATUS, APPROVED BY, IMPACT (High/Med/Low)
- Status: in review / approved / rejected
- Excel export matching original layout
- Link to invoice variation (V-01, V-02…)
- Link to BOQ adjustment
- Client portal visibility (approved only)

**Workflow:**
```
Originator creates change → status = in review
  → PM sets impact level
  → if High: CEO must approve
  → if approved: update BOQ, schedule, invoice variation, notify client
  → if rejected: log reason, notify originator
```

### 4.6 BOQ (Bill of Quantities) Module

**Sub-features:**
- BOQ per project with versioning
- Sections: Preliminaries, Foundation, Shell, MEP, Finishes, External
- Line items: code, description, unit, qty, rate, amount
- Section totals + grand total + contingency
- Milestone valuation link (% per section)
- Export PDF/Excel
- Actual vs budget from material logs (P2)

**Workflow:**
```
QS/PM creates BOQ → links to project
  → change log approved → BOQ lines adjusted
  → milestone billing uses BOQ section weights
```

### 4.7 Material Request Module

**Sub-features:**
- Request number auto `MR-{PROJECT}-{YYYYMM}-{SEQ}`
- Line items: material, spec, unit, qty requested/approved/issued
- Urgency flag (normal / urgent — stoppage risk)
- Link to daily log ref, BOQ ref
- Approval chain: Foreman → PM → Store Manager
- Issue voucher on fulfillment
- Store section: qty issued, balance before/after

**Workflow:**
```
Foreman creates request → PM approves qty
  → Store Manager issues materials → deducts inventory
  → if unapproved issuance attempted: blocked (Team Charter rule)
```

### 4.8 Site Inspection & Quality Checklist

**Sub-features:**
- Inspection at milestone gates
- Structural checks (engineer/COREN)
- Architectural checks
- MEP checks
- HSE checks
- Photo requirements
- Outcome: Pass / Conditional / Fail
- Interim certificate generation on Pass

**Workflow:**
```
Milestone reaches gate → engineer scheduled
  → inspection form completed with photos
  → Pass → milestone approved → cert issued
  → Fail → remedial list → re-inspection
```

### 4.9 Snag List Module

**Sub-features:**
- Pre-handover walkthrough register
- Items: location, defect, severity (Critical/Major/Minor/Cosmetic)
- Assignment to trade
- Status: Open / In Progress / Fixed / Accepted
- Client sign-off
- Handover clearance gate

**Workflow:**
```
Finishing ~95% → PM schedules walkthrough with client
  → snag items logged → assigned to trades
  → fixed → client accepts
  → all Critical/Major resolved → handover approved
```

### 4.10 HSE Incident Report Module

**Sub-features:**
- Auto-draft from daily log incident flag
- Classification: accident, near miss, unsafe condition, environmental, equipment, fatality
- Persons involved, witnesses, root cause
- Regulatory notification flags (NSITF, NESREA)
- 48h PM investigation SLA
- CEO immediate alert on fatality/severe

**Workflow:**
```
Incident flagged in site tracker OR manual report
  → PM notified immediately
  → investigation within 48h
  → corrective actions tracked
  → regulatory notifications logged if required
```

### 4.11 Engineer Portal

**Sub-features:**
- Task inbox from PM
- Upload inspection reports and photos
- Material request approval (co-sign)
- Milestone certification
- COREN licence display
- Structural risk flag (immediate CEO+PM alert)
- Drawing approval records
- Design discrepancy report (24hr SLA per Team Charter)

**Workflow:**
```
PM assigns inspection task → engineer completes checklist
  → uploads certification → project file updated
  → licence expiry: 90/30/7 day alerts
```

### 4.12 Construction Dashboard

**Sub-features:**
- Per-project progress % by milestone
- Daily log submission rate
- Open issues and delays
- Material request queue
- Quality check completion
- Manpower trends
- Photo timeline
- Delay register

**Workflow:**
```
Aggregates site tracker data in real time
  → PM views per project → CEO views all sites
```

### 4.13 Contractor & Subcontractor Management

**Sub-features:**
- Subcontractor profiles
- NSITF registration tracking
- Tax clearance tracking
- Professional body memberships
- Contract documents
- Performance per project

**Workflow:**
```
PM onboard subcontractor → verify compliance docs
  → assign to project → track deliverables
  → block payment if NSITF/tax expired
```

### 4.14 Labour & Equipment Records

**Sub-features:**
- Daily manpower from site tracker
- Equipment hours from site tracker
- Labour attendance rollup
- Equipment allocation per project

**Workflow:**
```
Site tracker §3 and §4 feed labour/equipment analytics
  → monthly reports for PM and finance
```

### 4.15 Drone Inspection Uploads

**Phase:** P2

**Sub-features:**
- Upload drone photos/video to project
- GPS and date metadata
- Link to milestone

**Workflow:**
```
PM uploads drone survey → tagged to project/milestone → visible in client portal
```

---

## 5. Procurement & Internal Operations

**Phase:** P2 (full) · P1 (material requests only)

### 5.1 Purchase Order Module

**Sub-features:**
- PO creation from material request or manual
- Supplier selection
- Line items, qty, price
- Delivery date
- Approval chain
- GRN (goods received note) on delivery
- PO vs delivery inspection

**Workflow:**
```
PM/Procurement creates PO → approved → sent to supplier
  → delivery arrives → Store inspects vs PO
  → GRN recorded → inventory updated
```

### 5.2 Store & Inventory Module

**Sub-features:**
- Real-time stock per site
- Material categories and UoM
- Receive, issue, adjust
- Monthly reconciliation report (Team Charter)
- Slow-moving / damaged / expired alerts
- Zero unrecorded issuance enforcement
- Theft/shortage incident form

**Workflow:**
```
Delivery GRN → stock in
  → approved material request → stock out
  → monthly: Store Manager reconciliation → management report
  → discrepancy → incident form → PM + HR
```

### 5.3 Procurement Module

**Sub-features:**
- Supplier registry
- Quote comparison
- Local sourcing preference (Team Charter)
- Strategic sourcing for materials
- Delivery scheduling aligned to project timeline
- Vendor performance scoring

**Workflow:**
```
Material need identified → RFQ to suppliers
  → quotes compared → PO issued → tracked to delivery
```

### 5.4 Expense Management

**Sub-features:**
- Expense claims
- Categories (site, office, travel)
- Receipt upload
- Approval workflow
- Budget vs actual

**Workflow:**
```
Staff submits expense → PM/Finance approves → recorded against project or overhead
```

### 5.5 Petty Cash Module

**Sub-features:**
- Petty cash float per site/office
- Disbursement log
- Replenishment request
- Reconciliation

**Workflow:**
```
Petty cash request → approve → disburse → monthly reconcile
```

### 5.6 Vehicle & Fuel Management

**Sub-features:**
- Company vehicle registry
- Trip log
- Fuel records
- Maintenance schedule
- Authorized driver check

**Workflow:**
```
Driver logs trip + fuel → linked to project cost → maintenance alerts
```

### 5.7 Office Assets Module

**Sub-features:**
- Asset registry (tools, equipment, IT)
- Assignment to staff/project
- Damage/loss reporting

**Workflow:**
```
Asset purchased → registered → assigned → periodic audit
```

### 5.8 Utility Bills & Office Maintenance

**Sub-features:**
- Bill tracking and payment schedule
- Office maintenance tickets

**Workflow:**
```
Finance logs bill → payment scheduled → paid → archived
```

### 5.9 Budgeting Module

**Sub-features:**
- Project budget from BOQ
- Monthly variance report (PM → management)
- Budget revision via change log

**Workflow:**
```
BOQ sets budget → actuals from materials/expenses
  → monthly variance → PM report → CEO dashboard
```

---

## 6. CRM & Sales

**Phase:** P1 (core) · P2 (agents)

### 6.1 Lead Management Module

**Sub-features:**
- Lead capture (web, WhatsApp, Instagram, walk-in, referral, phone)
- Lead profile (name, phone, email, preferences)
- Source tagging and UTM
- Lead scoring (P2)
- Pipeline stages: Inquiry → Contacted → Viewing → Negotiation → Reserved → Won / Lost
- Follow-up reminders
- Communication history
- Notes and attachments
- Appointment scheduling
- Deal value tracking

**Workflow:**
```
Lead captured → assigned to sales/agent
  → activities logged → follow-up reminders fire
  → stage advanced → on Won: convert to client
  → create portal access, link listing/plot, trigger allocation
```

### 6.2 Client Profiles Module

**Sub-features:**
- Buyer/seller/investor profiles
- Buyer preferences (area, type, budget, plan)
- Purchase history
- Linked plots/listings/projects
- Communication history
- Document vault

**Workflow:**
```
Lead converts → client record created
  → all purchases, payments, portal access linked
```

### 6.3 Agent Management Module

**Phase:** P2

**Sub-features:**
- Agent profiles and KYC
- Territory assignment
- Sales targets
- Performance dashboard
- Commission calculation and payout
- Activity tracking
- Rankings/leaderboard
- Attendance (via HR role)
- Leave management
- License expiry reminders
- Agent document storage

**Workflow:**
```
Agent onboarded → KYC verified → territory assigned
  → leads assigned → deals closed → commission calculated
  → finance approves payout
```

### 6.4 Tour & Viewing Scheduling

**Phase:** P2

**Sub-features:**
- Book property viewing
- Virtual/live video tour option
- Reschedule/cancel
- QR check-in at site gate
- Agent notification

**Workflow:**
```
Buyer books tour → agent/PM confirmed → QR generated
  → visitor checks in at gate → visit logged in CRM
```

### 6.5 Database — Stakeholder Registry

**Sub-features:**
- Property owners
- Engineers, architects, contractors
- Vendors, lawyers, surveyors
- Government agencies (FCDA, AEPB, etc.)
- Banks, mortgage companies
- Estate associations
- Employees

**Workflow:**
```
Central contact registry → linked to projects, documents, communications
```

---

## 7. Finance & Payments

**Phase:** P1 (core) · P2 (Paystack)

### 7.1 Invoicing Module

**Sample:** `invoice Triple A.docx` · **Module for ALL clients/contracts**  
**Feature ID:** `FORM_INVOICE` · **Phase:** P1

**Sub-features:**
- Invoice types: sales, variation, agency, service, rental
- Header: invoice no (`AAA/{YEAR}/{TYPE}-{SEQ}`), date, contract ref
- Client / Bill To block
- Project location block
- Line items: description, qty, unit, unit price, total
- Variation block (V-01, V-02…) linked to change log
- Summary: base value, variations, revised total, paid to date, outstanding
- Payment terms and technical notes
- Settlement routing (bank name, account name, number) — multi-entity config
- Invoice lifecycle: Draft → Sent → Partially Paid → Paid → Overdue → Cancelled
- PDF generation matching sample layout

**Workflow:**
```
Finance creates invoice from contract/BOQ
  → adds variation lines from approved change log
  → sends to client (portal + PDF)
  → client pays → proof uploaded → verified
  → outstanding recalculated → receipt generated
```

### 7.2 Payment Ledger Module

**Sub-features:**
- Payment records per client/plot/project
- Methods: bank transfer, cash, cheque, online (P2)
- Proof of payment upload
- Manual verification by finance
- Milestone payment labels (Milestone 1, 2, 3…)
- Installment schedule
- Outstanding balance (auto-calculated)
- Refund processing

**Workflow:**
```
Invoice sent → client pays via bank transfer
  → uploads proof in portal
  → finance verifies → payment recorded
  → receipt PDF → ledger updated
  → if reservation: trigger allocation
  → if milestone: check gate unlock
```

### 7.3 Installment Schedule Generator

**Sub-features:**
- Plan types: Outright, 6M, 12M, 18M, Flexible, Custom
- Auto-schedule from listing price tier selected
- Due dates and amounts
- Reminder notifications
- Late payment flagging

**Workflow:**
```
Client selects payment plan at reservation
  → system picks correct price tier from listing
  → generates N installments with due dates
  → each due → reminder → payment → verify → receipt
```

### 7.4 Receipt Generation Module

**Sub-features:**
- Auto receipt number `RCP-{YEAR}-{SEQ}`
- Branded PDF (Triple A logo, CAC, SCUML)
- Amount in words
- Outstanding balance after payment
- Installment schedule reference

**Workflow:**
```
Payment verified → receipt auto-generated → client downloads from portal
```

### 7.5 Allocation Letter Generator

**Sub-features:**
- Triggered on reservation payment verified
- Branded PDF with plot details, conditions
- Client signature capture
- Plot status → allocated

**Workflow:**
```
Reservation payment verified → allocation letter PDF generated
  → client notified → portal access to documents
  → plot status updated
```

### 7.6 Commission Payouts

**Phase:** P2

**Sub-features:**
- Commission rules engine (% splits, tiers)
- Calculate on deal close
- Payout approval
- Payment record

**Workflow:**
```
Deal marked Won → commission calculated per rules
  → finance approves → agent paid → record in ledger
```

### 7.7 Financial Reports

**Sub-features:**
- Revenue dashboard
- Cash flow report
- Outstanding receivables aging
- Project budget variance
- Tax reports (P2)
- Profitability by project
- Export CSV/Excel

**Workflow:**
```
Finance runs report for period → filters by project/client
  → export for accountants / FIRS
```

### 7.8 Online Payment Gateway

**Phase:** P2 · **Reference:** Pix Payment Research (QR/instant patterns)

**Sub-features:**
- Paystack integration (cards, transfer, USSD)
- Dynamic QR on invoice PDF
- Webhook auto-verification
- Recurring installment debit (Pix Automático pattern)

**Workflow:**
```
Client clicks Pay Now → Paystack checkout → webhook confirms
  → auto-verify payment → receipt generated (no manual step)
```

### 7.9 Escrow Workflow Tracker

**Phase:** P2

**Sub-features:**
- Escrow state machine (funds held → released)
- Milestone-triggered release
- No blockchain — workflow tracking only

**Workflow:**
```
Client pays into escrow marker → funds held
  → milestone certified → release tranche → seller/developer paid
```

---

## 8. Client Portal

**Phase:** P1  
**Users:** Property buyers, investors with allocated units

### 8.1 Authentication & Profile

**Sub-features:**
- Email + password login
- Profile view/edit (contact details)
- NDPR consent on signup
- Password reset

**Workflow:**
```
Lead converts to client → invite email sent
  → client sets password → consents to privacy policy → access granted
```

### 8.2 Property Dashboard

**Sub-features:**
- My property/plot summary
- Assigned PM contact
- Current milestone and %
- Next payment due
- Recent activity feed

**Workflow:**
```
Client logs in → dashboard loads from plot + project + finance data
```

### 8.3 Construction Progress View

**Sub-features:**
- Milestone timeline (Foundation → Shell → Finishing)
- Progress percentage
- Approved site photo gallery
- Weekly PM report downloads
- Approved change orders (open-book Agile)

**Workflow:**
```
PM approves daily logs → summaries roll to portal
  → photos from approved logs visible
  → client sees transparent progress (no raw foreman notes)
```

### 8.4 Payments & Receipts

**Sub-features:**
- Invoice list with status
- Installment schedule
- Outstanding balance
- Upload bank transfer proof
- Download receipt PDFs
- Settlement routing display

**Workflow:**
```
Client views due invoice → pays offline → uploads proof
  → finance verifies → receipt available
```

### 8.5 Documents Vault

**Sub-features:**
- Contracts, allocation letters, permits
- Engineering certificates
- Receipts
- Version history
- Download PDF

**Workflow:**
```
Documents generated/ uploaded by PM → client sees in vault
  → new version replaces with history preserved
```

### 8.6 Messaging

**Sub-features:**
- Thread with assigned PM
- In-app messages
- File attachments
- Read receipts

**Workflow:**
```
Client sends message → PM notified → reply in thread
  → optional WhatsApp link for urgent
```

### 8.7 Support & Inspection Requests

**Sub-features:**
- Request site inspection visit
- Report snag (pre-handover)
- General support ticket

**Workflow:**
```
Client submits request → PM receives → schedules → updates client
```

### 8.8 Online Payment (Gateway)

**Phase:** P2

**Sub-features:**
- Pay Now button on invoice
- Card/transfer/USSD via Paystack

**Workflow:**
```
Client pays online → auto-verified → receipt instant
```

---

## 9. Rentals & Estate Terrier

**Phase:** P1  
**Samples:** Tenant Application docx, Estate Terrier 2.pdf (Dawaki)

### 9.1 Tenant Application Module

**Feature ID:** `FORM_TENANT_APPLICATION` · **Module for ANY rental unit**

**Sub-features:**
- 23 personal/guarantor fields (exact from form)
- Digital fill + e-signature
- Legal clause 1: not a rental agreement until approved
- Legal clause 2: 20% agency/legal fee acceptance
- Agency fee auto-calc = rent × 0.20
- Inspection date field
- Application status: Pending / Approved / Rejected

**Workflow:**
```
Prospect fills application → accepts clauses
  → agency fee calculated → agency invoice generated
  → PM reviews → approve: create tenant profile
  → reject: notify with reason
```

### 9.2 Estate Terrier Module

**Sample:** Dawaki Block of Flats · **Module for EVERY managed estate**

**Sub-features:**
- Register title per estate (e.g. "Estate Terrier for Dawaki Block of Flat")
- 16 columns: S/NO, property type, location, tenant name, phone, rent paid/fixed, rent amount, payment mode, date paid, tenancy start/end, caution deposit, service charge, expense description, expense amount, net rental income
- Net income auto-calc: rent - expenses
- Occupancy dashboard
- Arrears tracking
- Lease expiry alerts (60 days)
- Clone register per new estate

**Workflow:**
```
Estate created → Terrier register instantiated
  → tenant approved → row filled
  → rent paid → DATE PAID + PAID/FIXED updated
  → expense logged → net income recalculated
  → tenancy ending → alert PM + tenant
```

### 9.3 Rent Collection Module

**Sub-features:**
- Rent due reminders
- Payment recording
- Arrears flagging
- Rent receipt generation

**Workflow:**
```
Rent due date approaches → reminder sent
  → payment received → Terrier updated → receipt issued
```

### 9.4 Short Let Management

**Phase:** P2

**Sub-features:**
- Short let listings (separate from sale)
- Booking calendar
- Nightly/weekly rates
- Guest check-in/out

**Workflow:**
```
Listing flagged short-let → bookings managed → payment → access instructions
```

---

## 10. Facilities Management

**Phase:** P2

### 10.1 Maintenance Ticket Module

**Sub-features:**
- Ticket creation (client, PM, tenant)
- Category: plumbing, electrical, structural, general
- Priority and SLA timer
- Technician assignment
- Status: Open → Assigned → In Progress → Resolved → Closed
- Service history per unit

**Workflow:**
```
Ticket raised → assigned to technician → SLA countdown
  → resolved → client confirms → closed
  → history linked to unit record (incl. original construction docs)
```

### 10.2 Facility Management Contracts

**Sub-features:**
- FM contract registry
- Service scope and pricing
- Renewal reminders
- SLA definitions

**Workflow:**
```
FM contract created → services scheduled → renewal alerts
```

---

## 11. Maps & GIS

**Phase:** P1 (basic) · P2 (advanced)

### 11.1 Estate Plot Map

**Sub-features:**
- Leaflet + OpenStreetMap
- Plot polygons color-coded by status
- Click plot → status, inquiry CTA (public) or owner/payment (internal)
- GPS coordinates per plot/project
- Manual pin from site photo EXIF

**Workflow:**
```
Admin draws plot boundaries → assigns status
  → public map shows available plots
  → internal map shows full details per role
```

### 11.2 Project Site Map

**Sub-features:**
- Site boundary pin (e.g. Mpape GPS 9.138573°N, 7.493037°E)
- Satellite imagery layer
- Nearby landmarks

**Workflow:**
```
Project created → GPS set → appears on project page and dashboard
```

### 11.3 Interactive City Map (Public Listings)

**Phase:** P2

**Sub-features:**
- Listing pins across Abuja
- Cluster view
- Nearby: schools, hospitals, malls (manual/curated data)

**Workflow:**
```
Listings with coords → map view on public site → click pin → listing detail
```

### 11.4 Map Draw Search

**Phase:** P3

**Sub-features:**
- Draw polygon on map → find listings within area

**Workflow:**
```
User draws area → spatial query → filtered results
```

---

## 12. Document Management

**Phase:** P1

### 12.1 Document Store Module

**Sub-features:**
- Upload: PDF, images, drawings, contracts
- Categories: Contract, Permit, Receipt, Drawing, Certificate, C of O, Survey Plan, Allocation Letter, BOQ, Other
- Polymorphic link: project, client, plot, listing, tenant, employee
- Version history (v1, v2…)
- Full-text search on metadata
- Role-based access
- Signed URL downloads

**Workflow:**
```
User uploads document → categorizes → links to entity
  → new version supersedes → old version retained
  → authorized roles download
```

### 12.2 PDF Generation Engine

**Sub-features:**
- Site log PDF
- Invoice PDF
- Receipt PDF
- Allocation letter PDF
- Change log Excel export
- Tenant application PDF
- Estate Terrier report
- Branded with Triple A logo and colors

**Workflow:**
```
Trigger event (approval, payment, etc.) → template populated → PDF generated → stored in document vault
```

### 12.3 Digital Signatures

**Phase:** P2

**Sub-features:**
- Client sign allocation letter
- Guarantor sign tenant application
- Contract signing

**Workflow:**
```
Document sent for signature → client signs in portal → stored with timestamp
```

---

## 13. People, HR & Access Control

**Phase:** P1 (RBAC) · P2 (full HR)

### 13.1 RBAC — Role-Based Access Control

**Sub-features:**
- Roles: CEO, PM, Foreman, Engineer (Structural/M&E), Architect, Store Manager, Logistics, Security, Artisan (by trade), Sales, Agent, Finance, HR, Client, Tenant, Marketing
- Permissions per module and action (CRUD)
- Field-level permissions
- Site-scoped access (user sees only assigned sites)
- Audit log on permission changes

**Workflow:**
```
Admin assigns role + site → user sees only authorized modules/data
  → every action logged
```

### 13.2 User Management

**Sub-features:**
- User profiles with photo, contact, credentials
- Multi-site assignment
- Active/inactive status
- Password policies
- Session management

**Workflow:**
```
HR/Admin creates user → assigns role and site → invite to set password
```

### 13.3 HR — Employee Records

**Phase:** P2

**Sub-features:**
- Employee registry
- Recruitment pipeline
- Onboarding checklist
- Team Charter acknowledgement e-signature
- Attendance (site + office)
- Leave management
- Payroll integration
- Performance reviews (quarterly + project end)
- Training records
- Certification storage (COREN, trade tests, degrees)
- Disciplinary records (verbal → written → suspension → dismissal)

**Workflow:**
```
New hire → charter acknowledged → onboarding tasks
  → quarterly review → KPIs from dashboards feed review
  → misconduct → progressive discipline logged
```

### 13.4 Credential Expiry Tracker

**Sub-features:**
- COREN licence (e.g. Engr. Kanadi — Dec 2025)
- SCUML registration
- NSITF (subcontractors)
- Agent licences
- 90 / 30 / 7 day alerts

**Workflow:**
```
Credential uploaded with expiry → cron checks daily
  → alert at thresholds → block assignment if expired (engineers)
```

### 13.5 Security Gate — Visitor & Vehicle Log

**Phase:** P2

**Sub-features:**
- Visitor register: name, purpose, escort, entry/exit time
- Vehicle log: plate, driver, material in/out
- PM authorization required for visitors
- Shift handover report
- QR visit pass

**Workflow:**
```
Visitor arrives → security logs entry → verifies PM approval
  → escorts on site → logs exit
  → shift end → handover report filed
```

### 13.6 Whistleblower Channel

**Phase:** P2

**Sub-features:**
- Confidential submission
- Anonymous option
- CEO-only access
- No retaliation tracking
- Categories: fraud, bribery, safety, harassment

**Workflow:**
```
User submits report → encrypted storage → CEO notified
  → investigation tracked → outcome logged
```

---

## 14. Communication Hub

**Phase:** P1 (basic) · P2 (full)

### 14.1 In-App Notifications

**Sub-features:**
- Notification center per user
- Read/unread state
- Action links (approve, view, reply)
- Notification preferences

**Workflow:**
```
System event fires → notification created → user sees in bell icon
  → click → navigates to relevant record
```

### 14.2 Email (SMTP)

**Sub-features:**
- Transactional: receipts, alerts, invites, reminders
- Templates with branding
- Bulk email (P2)

**Workflow:**
```
Event trigger → template rendered → SMTP send → delivery logged
```

### 14.3 WhatsApp Integration

**Sub-features:**
- P1: `wa.me` deep links on listings/CTAs
- P1: Click tracking analytics
- P2: Manual paste of conversations into CRM
- P3: WhatsApp Business API (if budget allows)

**Workflow:**
```
Public CTA → opens WhatsApp with pre-filled message
  → click logged in analytics
```

### 14.4 SMS Gateway

**Phase:** P2

**Sub-features:**
- Payment reminders
- Rent due alerts
- Appointment confirmations

**Workflow:**
```
Scheduled job → SMS sent via gateway → delivery status logged
```

### 14.5 Internal Chat

**Phase:** P2

**Sub-features:**
- Team channels per project/site
- Direct messages
- File sharing
- @mentions

**Workflow:**
```
PM creates project channel → team members auto-joined → real-time chat
```

### 14.6 Meeting Scheduling

**Phase:** P2

**Sub-features:**
- Calendar booking
- Client consultations
- Site meetings
- Meeting notes → action items

**Workflow:**
```
Book meeting → invites sent → notes logged post-meeting → action items tracked
```

---

## 15. Marketing & Social Media

**Phase:** P2 · **Source:** Content Calendar (Document 1)

### 15.1 Social Content Calendar Module

**Sub-features:**
- Monthly calendar view (Dec 2025 – Mar 2026 template)
- Post scheduling with date, content, platforms
- Content type tags: Educational / Promotional / Engaging / Proof
- Property-to-post linking (Jikwoyi Plaza, Mall Mpape, etc.)
- Platform tags: Instagram, Facebook, LinkedIn, TikTok, WhatsApp Status
- Content goals tracker (25% engagement boost target)
- Approval queue for site photos (Team Charter rule)

**Workflow:**
```
Marketing creates post → links property → schedules date
  → approval if site photo → publishes (manual or API P3)
  → engagement tracked
```

### 15.2 Newsletter & Drip Campaigns

**Phase:** P2

**Sub-features:**
- Newsletter builder
- Drip sequences
- Birthday messages
- Campaign analytics

**Workflow:**
```
Subscribe on inquiry → drip sequence starts → analytics tracked
```

### 15.3 Landing Pages

**Phase:** P2

**Sub-features:**
- Campaign-specific landing pages
- Lead capture form
- UTM tracking

**Workflow:**
```
Create landing page → share URL → leads captured with campaign tag
```

### 15.4 Blog / Insights

**Phase:** P2

**Sub-features:**
- Educational articles (construction tips, budgeting)
- Case studies
- SEO optimization

**Workflow:**
```
Marketing publishes article → indexed on public site → linked from social
```

---

## 16. Workflow Automation & Notifications

**Phase:** P1 (core rules) · P2 (full engine)

### 16.1 Approval Chains

**Sub-features:**
- Material request: Foreman → PM → Store
- Change log: Originator → PM → CEO (if High)
- Invoice: Finance → PM review
- Listing: Sales → Manager
- Document: role-based approve

**Workflow:**
```
Record submitted → routes to approver queue
  → approved/rejected → next step or rollback
  → audit trail maintained
```

### 16.2 Auto-Assignment Rules

**Phase:** P2

**Sub-features:**
- Auto-assign leads by territory/source
- Auto-assign engineers to projects
- Round-robin for sales

**Workflow:**
```
Lead created → rule matches → assigned to agent automatically
```

### 16.3 Reminder & Escalation Engine

**Sub-features:**
- Daily log deadline (18:00)
- Payment due reminders
- Credential expiry
- Lease termination
- SLA timers (HSE 48h, design discrepancy 24h)
- Escalation on overdue (PM → CEO)

**Workflow:**
```
Cron checks deadlines → reminder sent
  → if still overdue → escalate to next role
```

### 16.4 Contract & Document Expiry Reminders

**Sub-features:**
- FM contract renewal
- Subcontractor compliance expiry
- Permit renewal

**Workflow:**
```
Expiry date approaching → alert owner → renewal task created
```

---

## 17. Executive Dashboard & Analytics

**Phase:** P1 (basic) · P2 (full)

### 17.1 CEO Dashboard

**Sub-features:**
- Revenue MTD / YTD
- Outstanding receivables
- Active projects by site with health score
- Daily log submission rate per site
- Open change requests
- CRM pipeline summary
- Rental net income (Estate Terrier rollup)
- Compliance alerts (COREN, FCDA permits)
- Lead conversion rate

**Workflow:**
```
Real-time aggregation from all modules → CEO logs in → single view
```

### 17.2 PM Dashboard

**Sub-features:**
- My projects and milestone %
- Pending daily log approvals
- Material request queue
- Open issues/delays from site tracker
- Client payment status
- Upcoming inspections

**Workflow:**
```
PM logs in → sees action queue → approves/processes items
```

### 17.3 Reports & Analytics Module

**Sub-features:**
- Sales reports
- Marketing campaign reports
- Financial reports
- Project progress reports
- Agent performance (P2)
- Customer acquisition
- Inventory reports (P2)
- Construction analytics
- Expense/profitability
- Custom date range export CSV/Excel

**Workflow:**
```
User selects report type + filters → generates → views or exports
```

### 17.4 Role KPI Dashboards

**Sub-features:**
- PM: on-time %, budget variance, client satisfaction
- Foreman: log completion rate, rework incidents, safety violations
- Store: stock accuracy, reconciliation timeliness
- Security: incidents, visitor compliance
- Engineer: cert on-time, open risk flags

**Workflow:**
```
KPIs calculated from operational data → displayed per role
  → feeds quarterly performance reviews
```

---

## 18. Compliance, Trust & Security

**Phase:** P1 (core) · ongoing

### 18.1 Regulatory Compliance Module

**Sub-features:**
- FCDA permit gate (block milestone without permit)
- COREN engineer verification
- SCUML display (RN SC 151840932)
- CAC display (RC 8168740)
- NSITF subcontractor check
- NNQP quality alignment
- National Building Code checklist
- AEPB, AMMC, NESREA flags per project

**Workflow:**
```
Compliance doc uploaded → validated → gate unlocked
  → missing doc → milestone blocked → alert PM
```

### 18.2 NDPR Data Protection

**Sub-features:**
- Privacy policy page
- Consent capture on signup
- Marketing consent separate
- Data subject access request (export)
- Deletion request (with legal exceptions)
- Record of Processing Activities (ROPA)
- Breach notification playbook
- DPO designation

**Workflow:**
```
User signs up → consent recorded
  → data request → export generated within SLA
  → breach detected → playbook triggered
```

### 18.3 Audit Log

**Sub-features:**
- Append-only event store
- Who, what, when, before/after values
- Financial, legal, construction, permission changes
- CEO/auditor read access

**Workflow:**
```
Any protected record changed → audit event written automatically
```

### 18.4 Application Security

**Sub-features:**
- HTTPS/TLS
- HTTP-only session cookies
- Rate limiting on auth and forms
- File upload validation
- Role-checked downloads
- PII encryption at rest

---

## 19. Search, Discovery & Intelligence

**Phase:** P2 (comparison, saved) · P3 (AI)

### 19.1 Property Comparison

**Phase:** P2

**Sub-features:**
- Side-by-side: price, size, rooms, finish, plan, location
- ROI and rental yield (where data available)
- Save comparison

**Workflow:**
```
User selects 2–4 listings → comparison view generated
```

### 19.2 Saved Searches & Collections

**Phase:** P2

**Sub-features:**
- Save filter combinations
- Email alert on new matches
- Folders: Investment, Family House, Land, Abuja, etc.

**Workflow:**
```
User saves search → cron checks new listings → email if match
```

### 19.3 Property Timeline

**Phase:** P2

**Sub-features:**
- Listed date, price changes, status changes
- Inspections, documents, maintenance history

**Workflow:**
```
Events on listing/plot logged chronologically → visible to internal users and client
```

### 19.4 AI Property Match

**Phase:** P3

**Sub-features:**
- Lifestyle/budget/family-size recommendations
- "Because you liked…" suggestions

**Workflow:**
```
User profile + behavior → rule-based/ML recommendations displayed
```

### 19.5 Smart Search

**Phase:** P3

**Sub-features:**
- Conversational query
- Voice search
- Commute time filter (needs routing API)

### 19.6 AI Property Valuation

**Phase:** P3

**Sub-features:**
- Market value estimate
- Rental value
- Appreciation forecast
- Investment score

### 19.7 AI Assistant

**Phase:** P3

**Sub-features:**
- Answer client questions
- Draft emails
- Generate contract drafts
- Meeting summaries
- Follow-up suggestions
- Sales forecasting

**Workflow:**
```
User asks question → AI responds using listing/project data context
```

---

## 20. Advanced Differentiators

| Feature | Phase | Workflow summary |
|---|---|---|
| **Digital contract signing** | P2 | Contract sent → client signs in portal → stored signed PDF |
| **Online property reservation** | P1 | Client pays reservation fee → plot reserved → allocation triggered |
| **Mortgage eligibility calculator** | P2 | Client inputs income → indicative eligibility → partner referral |
| **Visitor QR check-in** | P2 | QR generated → scanned at gate → visit logged |
| **Estate security & access control** | P2 | Authorized visitor list → QR → gate module |
| **Drone inspection uploads** | P2 | Upload → tag to milestone → client portal |
| **360° virtual tours** | P3 | Panorama upload → self-hosted viewer |
| **3D & AR walkthroughs** | P3 | 3D model embed → AR on mobile |
| **Auction management** | P3 | List property → bids → close |
| **Land title verification** | P3 | Integrate verify.propertypro.ng pattern or internal checklist |
| **Multi-branch / white-label** | P3 | `organization_id` → branded instance |
| **Mobile native apps** | P3 | iOS/Android for agents, engineers, clients |
| **IoT / smart building** | DEF | Deferred until requested |

---

## 21. Cross-Cutting Platform Services

### 21.1 Authentication Service
- Email/password, session, password reset, MFA (P2)

### 21.2 PDF Service
- All branded document generation

### 21.3 File Storage Service
- Local → S3-compatible (MinIO/R2)
- Signed URLs, image compression

### 21.4 Notification Service
- In-app + email + SMS orchestration

### 21.5 Search Service
- PostgreSQL full-text + spatial (PostGIS P2)

### 21.6 Export Service
- CSV/Excel export for all major modules

### 21.7 Cron / Job Scheduler
- Reminders, alerts, report generation, CAR due dates

### 21.8 API Layer
- REST/GraphQL for mobile apps (P3)

---

## 22. Phase Summary Matrix

| Module | P1 | P2 | P3 |
|---|---|---|---|
| Public website & listings | ✓ | ✓ | ✓ |
| Site Tracker (all sites) | ✓ | ✓ | ✓ |
| Project Change Log | ✓ | ✓ | ✓ |
| Invoicing & payment proof | ✓ | ✓ | ✓ |
| Client Portal | ✓ | ✓ | ✓ |
| CRM & leads | ✓ | ✓ | ✓ |
| Tenant App + Estate Terrier | ✓ | ✓ | ✓ |
| Milestones & plot map | ✓ | ✓ | ✓ |
| Material requests | ✓ | ✓ | ✓ |
| RBAC & audit log | ✓ | ✓ | ✓ |
| Paystack / online pay | | ✓ | ✓ |
| Agent commissions | | ✓ | ✓ |
| Store & inventory | | ✓ | ✓ |
| Social content calendar | | ✓ | ✓ |
| Facilities / maintenance | | ✓ | ✓ |
| Security gate log | | ✓ | ✓ |
| Full HR & payroll | | ✓ | ✓ |
| Property comparison | | ✓ | ✓ |
| AI / smart search / 3D | | | ✓ |
| Multi-branch white-label | | | ✓ |
| IoT | | | DEF |

---

## Document References

| Need detail on… | See |
|---|---|
| Exact form fields | `OPERATIONAL_FORMS.md` |
| Module workflows | `APP_WORKFLOWS.md` |
| Persona journeys | `USER_JOURNEYS.md` |
| Phase 1 acceptance tests | `PHASE1_SCOPE.md` |
| Tech stack | `PRODUCT_DECISIONS.md` |
| Priority rules | `PROJECT_GOVERNANCE.md` |
| Listings seed data | `data/LISTINGS_SEED.json` |
| Raw document text | `planning/extractions/` |

---

*This catalog is the single source of truth for feature scope. Sample documents define module templates; Abraham's priority overrides Samuel's brainstorm per PROJECT_GOVERNANCE.md §1.*
