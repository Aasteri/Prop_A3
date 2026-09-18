# Propa3 Artisan Marketplace Ecosystem

**Status:** Design locked v2 (user-confirmed)  
**Fee:** 2.5% of **workmanship / job fee only** — same for internal & external; editable in Company Settings  
**Signup:** Open public (seekers + artisans)

---

## 1. Confirmed product flow

```
Public user searches catalog of job/need types
  → Selects type + fills request form
  → Admin assigns job to one or more artisans
  → Each assigned artisan submits a quote (workmanship fee; materials noted separately as off-platform)
  → Seeker compares offers → selects one artisan
  → Chat opens for that job
       • Phone numbers: ALWAYS blocked (any obfuscation)
       • Full addresses: blocked until seeker pays job fee/deposit into escrow
       • Locations / areas / landmarks: allowed anytime
  → Seeker pays workmanship (or deposit) via bank+proof and/or Paystack
  → System holds escrow → on completion allocates: platform 2.5% + artisan net
  → Materials / physical goods: paid DIRECTLY to worker outside the system
```

---

## 2. Actors

| Actor | Role | Notes |
|-------|------|--------|
| Seeker | `MARKETPLACE_SEEKER` | Public signup; posts needs from catalog |
| Artisan | `ARTISAN` | Public apply → Admin approve; or Admin adds (INTERNAL / EXTERNAL) |
| Admin / CEO | existing | Assign artisans, approve signups, moderate, settings |
| Finance | existing | Verify proofs, see fee inflows |

---

## 3. Job / need catalog

System ships a **comprehensive trade & need taxonomy** (searchable + selectable), e.g.:

- Plumbing, electrical, AC/HVAC, carpentry, tiling, painting, welding, generator, solar, roofing, POP/ceiling, aluminium/glass, cleaning, fumigation, landscaping, CCTV, interlocking, borehole, waste, moving, appliance repair, masonry, steel fabrication, etc.
- Each catalog item: `code`, `label`, `category`, `description`, `active`, optional form hints / required fields.

Users **search → select → fill form** (not free-form “invent a trade” as primary path; “Other” allowed with Admin review).

---

## 4. Money rules (locked)

| Item | Rule |
|------|------|
| Paid **into Propa3 (escrow)** | Workmanship / job fee only (or deposit toward it) |
| Paid **outside to worker** | Physical materials and related direct costs |
| Platform cut | `% of workmanship` — default **2.5%**, same INTERNAL & EXTERNAL |
| Settings | `marketplacePlatformFeePct` (CEO/Admin editable); seed 2.5 |
| Pay methods | (1) Bank transfer + proof upload (2) Paystack — UI shows **Unavailable** until `PAYSTACK_SECRET_KEY` / public key present in env |
| Release | After job completion confirm (or Admin dispute resolution) |

Quote structure:
- `workmanshipAmount` (escrowed)
- `materialsEstimate` (informational only — “pay artisan directly”; not escrowed)
- Optional `depositRequired` / deposit % of workmanship

---

## 5. Chat & anti-leak (locked)

| Content | Before escrow payment | After escrow payment (that job) |
|---------|----------------------|----------------------------------|
| Phone / WhatsApp / email / wa.me | **Always block** | **Still always block** |
| Full street addresses | **Block** | **Allow** |
| Area / landmark / general location | **Allow** | **Allow** |

Server-side filter on every message (and bios). Strikes → mute / suspend. Watermark + veil for screenshot deterrence (not OS-absolute).

Chat starts when seeker **selects a quote** (not before). Pre-select: quotes only, no DM.

---

## 6. Admin

- Approve / reject artisan applications  
- Add artisans (mark `INTERNAL` vs `EXTERNAL`) — same fee %  
- Assign a submitted job to **one or more** artisans  
- Moderate flagged chat; disputes; suspend  
- Update `marketplacePlatformFeePct` in `/settings`

---

## 7. Surfaces

**Public:** `/marketplace` (catalog + CTA), apply artisan, seeker signup, job request form, track my request  
**Seeker:** my requests, compare quotes, select, pay, chat, confirm done  
**Artisan:** assignments, submit quote, chat, mark complete, earnings  
**Staff:** catalog admin (optional), artisan queue, job assignment board, moderation, settings fee

---

## 8. Data (core)

- `MarketplaceCatalogItem` — taxonomy  
- `ArtisanProfile` + `userId`, `source` INTERNAL\|EXTERNAL, approval status  
- `MarketplaceJob` — from catalog + form payload; status pipeline  
- `MarketplaceJobAssignment` — admin → many artisans  
- `MarketplaceQuote` — per assignment; workmanship + materials note  
- `ChatThread` / `ChatMessage` — job-scoped; paymentGate for addresses  
- `MarketplaceEscrowPayment` — amount, method BANK_PROOF \| PAYSTACK, status, fee snapshot  
- CompanySettings.`marketplacePlatformFeePct`

Statuses (job): `SUBMITTED` → `ASSIGNED` → `QUOTED` → `SELECTED` → `AWAITING_PAYMENT` → `IN_PROGRESS` → `AWAITING_CONFIRM` → `COMPLETED` / `CANCELLED` / `DISPUTED`

---

## 9. Build phases

**A** — Roles, catalog seed, artisan apply/approve/add internal, settings fee  
**B** — Job request form, admin multi-assign, quotes, seeker select  
**C** — Chat + filters (phones always; addresses until paid)  
**D** — Escrow (bank+proof + Paystack gated), completion allocation, earnings  
**E** — Hardening, disputes, watermarks, OCR later

---

## 10. Explicitly rejected / changed from v1

- ~~Artisans freely browse & self-bid on open board~~ → **Admin assigns**, then quotes  
- ~~Materials through escrow~~ → **Workmanship only** in system  
- ~~Different internal fee~~ → **Same 2.5%**  
- ~~Chat only after pay~~ → Chat after **select**; **address unlock** after pay; phones never
