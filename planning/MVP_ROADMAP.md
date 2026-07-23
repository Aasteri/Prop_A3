# Propa3 — Roadmap: Now → Deployable MVP

> **Goal:** Fully deployable MVP on AWS with domain, team-tested, Abraham's Tier 1 modules live  
> **Stack:** NestJS + Next.js + MySQL + Prisma + PM2 + Nginx + S3  
> **Scope:** `planning/MVP_INTERNAL.md` (internal-first) + minimal public/client surfaces  
> **Out of scope:** Zillow/AI/IoT, Paystack, full ERP, agent commissions, social calendar

**Legend:** ✅ Done · 🔄 In progress · ⬜ To do

---

## Current state (done)

- [x] Requirements & specs in `planning/`
- [x] Clean repo root + `planning/` archive
- [x] Local MySQL `prop_a3` (root, no password)
- [x] Prisma + starter schema (`users`, `sites`, `projects`)
- [x] NestJS API scaffold + `/api/health` verified
- [x] 4 sites seeded (JKW, MPP, GZ2, GZ3)
- [x] `.env` / `.env.example` / `.gitignore`

---

## Phase 0 — Project foundation (Week 1)

| # | Task | Owner | Depends on |
|---|---|---|---|
| 0.1 | ⬜ Scaffold **Next.js 15** app in `apps/web` | Dev | — |
| 0.2 | ⬜ Shared UI: Triple A brand (navy, orange, logo from `planning/sources/`) | Dev | 0.1 |
| 0.3 | ⬜ Monorepo scripts: `dev` runs API + web together | Dev | 0.1 |
| 0.4 | ⬜ API ↔ web env wiring (`NEXT_PUBLIC_API_URL`) | Dev | 0.1 |
| 0.5 | ⬜ Git repo init + first commit (no secrets) | Dev | — |
| 0.6 | ⬜ Abraham: confirm Triple A bank details vs Laucarie sample invoice | Abraham | — |
| 0.7 | ⬜ Abraham: send remaining docs (BOQ, material request, allocation letter) | Abraham | — |

---

## Phase 1 — Database & auth (Week 2–3)

### 1A Full Prisma schema

Design from `planning/MVP_INTERNAL.md` + `planning/OPERATIONAL_FORMS.md`.

| # | Model / area | Notes |
|---|---|---|
| 1.1 | ⬜ `User` extensions | `siteId`, role enum matches Team Charter |
| 1.2 | ⬜ `UserSiteAssignment` | Many-to-many user ↔ site |
| 1.3 | ⬜ `Client` | Converted from lead; links to portal user |
| 1.4 | ⬜ `Lead` + pipeline stages | CRM |
| 1.5 | ⬜ `Listing` | From FOR SALE PROPERTIES schema + multi-tier pricing |
| 1.6 | ⬜ `Estate`, `Plot`, `PlotStatus` | Development module |
| 1.7 | ⬜ `Milestone` + `MilestoneEvent` | Foundation → Shell → Finishing |
| 1.8 | ⬜ `DailySiteLog` + child tables | All 10 sections from Site Tracker sample |
| 1.9 | ⬜ `ProjectChangeLog` | 9 columns from Excel sample |
| 1.10 | ⬜ `Invoice`, `InvoiceLine`, `Payment`, `Receipt` | From invoice docx |
| 1.11 | ⬜ `MaterialRequest` + lines | Foreman → PM → Store |
| 1.12 | ⬜ `TenantApplication` | 23 fields |
| 1.13 | ⬜ `EstateTerrierRow` | 16 columns per estate |
| 1.14 | ⬜ `Document` | Polymorphic + version |
| 1.15 | ⬜ `HseIncident` | From site tracker flag |
| 1.16 | ⬜ `AuditLog` | Financial + doc + milestone changes |
| 1.17 | ⬜ `Notification` | In-app alerts |
| 1.18 | ⬜ Run `db:migrate` (proper migrations, not only push) | Dev |

### 1B Authentication & RBAC

| # | Task |
|---|---|
| 1.19 | ⬜ JWT auth module (Nest): register, login, refresh |
| 1.20 | ⬜ Password hashing (bcrypt) |
| 1.21 | ⬜ Role guards: CEO, PM, Foreman, Engineer, Finance, Sales, Client |
| 1.22 | ⬜ Site-scoped queries (foreman only sees assigned site) |
| 1.23 | ⬜ Next.js auth: login page, session/token storage, protected routes |
| 1.24 | ⬜ Seed admin/CEO user + demo PM + demo foreman per site |

---

## Phase 2 — Internal modules (Week 4–10)

Build order matches operational dependency.

### 2.1 Organization & projects

| # | Task | Ref |
|---|---|---|
| 2.1.1 | ⬜ Sites CRUD API (read-only for most roles) | Project Structure PDF |
| 2.1.2 | ⬜ Projects CRUD API scoped to site | MVP §1.2 |
| 2.1.3 | ⬜ Assign users to sites/projects | MVP §1.2 |
| 2.1.4 | ⬜ Admin UI: sites, projects, team assignment | — |
| 2.1.5 | ⬜ FCDA permit upload on project | Charter rule #1 |
| 2.1.6 | ⬜ Milestone gate: block Foundation 100% without permit | AC-4 |

### 2.2 Site Tracker module ⭐ (highest priority)

| # | Task | Ref |
|---|---|---|
| 2.2.1 | ⬜ API: create/submit daily log (all 10 sections) | Guzape PDF |
| 2.2.2 | ⬜ Auto ref code generator `AAA/{SITE}/{NUM}/{MONTH}/{YEAR}/{SEQ}` | OPERATIONAL_FORMS |
| 2.2.3 | ⬜ Activity rows: To do / Ongoing / Done + progress % | — |
| 2.2.4 | ⬜ Manpower by trade (iron benders, carpenters, etc.) | — |
| 2.2.5 | ⬜ Materials received/consumed/balance + negative alert | — |
| 2.2.6 | ⬜ Quality + safety checkboxes | NNQP / Charter |
| 2.2.7 | ⬜ Issues → PM notification | — |
| 2.2.8 | ⬜ Incident flag → auto HSE draft | — |
| 2.2.9 | ⬜ PM approve/reject log | — |
| 2.2.10 | ⬜ Photo upload (local disk dev → S3 prod) | — |
| 2.2.11 | ⬜ **PWA offline**: IndexedDB queue + sync | PRODUCT_DECISIONS |
| 2.2.12 | ⬜ Foreman mobile UI (responsive, large touch targets) | — |
| 2.2.13 | ⬜ Cron: 18:00 missing log alert | Charter rule #3 |
| 2.2.14 | ⬜ PDF export of approved log | — |

### 2.3 Milestones & engineer

| # | Task | Ref |
|---|---|---|
| 2.3.1 | ⬜ Milestone CRUD + progress rollup from logs | Agile model |
| 2.3.2 | ⬜ PM manual progress override | — |
| 2.3.3 | ⬜ Inspection checklist API + UI | OPERATIONAL_FORMS |
| 2.3.4 | ⬜ Engineer certification on milestone pass | Engr. Kanadi / COREN |
| 2.3.5 | ⬜ COREN licence expiry cron (90/30/7 days) | Company Profile |
| 2.3.6 | ⬜ Phase retrospective form after milestone | Agile §12 |

### 2.4 Project Change Log module ⭐

| # | Task | Ref |
|---|---|---|
| 2.4.1 | ⬜ CRUD with exact 9 columns | Jikwoyi Excel |
| 2.4.2 | ⬜ Workflow: in review → approved/rejected | — |
| 2.4.3 | ⬜ High impact → CEO approval gate | — |
| 2.4.4 | ⬜ Excel export matching original layout | — |
| 2.4.5 | ⬜ Link approved change → invoice variation | — |

### 2.5 Material requests

| # | Task | Ref |
|---|---|---|
| 2.5.1 | ⬜ Foreman create request | Charter rule #2 |
| 2.5.2 | ⬜ PM approve/reject | — |
| 2.5.3 | ⬜ Store issue qty (basic, no full inventory yet) | — |
| 2.5.4 | ⬜ Block issue without approval | Charter rule #6 |

### 2.6 Invoicing & payments ⭐

| # | Task | Ref |
|---|---|---|
| 2.6.1 | ⬜ Invoice CRUD matching docx layout | invoice Triple A |
| 2.6.2 | ⬜ Line items + variation block (V-01…) | — |
| 2.6.3 | ⬜ Revised total / paid / outstanding calc | — |
| 2.6.4 | ⬜ Settlement routing config (bank details) | Abraham confirm |
| 2.6.5 | ⬜ Installment schedule generator | FOR SALE payment plans |
| 2.6.6 | ⬜ Payment proof upload + finance verify queue | — |
| 2.6.7 | ⬜ Receipt PDF generation | PAYMENT_RECEIPT template |
| 2.6.8 | ⬜ Audit log on all payment state changes | AC-7 |

### 2.7 CRM & listings (internal admin)

| # | Task | Ref |
|---|---|---|
| 2.7.1 | ⬜ Lead capture API (manual + web form) | — |
| 2.7.2 | ⬜ Pipeline UI: Inquiry → Won/Lost | — |
| 2.7.3 | ⬜ Convert lead → client + portal invite | — |
| 2.7.4 | ⬜ Listings admin CRUD | FOR SALE PDF |
| 2.7.5 | ⬜ Import/expand `LISTINGS_SEED.json` | planning/data |
| 2.7.6 | ⬜ Multi-tier pricing (Outright/6M/12M/18M) | — |

### 2.8 Rentals

| # | Task | Ref |
|---|---|---|
| 2.8.1 | ⬜ Tenant Application form (23 fields + clauses) | docx |
| 2.8.2 | ⬜ 20% agency fee auto-calc + invoice | — |
| 2.8.3 | ⬜ Estate Terrier register per estate | Dawaki PDF |
| 2.8.4 | ⬜ Net rental income calc | — |
| 2.8.5 | ⬜ Tenancy expiry alerts | — |

### 2.9 Documents

| # | Task | Ref |
|---|---|---|
| 2.9.1 | ⬜ Upload/store by category | — |
| 2.9.2 | ⬜ Version history | — |
| 2.9.3 | ⬜ Allocation letter PDF generator | template |
| 2.9.4 | ⬜ S3 integration (local `uploads/` until AWS ready) | — |

### 2.10 Dashboards & reports

| # | Task | Ref |
|---|---|---|
| 2.10.1 | ⬜ PM dashboard (logs pending, materials, payments, changes) | MVP §2.7 |
| 2.10.2 | ⬜ CEO dashboard (4 sites health, revenue, leads, compliance) | MVP §2.8 |
| 2.10.3 | ⬜ Weekly PM report auto-draft from logs | Charter cadence |
| 2.10.4 | ⬜ In-app + email notifications | Phase 1 scope |

### 2.11 HSE

| # | Task | Ref |
|---|---|---|
| 2.11.1 | ⬜ HSE incident form (from tracker flag or manual) | — |
| 2.11.2 | ⬜ Same-day PM + CEO alert | Charter |

---

## Phase 3 — Client portal & minimal public (Week 11–13)

| # | Task | Ref |
|---|---|---|
| 3.1 | ⬜ Client login (separate route `/portal`) | — |
| 3.2 | ⬜ Dashboard: property, PM contact, next payment, milestone % | — |
| 3.3 | ⬜ Progress view + approved photo gallery | Agile open-book |
| 3.3 | ⬜ Payment schedule + proof upload + receipts | — |
| 3.4 | ⬜ Documents vault | — |
| 3.5 | ⬜ Approved change orders visible | — |
| 3.6 | ⬜ Message thread with PM | — |
| 3.7 | ⬜ Public homepage (brand, trust badges CAC/SCUML/COREN) | Tier 3 |
| 3.8 | ⬜ Project showcase pages (6 portfolio projects) | Company Profile |
| 3.9 | ⬜ Listing pages + search/filter | — |
| 3.10 | ⬜ Inquiry form → CRM lead | — |
| 3.11 | ⬜ WhatsApp + phone CTAs | — |
| 3.12 | ⬜ Privacy policy page (NDPR template) | EXTERNAL_STRATEGY |
| 3.13 | ⬜ Basic plot map (Leaflet) | — |

---

## Phase 4 — Polish & compliance (Week 14–15)

| # | Task |
|---|---|
| 4.1 | ⬜ End-to-end test all 10 MVP acceptance tests (`planning/MVP_INTERNAL.md` M1–M10) |
| 4.2 | ⬜ Seed production data: 6 projects, leadership users, sample listings |
| 4.3 | ⬜ Abraham UAT on staging with real site foremen |
| 4.4 | ⬜ Fix UAT feedback |
| 4.5 | ⬜ Security review: RBAC, file uploads, auth, SQL injection (Prisma handles), rate limits |
| 4.6 | ⬜ Error handling + loading states on all critical flows |
| 4.7 | ⬜ Mobile QA on foreman PWA (Android, poor connectivity simulation) |
| 4.8 | ⬜ Update `planning/PRODUCT_DECISIONS.md` (MySQL, Nest, AWS final) |

---

## Phase 5 — AWS staging deploy (Week 16–17)

| # | Task |
|---|---|
| 5.1 | ⬜ AWS IAM admin user + MFA on root + billing alarms ($10/$25/$50) |
| 5.2 | ⬜ EC2 `t4g.micro` Ubuntu 22.04 (staging) |
| 5.3 | ⬜ Security group: 22 (your IP), 80, 443 |
| 5.4 | ⬜ Install: Node 20, MySQL 8, Nginx, PM2 |
| 5.5 | ⬜ Create staging DB + app user (not root) |
| 5.6 | ⬜ S3 bucket for uploads (private, IAM user) |
| 5.7 | ⬜ Clone repo on EC2; `.env.staging` |
| 5.8 | ⬜ `npm run build:api && npm run build:web` |
| 5.9 | ⬜ PM2 ecosystem: API (4000) + Web (3000) |
| 5.10 | ⬜ Nginx reverse proxy: `/api` → Nest, `/` → Next |
| 5.11 | ⬜ Run migrations + seed on staging DB |
| 5.12 | ⬜ Team testing URL shared with Abraham's team |
| 5.13 | ⬜ Document deploy runbook in `docs/DEPLOY.md` |

---

## Phase 6 — Production deploy + domain (Week 18–19)

| # | Task |
|---|---|
| 6.1 | ⬜ Buy domain (Abraham) |
| 6.2 | ⬜ Production EC2 (or promote staging after UAT pass) |
| 6.3 | ⬜ Elastic IP attached |
| 6.4 | ⬜ Route 53 or registrar DNS → A record → Elastic IP |
| 6.5 | ⬜ Certbot SSL (Let's Encrypt) |
| 6.6 | ⬜ Production `.env`: strong JWT secret, DB password, S3 keys |
| 6.7 | ⬜ MySQL: dedicated app user, no empty password |
| 6.8 | ⬜ Final data migration: real listings, bank details, team accounts |
| 6.9 | ⬜ NDPR: privacy policy live, consent on signup |
| 6.10 | ⬜ Smoke test all critical paths on production URL |
| 6.11 | ⬜ Abraham sign-off (`planning/MVP_INTERNAL.md` sign-off table) |

---

## Phase 7 — MVP launch checklist

| # | Criterion | Test ref |
|---|---|---|
| 7.1 | Foreman submits offline log at any site; syncs | M1 |
| 7.2 | PM approves log; milestone % updates | M2 |
| 7.3 | Change log → invoice variation | M3 |
| 7.4 | Payment proof → receipt PDF | M4 |
| 7.5 | FCDA gate blocks Foundation without permit | M5 |
| 7.6 | Material request blocked without PM approval | M6 |
| 7.7 | Tenant application + 20% fee | M7 |
| 7.8 | CEO dashboard shows 4 sites | M8 |
| 7.9 | COREN expiry alert fires | M9 |
| 7.10 | HSE incident same-day alert | M10 |
| 7.11 | Client sees progress in portal | AC-2 |
| 7.12 | Public inquiry creates CRM lead | AC-5 |
| 7.13 | Daily log rate ≥ 90% on working days (30 days post-launch) | Success metric |
| 7.14 | Client portal adoption ≥ 70% allocated clients | Success metric |

---

## Explicitly NOT in deployable MVP

- Paystack / online card payments
- Agent commissions module
- Social media calendar
- Full store/inventory ERP
- Security gate / visitor log app
- Whistleblower module
- Full HR / payroll
- Facilities maintenance tickets
- AI form suggestions (post-MVP)
- IoT
- Property comparison, 3D tours, smart search

---

## Suggested parallel tracks

| Track | Who | Focus |
|---|---|---|
| **Backend** | Dev 1 | Prisma schema → Nest modules → PDF/notifications |
| **Frontend** | Dev 2 | Next.js internal UI → foreman PWA → client portal → public |
| **Abraham** | Client | Documents, bank details, UAT, domain, sign-off |
| **DevOps** | Dev 1 or 3 | AWS staging (Phase 5) after Site Tracker demo works locally |

---

## Estimated timeline

| Phase | Duration | Cumulative |
|---|---|---|
| 0 Foundation | 1 week | Week 1 |
| 1 DB + Auth | 2 weeks | Week 3 |
| 2 Internal modules | 7 weeks | Week 10 |
| 3 Portal + Public | 3 weeks | Week 13 |
| 4 Polish + UAT | 2 weeks | Week 15 |
| 5 Staging AWS | 2 weeks | Week 17 |
| 6 Production | 2 weeks | Week 19 |

**~4–5 months** with 1–2 developers. Compress if more devs; extend if Abraham docs delayed.

---

## Next 5 actions (start now)

1. ⬜ Scaffold **Next.js** in `apps/web`
2. ⬜ Expand **Prisma schema** (daily site log + milestones first)
3. ⬜ Build **auth** (JWT + login page)
4. ⬜ **Site Tracker** API + foreman UI (core differentiator)
5. ⬜ Abraham: confirm **bank details** + send **BOQ / material request** docs

---

*References: `planning/MVP_INTERNAL.md` · `planning/PHASE1_SCOPE.md` · `planning/OPERATIONAL_FORMS.md`*
