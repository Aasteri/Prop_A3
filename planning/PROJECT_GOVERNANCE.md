# Propa3 — Project Governance & Priority Rules

> **Effective:** Jul 15, 2026  
> **Applies to:** All requirements, design, and implementation decisions

---

## 1. Source Priority (Non-Negotiable)

When requirements conflict, resolve in this order:

| Priority | Source | Examples |
|---|---|---|
| **1 — Highest** | **Documents Abraham provides** | Contracts, BOQs, receipts, allocation letters, site forms, permits |
| **2** | **Abraham's direct instructions** | Scope changes, business rules, approvals, naming |
| **3** | **Extracted company materials** | Team Charter, Company Profile, Adobe shared docs |
| **4 — Lowest** | **Samuel's feature brainstorm** | Zillow-inspired ideas, AI modules, IoT — valuable but subordinate |

**Rule:** If Samuel suggests a feature that contradicts Abraham's Agile open-book model or Team Charter rules, **Abraham wins**.

**Rule:** If a document Abraham sends defines a field, workflow, or format — **implement that exactly**; do not improvise.

---

## 2. Sample Documents vs System Modules

**Critical principle (Abraham, Jul 16, 2026):**

Every uploaded document is a **representative sample** — it shows the **exact fields, layout, and workflow** that the system must replicate. It is **not** a single record for one site, project, or estate only.

| What you uploaded | What we build |
|---|---|
| Guzape Site Daily Tracker (one PDF) | **`Site Tracker` module** — same 10-section form for **every** active site (Jikwoyi, Mpape, Guzape II/III, Lugbe, future sites) |
| PROJECT CHANGE LOG.xlsx (Jikwoyi) | **`Project Change Log` module** — same 9 columns for **every** construction project |
| invoice Triple A.docx (one client) | **`Invoicing` module** — same layout for **all** clients, contracts, variations |
| TENANT APPLICATION FORM.docx | **`Tenant Application` module** — same 23 fields for **any** rental property |
| Estate Terrier 2.pdf (Dawaki) | **`Estate Terrier` module** — same 16-column register for **every** managed estate |
| FOR SALE PROPERTIES.pdf | **`Sales Listings` catalog** — grows with new properties; schema stays fixed |
| PROJECT STRUCTURE.pdf | **`Org / Sites` module** — template team structure applied per site |

### Architecture pattern: Module + Instance

```
Module (generic form/workflow — built once)
  └── Instance (bound to site_id / project_id / estate_id / listing_id)
        └── Records (daily logs, changes, invoices, tenants, etc.)
```

**Examples:**
- Site Tracker → instance per `site_id` → hundreds of daily log records
- Change Log → instance per `project_id` → many change rows per project
- Estate Terrier → instance per `estate_id` → one register per estate

Samples define **what the module looks like**. Abraham's future documents of the same type **fill more instances** — they do not require new modules.

---

## 3. Deferred / Excluded (For Now)

| Item | Status | Notes |
|---|---|---|
| **IoT / smart building** | **Deferred** | No sensors, BMS integration, or device APIs in any phase until explicitly requested |
| **Paid third-party APIs** | **Avoid unless essential** | Prefer code-first, self-hosted, or free-tier solutions |
| **Blockchain / crypto escrow** | **Excluded** | Not aligned with Triple A's Nigerian regulatory context |
| **Full AI valuation (ML models)** | **Phase 3+** | Rule-based estimates OK in Phase 1; no paid AI APIs required |

---

## 4. Must-Have Long-Run Features (No Paid API — Build With Code)

These are **not optional** at the architecture level — design the data model and services to support them from Phase 1, even if UI ships later.

### Trust & Compliance (build in-house)
- **Audit log** — every create/update/delete on financial, legal, and construction records
- **RBAC** — 15+ roles from Team Charter with field-level permissions
- **Document version history** — contracts, drawings, permits
- **Credential expiry tracker** — COREN, SCUML, NSITF, subcontractor licences (email/in-app alerts)
- **Whistleblower channel** — confidential, encrypted submission per Team Charter §5.1
- **NDPR consent & privacy module** — consent capture, data export, deletion requests, processing register
- **FCDA permit gate** — block construction milestones without uploaded planning approval (Team Charter rule)

### Construction OS (differentiator — no external API)
- **Daily site log** — digitized from Document 2 (offline-capable PWA)
- **Milestone engine** — Foundation → Shell → Finishing with % rollup
- **BOQ & material request workflow** — approval chain Foreman → PM → Store
- **Change order / variation register** — Agile "welcome change" with audit trail
- **Snag list & defect tracking** — pre-handover checklist
- **Site photo gallery** — EXIF GPS/date extraction from uploads (proves location/time)
- **Quality checklist** — slump test, cube casting, reinforcement inspection flags
- **Phase retrospective log** — Agile principle #12 after each milestone

### Sales & Client (external + internal bridge)
- **Installment schedule generator** — configurable plans; no payment API needed initially
- **Bank transfer proof upload** — manual verification workflow before gateway integration
- **QR site-visit check-in** — generate QR locally; scan on arrival (no paid API)
- **Client portal milestone view** — open-book progress, documents, payments
- **Lead pipeline** — CRM stages with WhatsApp deep-link (`wa.me`) for outreach
- **Property comparison engine** — own listing data only
- **Saved searches & email alerts** — PostgreSQL + SMTP/cron

### Operations (ERP-lite without paid services)
- **Commission calculator** — rule engine once Abraham confirms % splits
- **PDF generator** — receipts, allocation letters, site reports (open-source libs)
- **Export CSV/Excel** — finance, inventory, site logs for accountants
- **Internal notifications** — in-app + email; SMS optional later
- **Social content calendar** — link posts to properties (from Document 1)
- **Visitor & vehicle log** — digitize security gate process from Team Charter

### Maps & GIS (free-tier strategy)
- **Leaflet + OpenStreetMap** — primary plot/estate maps (no API key)
- **Google Maps** — optional embed for public listing pages (free tier sufficient at launch)
- **Manual GPS pin** — from site photos or foreman input (Mpape coords already seeded)

### Facilities (post-handover — Phase 2+)
- **Maintenance ticket system** — SLA timers, technician assignment
- **Service history per unit** — links to original construction records

---

## 5. What Still Requires Abraham / Incoming Documents

| Item | Can we draft? | Needs client confirmation |
|---|---|---|
| BOQ template structure | ✅ Yes — industry standard + refine when doc arrives | Final column names, units |
| Material request form | ✅ Yes | Approval sign-off chain |
| Payment receipt layout | ✅ Yes — Triple A branding | Bank details, tax ID |
| Allocation letter | ✅ Yes — FCT standard clauses | Legal review by Abraham |
| Commission rules | ⚠️ Draft placeholder tiers | Actual % splits |
| Property prices | ⚠️ Market-range placeholders | Actual listing prices |
| Testimonials | ⚠️ Draft from project facts | Client quotes & permission |
| Office suite number | ❌ | D15B vs B15D |
| Estate spelling | ❌ | Bilamir vs Bilamm |

**When Abraham's documents arrive:** Replace draft templates in `planning/templates/` — do not delete drafts; version them.

---

## 6. Document Index (This Repository)

| File | Purpose |
|---|---|
| `REQUIREMENTS.md` | Master feature inventory + phase plan |
| `TEAM_CHARTER.md` | Roles, ethics, reporting, compliance bodies |
| `COMPANY_PROFILE.md` | Legal identity, team, portfolio seed data |
| `USER_JOURNEYS.md` | End-to-end flows per persona |
| `EXTERNAL_STRATEGY.md` | Public marketplace, competitors, NDPR, payments |
| `PRODUCT_DECISIONS.md` | Tech stack, architecture, mobile/offline |
| `PHASE1_SCOPE.md` | MVP definition of done + acceptance criteria |
| `MVP_INTERNAL.md` | MVP scope — internal-first, Abraham docs + Charter |
| `FEATURES_MASTER.md` | Complete feature catalog — all modules, sub-features, workflows |
| `OPERATIONAL_FORMS.md` | Real forms — exact replication specs (Jul 16 docs) |
| `APP_WORKFLOWS.md` | System workflows, automation, module map |
| `data/LISTINGS_SEED.json` | Sales catalog seed data |
| `planning/extractions/` | Raw text of all uploaded documents |
| `planning/templates/` | Form templates (authoritative: DAILY_SITE_LOG, PROJECT_CHANGE_LOG) |
| `planning/sources/abraham-uploads/` | Original client documents |

---

## 7. Change Control

1. New feature request → check priority table (§1)
2. If Priority 4 (Samuel) and not in Phase 1 scope → backlog, don't block MVP
3. If Priority 1–2 (Abraham/documents) → may reorder Phase 1; document in `PHASE1_SCOPE.md`
4. Any feature requiring paid API → flag in `PRODUCT_DECISIONS.md` with free alternative first
