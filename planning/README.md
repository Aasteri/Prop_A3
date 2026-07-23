# Propa3 — Planning & Reference Archive

> All discovery, requirements, Abraham's source documents, and specs live here.  
> **Application code** will live at the repo root (`apps/`, etc.) — not in this folder.

---

## Start here

| If you need… | Open |
|---|---|
| **What to build first (MVP)** | [`MVP_INTERNAL.md`](./MVP_INTERNAL.md) |
| **Full todo: now → deployable MVP** | [`MVP_ROADMAP.md`](./MVP_ROADMAP.md) |
| **Every feature + workflow** | [`FEATURES_MASTER.md`](./FEATURES_MASTER.md) |
| **Exact form fields** | [`OPERATIONAL_FORMS.md`](./OPERATIONAL_FORMS.md) |
| **Module workflows** | [`APP_WORKFLOWS.md`](./APP_WORKFLOWS.md) |
| **Priority rules (Abraham > Samuel)** | [`PROJECT_GOVERNANCE.md`](./PROJECT_GOVERNANCE.md) |
| **Master requirements** | [`REQUIREMENTS.md`](./REQUIREMENTS.md) |

---

## Folder layout

```
planning/
├── README.md                 ← this file
├── *.md                      ← all specification documents
├── data/                     ← seed data (listings JSON, generators)
├── sources/
│   └── abraham-uploads/      ← original PDF, DOCX, XLSX, logo from Abraham
├── extractions/              ← text/JSON extracted from source documents
├── templates/                ← form templates (authoritative + drafts)
└── adobe-previews/           ← JPEG page previews from Adobe shared links
```

---

## Specification documents

| File | Contents |
|---|---|
| `REQUIREMENTS.md` | Master requirements, Samuel inventory, phase plan, source links |
| `MVP_INTERNAL.md` | Internal-first MVP — Abraham docs + Team Charter |
| `FEATURES_MASTER.md` | Full feature catalog with sub-features and workflows |
| `OPERATIONAL_FORMS.md` | Real forms — exact replication specs |
| `APP_WORKFLOWS.md` | System module map and automation |
| `USER_JOURNEYS.md` | Persona flows (client, foreman, PM, etc.) |
| `TEAM_CHARTER.md` | Roles, ethics, reporting, compliance |
| `COMPANY_PROFILE.md` | Legal identity, team, portfolio, Agile model |
| `PROJECT_GOVERNANCE.md` | Priority rules, sample vs module pattern |
| `PHASE1_SCOPE.md` | Phase 1 acceptance criteria |
| `PRODUCT_DECISIONS.md` | Tech stack notes (update: MySQL, Nest, AWS — see root README) |
| `EXTERNAL_STRATEGY.md` | Public marketplace, competitors, NDPR |

---

## Abraham's source documents

Path: `sources/abraham-uploads/`

| File | MVP module |
|---|---|
| `Guzape Site Daily activities Tracker - 15_7_26-1.pdf` | Site Tracker (all sites) |
| `Triple A PROJECT STRUCTURE.pdf` | Org & Sites / RBAC |
| `PROJECT CHANGE LOG.xlsx` | Project Change Log (all projects) |
| `invoice Triple A.docx` | Invoicing |
| `TENANT APPLICATION FORM.docx` | Tenant Application |
| `Estate Terrier 2.pdf` | Estate Terrier (all estates) |
| `FOR SALE PROPERTIES TRIPLE A REALTY.pdf` | Sales Listings |
| `Pix Payment System Research.docx` | Payments reference (Phase 2) |
| `triple-a-logo.jpeg` | Brand logo asset |

Duplicates (`invoice (1).docx`, `Pix (1).docx`) kept alongside originals.

---

## Data & extractions

| Path | Contents |
|---|---|
| `data/LISTINGS_SEED.json` | Structured sale listings seed |
| `data/generate_listings.py` | Seed generator script |
| `extractions/*.txt` | Full text extract from each PDF/DOCX |
| `extractions/PROJECT_CHANGE_LOG.json` | Parsed change log Excel |
| `templates/` | BOQ, daily site log, change log, receipt, etc. |

---

## Adobe link previews (early discovery)

Path: `adobe-previews/` — JPEG renditions of:
- Document 1: Content Calendar
- Document 2: Site Activities Daily Reporting Sheet
- Document 3: NNQP (Nigeria National Quality Policy)

---

*Moved to `planning/` on Jul 21, 2026 to keep repo root clean for application code.*
