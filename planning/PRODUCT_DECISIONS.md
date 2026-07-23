# Propa3 — Product & Technical Decisions

> **Covers:** Concern 4 — architecture choices with rationale  
> **Constraints:** No IoT; minimize paid APIs; Abraham/docs > Samuel ideas  
> **Status:** Recommended defaults — adjust if Abraham specifies preferences

---

## 1. Product Shape

| Decision | Choice | Rationale |
|---|---|---|
| **Deployment model** | Single-tenant (Triple A only) | Matches current scope; schema supports `organization_id` later for white-label |
| **User surfaces** | Web app (responsive) + PWA for site | One codebase; foreman gets installable PWA with offline |
| **Native mobile apps** | Phase 3 | PWA covers site workers for Phase 1–2; React Native if push/offline gaps |
| **Public vs internal** | Same app, route-gated | `/` public marketing; `/app/*` authenticated; simpler ops |
| **Language** | English (UI + docs) | Team Charter: formal docs in English |

---

## 2. Recommended Tech Stack

### Frontend
| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR for SEO listings; API routes; one repo |
| UI | **Tailwind CSS** + **shadcn/ui** | Matches brand colors; fast polished UI |
| Forms (site) | **React Hook Form** + **Zod** | Offline-friendly validation |
| Maps | **Leaflet** + OpenStreetMap | Free; plot polygons; no API key |
| Charts | **Recharts** | Dashboards — free |
| PWA | **next-pwa** or Serwist | Offline daily logs |

### Backend
| Layer | Technology | Why |
|---|---|---|
| API | **Next.js API routes** → extract to services | Start monolith; split later |
| ORM | **Prisma** | Type-safe; migrations; PostgreSQL |
| Database | **PostgreSQL** | JSON fields for flexible forms; full-text search |
| Auth | **NextAuth.js v5** (Auth.js) | Email/password + role claims; extend for 15 roles |
| File storage | **Local disk** → **S3-compatible** (MinIO self-hosted or Cloudflare R2) | Photos, PDFs; MinIO = no vendor lock |
| Jobs/cron | **node-cron** or **BullMQ** + Redis | Log reminders, licence expiry, report generation |
| Email | **Nodemailer** + SMTP | Receipts, alerts — no paid API |
| PDF | **@react-pdf/renderer** or **Puppeteer** | Receipts, reports — free |

### Infrastructure (launch)
| Layer | Technology | Why |
|---|---|---|
| Hosting | **Vercel** (frontend) + **Railway/Render** (DB) or single VPS | Cost-effective Nigeria latency OK with CDN |
| CDN | Cloudflare (free tier) | Static assets, SSL |
| Backups | Daily PG dump | Non-negotiable for financial data |

**Not using (for now):** Firebase, Supabase Auth (vendor), paid map APIs, IoT platforms.

---

## 3. Mobile & Offline Strategy

**Problem:** Mpape/Guzape sites have unreliable mobile data.

| Feature | Approach |
|---|---|
| Daily site log | PWA with **IndexedDB** queue; sync on reconnect |
| Photo upload | Compress client-side; queue uploads; retry |
| Conflict resolution | Server timestamp wins; foreman notified on conflict |
| Read-only offline | Client portal — cache last fetched milestone view |

**Minimum device:** Android smartphone (primary foreman device in portfolio photos).

---

## 4. WhatsApp Integration Depth

| Level | Phase | Implementation |
|---|---|---|
| **L1 — Deep links** | Phase 1 | `https://wa.me/2349121061221?text=...` on listings, lead capture |
| **L2 — Click tracking** | Phase 1 | Log `whatsapp_click` event on CTA |
| **L3 — Inbound capture** | Phase 2 | Manual paste of WA conversation into CRM |
| **L4 — Business API** | Phase 3+ | Paid — only if lead volume justifies |

**Decision:** Phase 1 = L1 + L2 only. No paid WhatsApp Business API.

---

## 5. Maps & GIS

| Use case | Provider | Cost |
|---|---|---|
| Estate plot map (internal + public) | Leaflet + OSM | Free |
| Listing "nearby" embed | Google Maps iframe embed | Free tier |
| GPS from site photos | EXIF parser (exifr) | Free |
| Flood zones | Deferred — FCTA data not API-ready | Research later |

**Plot map features (Phase 1):**
- Polygon per plot
- Status color: Available / Reserved / Sold / Under Construction / Allocated
- Click → owner (if permitted), payment %, milestone, assigned engineer

---

## 6. Search & Discovery

| Feature | Phase | Implementation |
|---|---|---|
| Filter by area, type, price, beds | Phase 1 | PostgreSQL queries |
| Full-text search | Phase 1 | PG `tsvector` on title + description |
| Map draw search | Phase 2 | Leaflet.draw + PostGIS (optional extension) |
| Commute time | Phase 3 | Needs routing API — defer |
| AI conversational search | Phase 3 | Rule-based parser first; no paid LLM API in Phase 1 |

---

## 7. Security Architecture

| Control | Implementation |
|---|---|
| RBAC | Role + permission matrix from Team Charter |
| Audit log | Append-only `audit_events` table |
| File access | Signed URLs; role-checked |
| PII encryption | At rest (DB disk encryption); TLS in transit |
| Whistleblower | Separate table; CEO-only read; no IP logging option |
| Session | HTTP-only cookies; 24h site / 7d office |
| Rate limiting | Middleware on auth + public forms |

---

## 8. Integration Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                     PROPA3 MONOLITH                      │
│  Next.js · Prisma · PostgreSQL · Local/S3 files         │
├─────────────────────────────────────────────────────────┤
│  FREE / CODE-FIRST          │  PAID / DEFERRED          │
│  · SMTP email               │  · Paystack (Phase 2)     │
│  · OSM maps                 │  · SMS gateway            │
│  · PDF generation           │  · WhatsApp Business API  │
│  · wa.me links              │  · Google Maps Platform*  │
│  · EXIF GPS                 │  · AI/LLM APIs            │
│  · QR generation            │  · IoT / BMS              │
│  · Cron jobs                │  · Commute routing API    │
└─────────────────────────────────────────────────────────┘
* Google embed iframe only in Phase 1 — not Maps Platform JS API
```

---

## 9. Data Architecture Principles

1. **Every entity links to `project_id`** where applicable — construction-centric
2. **Soft deletes** on financial and legal records — never hard delete payments/contracts
3. **Document polymorphism** — one `documents` table with `entity_type` + `entity_id`
4. **Event sourcing lite** — `milestone_events`, `payment_events` for timeline views
5. **Configurable enums** — construction stages, lead stages stored in DB not hardcoded

---

## 10. Open Decisions for Abraham (Quick Confirm)

| Question | Default if no answer |
|---|---|
| Preferred domain? | `triplearealty.com.ng` or `propa3` subdomain TBC |
| Paystack vs Flutterwave? | Paystack at Phase 2 |
| Company bank on receipts? | Placeholder until doc received |
| Client portal branding | Triple A colors from Company Profile |
| Who is DPO for NDPR? | Abraham Ahmed |

---

## 11. Build Order (Technical)

1. Auth + RBAC skeleton (15 roles)
2. Projects + estates + plots schema
3. Daily site log PWA (offline)
4. Client portal read-only progress
5. CRM leads + pipeline
6. Public listing pages (SSR)
7. Finance ledger + proof upload
8. Document upload + PDF receipts
9. Dashboards + cron notifications
10. Plot map (Leaflet)

This aligns with `PHASE1_SCOPE.md`.
