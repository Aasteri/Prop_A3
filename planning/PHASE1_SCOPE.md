# Propa3 — Phase 1 Scope & Definition of Done

> **Covers:** Concern 5 — governance, MVP boundaries, acceptance criteria  
> **Codename:** "Sell & Build"  
> **Duration estimate:** 3–4 months (depends on team size — not confirmed by Abraham)

---

## 1. Phase 1 Goal (One Sentence)

A client can **find a Triple A property**, **become a lead**, **reserve a plot/unit**, **track Foundation → Shell → Finishing progress with photos**, **upload payment proof and download receipts**, while a **foreman submits daily site logs offline** and a **PM approves material requests and sees a dashboard** — all on real Triple A project data.

---

## 2. In Scope — Phase 1

### Public / External
- [ ] Marketing homepage with brand (navy, orange, Triple A logo)
- [ ] Project showcase pages (6+ seeded projects)
- [ ] Property/plot listing pages with inquiry CTA
- [ ] WhatsApp + phone + email CTAs
- [ ] About page with CAC, SCUML, COREN trust badges
- [ ] Privacy policy page (NDPR-ready template)
- [ ] Basic search/filter (area, type, status)
- [ ] Contact / lead capture form

### CRM & Sales
- [ ] Lead capture (web form, manual entry)
- [ ] Lead pipeline (Inquiry → Viewing → Negotiation → Reserved → Won/Lost)
- [ ] Lead source tracking (Instagram, WhatsApp, Web, Referral)
- [ ] Communication history notes per lead
- [ ] Convert lead → client account

### Property Development
- [ ] Estates (Guzape, Jikwoyi, Mpape, Lugbe, Katampe, Dawaki stub)
- [ ] Projects linked to estates
- [ ] Plots/units with status (Available, Reserved, Sold, Under Construction, Allocated)
- [ ] Basic plot map (Leaflet) — click for status

### Construction
- [ ] Milestone template: Foundation → Shell → Finishing (+ sub-stages)
- [ ] Daily site log — full 10-section form (Document 2)
- [ ] Offline PWA submit + sync for foreman
- [ ] Site photo upload with date; EXIF GPS if present
- [ ] PM approval of daily logs
- [ ] Milestone % manual override by PM + rollup from logs
- [ ] Material request: Foreman create → PM approve (basic)
- [ ] FCDA permit upload gate before Foundation complete

### Client Portal
- [ ] Login (email + password)
- [ ] My property dashboard
- [ ] Milestone progress view + photo gallery
- [ ] Payment schedule view
- [ ] Upload bank transfer proof
- [ ] Download receipt PDF (after finance verification)
- [ ] Documents list (contracts, allocation letter)
- [ ] Message thread with PM (in-app)

### Finance (Basic)
- [ ] Payment ledger per client/plot
- [ ] Installment schedule (PM-configured)
- [ ] Manual payment verification by finance role
- [ ] Receipt PDF generation
- [ ] Outstanding balance calculation

### Documents
- [ ] Upload/store PDF, images per project/client/plot
- [ ] Version history (v1, v2…)
- [ ] Categories: Contract, Permit, Receipt, Drawing, Certificate, Other

### People & Access
- [ ] RBAC — minimum roles: CEO, PM, Foreman, Engineer, Finance, Client, Sales
- [ ] Audit log on financial + document + milestone changes
- [ ] COREN licence expiry alert (Engr. Kanadi)

### Dashboards
- [ ] PM: projects, pending logs, material requests, client payments
- [ ] CEO: revenue summary, project health, lead count

### Notifications (email + in-app)
- [ ] Daily log submitted → PM
- [ ] Daily log missing → Foreman + PM (18:00 cron)
- [ ] Payment proof uploaded → Finance
- [ ] Material request pending → PM

---

## 3. Out of Scope — Phase 1 (Explicitly Deferred)

| Module | Phase |
|---|---|
| IoT / smart building | Excluded until requested |
| Paystack/Flutterwave live payments | Phase 2 |
| Agent commissions & full agent app | Phase 2 |
| Social media calendar scheduler | Phase 2 |
| AI valuation, AI match, conversational search | Phase 3 |
| 3D/VR tours | Phase 3 |
| Full ERP (payroll, vehicles, petty cash) | Phase 2–3 |
| Facilities management tickets | Phase 2 |
| WhatsApp Business API | Phase 3 |
| SMS gateway | Phase 2+ |
| Multi-branch / white-label | Phase 3 |
| Full HR (recruitment, performance reviews) | Phase 2 |
| Inventory store module (full stock) | Phase 2 — Phase 1 has material request only |
| Visitor/security gate app | Phase 2 |
| Whistleblower module | Phase 2 (architecture reserved in Phase 1 audit schema) |
| Mortgage calculator + partners | Phase 2 |
| Property comparison (multi-select) | Phase 2 |
| Executive full analytics suite | Phase 2 |

---

## 4. Acceptance Criteria (Definition of Done)

### AC-1: Foreman Daily Log
**Given** a foreman at Mpape site with no internet  
**When** they complete all 10 sections and tap Submit offline  
**Then** the log queues locally, syncs when online, and PM receives notification within 5 minutes.

### AC-2: Client Progress Visibility
**Given** a client allocated to Lugbe semi-detached plot  
**When** they log into the client portal  
**Then** they see current milestone (e.g. Shell 45%), last 10 site photos, and next payment due date.

### AC-3: Payment Proof Flow
**Given** a client with an installment due  
**When** they upload bank transfer screenshot  
**Then** finance sees pending verification queue, and on approval client downloads PDF receipt.

### AC-4: FCDA Permit Gate
**Given** a project without uploaded FCDA permit  
**When** PM tries to mark Foundation 100% complete  
**Then** system blocks with message "Upload FCDA planning approval first."

### AC-5: Public Lead Capture
**Given** a visitor on Jikwoyi project page  
**When** they submit inquiry form with phone number  
**Then** lead appears in CRM within 1 minute with source=Web and project=Jikwoyi.

### AC-6: Plot Map
**Given** Guzape estate with 10 plots  
**When** public user opens estate map  
**Then** plots render color-coded by status; clicking Available plot shows inquiry CTA (not owner name).

### AC-7: Audit Trail
**Given** finance user verifies a payment  
**When** verification is saved  
**Then** audit log records who, when, previous status, new status.

### AC-8: Seed Data
**Given** fresh database deploy  
**When** seed script runs  
**Then** 6 projects, 4 active sites, leadership users, and milestone templates exist.

---

## 5. Success Metrics (90 Days Post-Launch)

| Metric | Target |
|---|---|
| Daily log submission rate | ≥ 90% of working days per active site |
| Client portal adoption | ≥ 70% of allocated clients logged in once |
| Lead response time | < 24h from inquiry to first CRM activity |
| Payment proof turnaround | < 48h from upload to verify/reject |
| Public listing index | All 6 portfolio projects live with photos |

---

## 6. Stakeholder Sign-Off Checklist

| Stakeholder | Sign-off item | Status |
|---|---|---|
| **Abraham (CEO)** | Phase 1 scope boundary | ⏳ Pending |
| **Abraham** | Draft templates vs incoming documents | ⏳ In progress |
| **Abraham** | Pricing visibility policy (public vs on-request) | ⏳ Pending |
| **Samuel** | Acknowledges Priority 4 features deferred | ✅ Rule documented |
| **Dev team** | Tech stack approval (`PRODUCT_DECISIONS.md`) | ⏳ Pending |
| **Abraham** | DPO designation for NDPR | ⏳ Pending |

---

## 7. Discrepancies to Resolve Before Launch

| Item | Options | Impact |
|---|---|---|
| Office suite | D15B vs B15D | Footer, receipts |
| Estate name | Bilamir vs Bilamm | Listing URLs, seed data |
| Legal name display | TRIPLE A REALTY PROJECTS LTD | All legal pages |
| Katampe project photos | From brochure only | Listing gallery |

---

## 8. When Abraham's Documents Arrive

| Document | Action |
|---|---|
| BOQ | Replace `planning/templates/BOQ_TEMPLATE.md` fields |
| Material request | Align approval workflow to exact form |
| Receipt | Match PDF layout to company format |
| Allocation letter | Legal text swap in generator |
| Sales agreement | Client portal signing flow |
| Payment plan example | Configure installment generator defaults |
| Bank details | Insert into receipt + client payment page |

**No scope change required** — only template precision and field mapping updates.

---

## 9. Phase 2 Preview (Not Committed)

- Paystack integration
- Agent module + commissions
- Social content calendar
- Smart search + comparison
- Store/inventory full module
- Workflow automation engine
- Executive analytics expansion
- Facilities maintenance tickets

Phase 2 planning begins only after Phase 1 acceptance criteria pass.
