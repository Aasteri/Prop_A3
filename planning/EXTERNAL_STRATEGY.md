# Propa3 — External Strategy & Marketplace

> **Covers:** Concern 3 — public-facing completeness, competitors, payments, compliance, content  
> **Derived from:** Company Profile, Content Calendar, portfolio data, web research (Jul 2026)  
> **Prices & testimonials:** Placeholder until Abraham confirms; structure is ready

---

## 1. Positioning Statement

**Triple A is not PropertyPro.**

| PropertyPro / generic portals | Triple A / Propa3 |
|---|---|
| List properties anyone advertises | Showcase **Triple A-built** projects with verified progress |
| Agent-led; platform takes listing fees | Developer-led; construction proof is the product |
| Document verification as paid service | Compliance baked in — COREN, FCDA, SCUML visible |
| Search → call agent → hope | Search → consult → reserve → **track build** → handover → maintain |

**External tagline (use Company Profile):** Building Quality Projects — One Structure at a Time  
**Sub-line for app:** *See it built. Track every milestone. Own with confidence.*

---

## 2. Competitor Landscape (Abuja / Nigeria)

| Platform | Strength | Gap Triple A fills |
|---|---|---|
| **PropertyPro.ng** | Largest listing volume; map search; agent tools; verify.propertypro.ng doc checks | No construction progress; no developer ERP; generic agents |
| **PrivateProperty.ng** | Premium listings | Same — marketplace only |
| **Leg RealX** (2026) | Verified listings, digital transactions | New; no construction OS |
| **CLOSR** (rental, Sep 2026) | Rental fraud prevention | Rental-focused; not developer-build |
| **Gidavest / Gidalet** | Zero-fee rental, auto-debit | Rental payments; not construction |
| **Zedo** | AI property find + valuation | AI without build verification |

**Propa3 must beat them on:** Trust through **transparent construction**, not just verified title.

---

## 3. Public Website Structure

```
/                          Hero + featured projects + CTA consult
/projects                  All Triple A developments
/projects/[slug]           Project detail — gallery, timeline, available units
/properties                Unit/plot listings (buy)
/properties/[id]           Listing detail — compare, save, inquire
/estates/[estate]/map      Interactive plot map (available/reserved/sold)
/about                     Company profile, credentials, team
/about/compliance          CAC, SCUML, COREN badges + doc viewer
/services                  PM, development, facility mgmt, procurement
/insights                  Educational content (from content calendar themes)
/contact                   Form + WhatsApp + phone
/privacy                   NDPR privacy policy
/terms                     Terms of use + listing disclaimers
/client/login              Client portal entry
```

### SEO URL pattern
`/properties/4-bedroom-detached-duplex-guzape-million-dollar-view`

### Property types (from portfolio + marketing)
Detached duplex · Semi-detached · Terrace · Terrace blocks · Commercial mall · Mixed-use plaza · Serviced apartments · Block of flats · Land/plots

### Abuja areas to index
Guzape (I, II, III) · Katampe · Lugbe · Jikwoyi · Mpape · Dawaki · Maitama · Asokoro · (expand as listings grow)

---

## 4. Listing Content Templates

### 4.1 Project showcase (draft — Guzape 4BR completed)

**Title:** Luxurious Smart 4-Bedroom Detached Duplex  
**Location:** Million Dollar View Estate, Guzape, Abuja  
**Status:** Completed · **Duration:** 18 months  
**Type:** Residential — Detached Duplex  

**Description:**
Triple A Realty Projects delivered this smart 4-bedroom detached duplex at Million Dollar View Estate, Guzape — from foundation to handover in 18 months. The project demonstrates our Agile construction approach: Foundation → Shell → Finishing, with transparent milestone reporting throughout.

**Highlights:**
- Modern façade with premium glazing
- Smart home-ready infrastructure
- COREN-certified structural supervision (Engr. Kanadi)
- Full construction documentation available to buyers

**CTA:** Book a consultation · View similar ongoing projects

---

### 4.2 Ongoing project (draft — Jikwoyi Plaza)

**Title:** Mixed Use Commercial Plaza & Serviced Apartments  
**Location:** Jikwoyi, Abuja  
**Status:** Ongoing · **Duration:** 24 months (est.)  
**Current stage:** Foundation — footings, reinforcement, blockwork  

**Description:**
A mixed-use development combining commercial plaza space with serviced apartments in Jikwoyi. Investors and tenants can follow construction progress through our client portal.

**Investment note:** Pricing on request. Contact for unit availability and payment plan options.

---

### 4.3 Properties from marketing not yet fully seeded

| Marketing name | Area | Action |
|---|---|---|
| Duplex Boing Estate Guzape I/III | Guzape | Create project stub — status Ongoing |
| Block of Flats Dawaki | Dawaki | Create project stub — status Planned/Ongoing TBC |
| Terrace Duplex Katampe | Katampe | **Completed** — full listing from portfolio |
| Duplex Bilamm Guzape II | Guzape | Link to Bilamir Estate project |

---

## 5. Pricing Framework (Placeholders — Abraham to confirm)

Until actual prices arrive, use **"Price on request"** with **market context ranges** for search filters only (hidden from public if Abraham prefers).

### Abuja reference ranges (research-based, 2025–2026 — verify with Abraham)

| Type | Area tier | Indicative range (₦) | Notes |
|---|---|---|---|
| 4BR Detached Duplex | Guzape premium | 150M – 350M+ | Million Dollar View tier |
| 4BR Semi-Detached | Lugbe | 45M – 90M | Palm Heights tier |
| 5BR Detached | Guzape | 200M – 400M+ | Bilamir tier |
| Commercial plot / unit | Jikwoyi / Mpape | On request | Commercial — quote-based |
| Terrace 4BR | Katampe | 80M – 150M | Completed reference |

**App behavior:**
- Public: show "From ₦X" only when Abraham approves exact figure
- Internal CRM: store actual price, discount authority, payment plan options
- Search: filter by range using approved prices only

---

## 6. Payment Strategy

### Phase 1 — No paid payment API required

| Method | Flow | Built with code |
|---|---|---|
| **Bank transfer** | Client sees account details → pays → uploads proof (screenshot/PDF) | Proof upload + Finance manual verify → receipt PDF |
| **Installment schedule** | PM configures plan at reservation | Auto-generated schedule + reminders |
| **Reservation fee** | Fixed amount per project | Tracked as first ledger entry |

**Recommended banks display:** Company account on receipt template (from Abraham's doc when received).

### Phase 2 — Payment gateway (when revenue justifies)

| Provider | Why | Cost model |
|---|---|---|
| **Paystack** | Dominant in Nigeria; transfers, cards, USSD | % per transaction |
| **Flutterwave** | Alternative; multi-currency | % per transaction |

**Recommendation:** Start Paystack in Phase 2 for client portal online pay; keep bank transfer always available (Nigerian buyer preference).

### Escrow (long-run, no blockchain)
- **Built in-house:** Escrow *workflow* — funds marked "held" until milestone release
- Actual fund holding still via bank/gateway; app tracks state machine only
- No Propy-style blockchain needed

---

## 7. NDPR & Regulatory Compliance (Public Platform)

**Governing law:** Nigeria Data Protection Act 2023 + GAID 2025 (NDPC)

### Must implement in app (code — no paid API)

| Requirement | Implementation |
|---|---|
| Privacy policy | `/privacy` — data types, purposes, retention, rights |
| Consent at signup | Checkbox + timestamp; separate marketing consent |
| Lawful basis | Contract (client portal); Legitimate interest (CRM); Consent (marketing) |
| Data subject rights | Export my data; request deletion (with legal retention exceptions) |
| Processing register | Admin-maintained ROPA (Record of Processing Activities) |
| Breach procedure | Internal playbook; 72-hour NDPC notification workflow |
| DPO designation | Abraham or appointed officer — name in privacy policy |
| DPIA | Conduct before launch — template in compliance module |
| NDPC registration | When thresholds met — Ultra-High/Extra-High processing level |
| Cookie/tracking notice | If analytics added — consent banner |

### FCPC (consumer protection)
- Accurate listings — no misleading renders
- Clear pricing disclaimers ("subject to change", "excluding fees")
- Complaint channel on website
- Dispute resolution contact

### Real estate specific
- Display **CAC RC 8168740** and **SCUML RN** on footer + About
- Optional: link to verify.propertypro.ng-style **internal** document checklist for clients (not outsourced)

---

## 8. Marketing Channel Integration

| Channel | Phase 1 | Phase 2 |
|---|---|---|
| **WhatsApp** | `wa.me/2349121061221` CTAs; click-to-chat on listings | Webhook/business API if budget allows |
| **Instagram** | Link in bio; property URLs in captions | Content calendar module schedules posts |
| **Email** | SMTP (transactional — receipts, alerts) | Newsletter / drip campaigns |
| **SMS** | Optional — termii/etc. is paid; defer | Payment reminders |

### Content calendar alignment (Document 1)
- Each scheduled post links to `project_id` or `listing_id`
- Content type tags: Educational / Promotional / Engaging / Proof
- Properties: Jikwoyi Plaza, Mall Mpape, Bilamm, Boing, Lugbe, Katampe, Dawaki

---

## 9. Trust Signals (Public — from Company Profile)

Display on About + listing pages:

| Badge | Detail |
|---|---|
| CAC Registered | RC 8168740 — Jan 2025 |
| SCUML Registered | RN SC 151840932 — Dec 2025 |
| COREN Engineer | Engr. Kanadi R.53757 |
| ISO 9001 Auditor | CEO Abraham Ahmed |
| Projects delivered | 2 completed + 4+ ongoing (counter from DB) |

### Testimonials (draft until client quotes arrive)

**Template:**
> "Triple A kept us informed at every stage — from foundation to keys. The weekly progress reports and site photos gave us confidence throughout the 18-month build."  
> — *Buyer, Million Dollar View Estate, Guzape* [Name TBC — Abraham to approve]

---

## 10. Media Standards

| Asset | Minimum spec | Purpose |
|---|---|---|
| Hero image | 1920×1080, JPEG/WebP | Listing header |
| Gallery | 6–12 images per project | Progress + finished |
| Construction series | 4 stages (foundation → complete) | Trust / Proof content |
| Site photos | GPS-tagged preferred | Foreman upload; EXIF preserved |
| Video | 30–90 sec Reels format | Instagram; embed on project page |
| Floor plan | PDF or PNG | Optional per unit |
| 360° panorama | Phase 3 | Self-hosted viewer — no paid API |

**Watermark:** Triple A logo on marketing renders; optional on site photos.

---

## 11. What I Cannot Fully Cover Without Abraham

| Item | Status |
|---|---|
| Exact ₦ prices per unit | ⏳ Waiting |
| Bank account details on receipts | ⏳ Waiting |
| Client testimonial names/quotes | ⏳ Waiting |
| Mortgage partner logos/links | ⏳ None named — omit until provided |
| Legal review of sales agreement | ⏳ Draft template ready in `planning/templates/` |

Everything else in this document is **actionable now** for design and Phase 1 build.
