# Propa3 — Operational Forms (Real Documents — Exact Replication Spec)

> **Source:** Abraham's actual operational files (Jul 16, 2026)  
> **Rule:** Each uploaded file is a **sample** of a **reusable module** — same form/workflow for all sites, projects, estates, and clients  
> **Priority:** Overrides all draft templates in `templates/` where conflict exists  
> **Raw extractions:** `extractions/` · **Sources:** `sources/abraham-uploads/`

---

## Document Registry

| # | Source File | System Module | App Feature ID | Status |
|---|---|---|---|---|
| 1 | `Guzape Site Daily activities Tracker - 15_7_26-1.pdf` | Engineer Portal / Construction | `FORM_DAILY_SITE_LOG` | **Authoritative** (replaces Adobe doc2 draft) |
| 2 | `PROJECT CHANGE LOG.xlsx` | Construction / Agile Variations | `FORM_PROJECT_CHANGE_LOG` | **Authoritative** |
| 3 | `invoice Triple A.docx` | Finance / Invoicing | `FORM_INVOICE` | **Authoritative** |
| 4 | `TENANT APPLICATION FORM.docx` | Rentals / CRM | `FORM_TENANT_APPLICATION` | **Authoritative** |
| 5 | `Estate Terrier 2.pdf` | Facility Management / Rentals | `MODULE_ESTATE_TERRIER` | **Authoritative** |
| 6 | `FOR SALE PROPERTIES TRIPLE A REALTY.pdf` | Property Listings | `MODULE_SALES_LISTINGS` | **Authoritative seed** |
| 7 | `Triple A PROJECT STRUCTURE.pdf` | Org / RBAC / Sites | `MODULE_ORG_STRUCTURE` | **Authoritative** |
| 8 | `Pix Payment System Research.docx` | Payments (Phase 2+ design ref) | `REF_PAYMENT_RAILS` | Reference only |
| 9 | `WhatsApp Image 2026-07-15.jpeg` | Branding | `ASSET_LOGO` | Logo asset |

---

## FORM 1: Site Tracker Module (Daily Site Log)

**Sample source:** `Guzape Site Daily activities Tracker - 15_7_26-1.pdf`  
**Module scope:** **All sites** — Jikwoyi, Mpape, Guzape I/II/III, Lugbe, and any future site  
**Sample is not the product** — it defines the exact form layout; every site uses the same module

### Header Fields

| Field | Type | Required | Example / Format |
|---|---|---|---|
| `start_time` | time | Yes | — |
| `end_time` | time | Yes | — |
| `project_name` | text | Yes | Construction of 6 bedroom luxurious duplex |
| `date` | date | Yes | Auto-default today |
| `project_location` | text | Yes | Guzape |
| `site_supervisors` | user[] / text | Yes | One or more names |
| `ref_code` | string (auto) | Yes | `AAA/GZP/530/JULY/2026/0I` |

**Ref code pattern:** `AAA/{SITE_CODE}/{PROJECT_NUM}/{MONTH}/{YEAR}/{SEQ}`  
- Generate server-side; foreman cannot edit  
- Example site codes: GZP=Guzape, JKW=Jikwoyi, MPP=Mpape, LGB=Lugbe

### Section 2: Daily Activities Tracker (repeatable rows)

| Column | Type | Notes |
|---|---|---|
| `activity` | text | Task description |
| `status_todo` | boolean | Mutually exclusive with ongoing/done OR use enum |
| `status_ongoing` | boolean | |
| `status_done` | boolean | |
| `progress_percent` | number 0–100 | |
| `remark_note` | text | |

**UI:** Kanban-style or row with status radio: **To do | Ongoing | Done**

### Section 3: Manpower

| Category | Sub-count field | Remark |
|---|---|---|
| Skilled Workers | `count` | |
| — Iron benders | `iron_benders` | Trade breakdown **required** |
| — Carpenters | `carpenters` | |
| — Mason | `masons` | |
| — Plumber | `plumbers` | |
| — Electrician | `electricians` | |
| Unskilled Workers | `unskilled` | |
| Supervisors/Staff | `supervisors` | |
| | `remark` | Per section |

### Section 4: Machinery Used (repeatable)

| Equipment | Default options | Units/Hours | Remark |
|---|---|---|---|
| Excavator | ✓ | number | text |
| Mixer | ✓ | number | text |
| Vibrator | ✓ | number | text |
| Crane | ✓ | number | text |
| Other Equipment | free text | number | text |

### Section 5: Material Received/Consumed (repeatable)

| Material | Default options | Received Qty | Consumed Qty | Balance (auto) | Remark |
|---|---|---|---|---|---|
| Cement | ✓ | number | number | `received - consumed` | |
| Steel | ✓ | | | | |
| Sand | ✓ | | | | |
| Aggregate | ✓ | | | | |
| Block/Bricks | ✓ | | | | |
| Tiles | ✓ | | | | |
| Others | free text | | | | |

**Automation:** Balance auto-calculated; negative balance → alert to Store Manager

### Section 6: Quality Checks (checkboxes)

- [ ] Slump Test
- [ ] Cube Casting *(PDF spells "Cube Castng")*
- [ ] Reinforcement Inspection
- [ ] Concrete Inspection
- [ ] Others: _________

### Section 7: Safety Observations (checkboxes)

- [ ] PPE Compliance *(PDF: "PPE Complinace")*
- [ ] Toolbox Talk
- [ ] Incidents / Near Misses → **if checked, auto-create HSE incident draft**

### Section 8: Issues & Delays (checkboxes + text)

- [ ] Material Shortage
- [ ] Equipment Breakdown
- [ ] Weather Delay
- [ ] Other Issues: _________

**Automation:** Any checked → immediate PM notification

### Section 9: Plan for Next Day

| Field | Type |
|---|---|
| `scheduled_activities` | textarea |
| `material_requirement` | textarea |
| `manpower_requirement` | textarea |

### Section 10: Signatures

| Role | Field | Required |
|---|---|---|
| Site Supervisor/Manager | signature + date | **Yes** |
| Project Manager | signature + date | PM approves within 24h |
| Consultant (if required) | signature + date | Optional |

### Mobile / Offline Requirements

- PWA offline queue
- Photo attachments per section
- GPS stamp on submit
- Refuse submit if supervisor signature missing

---

## FORM 2: Project Change Log (Jikwoyi)

**Source:** `PROJECT CHANGE LOG.xlsx`  
**Project binding:** Construction of Mix-Use Devt, **Jikwoyi, Abuja**  
**Module:** Agile variation register (links to `CHANGE_ORDER` workflow)

### Sheet Title
`PROJECT CHANGE LOG FOR THE CONSTRUCTION OF MIX-USE DEVT, JIKWOYI, ABUJA`

### Columns (exact headers)

| # | Column Header | Field Key | Type |
|---|---|---|---|
| 1 | CHANGE ID | `change_id` | string auto `CHG-JKW-{SEQ}` |
| 2 | DATE OF REVISION | `revision_date` | date |
| 3 | ORIGINATOR/REQUESTER | `originator` | user/text |
| 4 | CHANGE DESCRIPTION | `description` | text |
| 5 | JUSTIFICATION | `justification` | text |
| 6 | REVISED BY | `revised_by` | user |
| 7 | STATUS (approved, in review, rejected) | `status` | enum |
| 8 | APPROVED BY | `approved_by` | user |
| 9 | IMPACT (Scope/Time/Cost) | `impact_level` | enum: High / Med / Low |

### Workflow

```
Draft → In Review (PM) → Approved (CEO if High impact) → Rejected
                              ↓
                    Update BOQ / Schedule / Invoice
```

**Export:** Excel download matching original `.xlsx` layout

---

## FORM 3: Invoice (A. Laucarie Consulting format)

**Source:** `invoice Triple A.docx`  
**Entity on sample:** A. Laucarie Consulting (Abraham's consulting entity — may also invoice via Triple A Realty)  
**Module:** Finance → Invoices & Variations

### Header

| Field | Example | Auto-format |
|---|---|---|
| Issuing entity | A. LAUCARIE CONSULTING | Configurable per company entity |
| Invoice No | `AAA/2026/SOL-084` | `{PREFIX}/{YEAR}/{TYPE}-{SEQ}` |
| Date | July 1, 2026 | |
| Contract Ref | `CC/2025/1104` | Link to project contract |

### Client Block

| Field | Example |
|---|---|
| Client / Bill To | Madam Taiwo Peace Mawo |
| Address | River Park Estate, Lugbe, Abuja |

### Project Block

| Field | Example |
|---|---|
| Project Location / Details | 4 bedroom Semi-duplex Residential, River Park Estate, Lugbe, Abuja |

### Line Items Table

| Column | Type |
|---|---|
| Description of Works & Specifications | text |
| Qty | number |
| Unit | text (e.g. LS = lump sum) |
| Unit Price (₦) | currency |
| Total Amount (₦) | calculated |

### Variation Block (on same invoice)

| Field | Example |
|---|---|
| Variation ID | V-01 |
| Variation Title | Specification Change |
| Description | Upgrade 5KVA→6KVA inverter; 550W→590W panels |
| Amount | ₦100,000.00 |

### Summary Block

| Field | Calculation |
|---|---|
| Original Amount Quoted (Base Contract Value) | sum base lines |
| Total Contract Material & Inflation Variance | variations |
| Revised Total Contract Value | base + variations |
| Less: Total Amount Paid to Date (Milestone 1 & 2) | from payment ledger |
| **Outstanding Net Balance Due** | revised - paid |

### Payment Terms & Settlement

| Field | Content |
|---|---|
| Payment terms | e.g. "Due within 24 hours from completion and handover" |
| Bank Name | Polaris Bank Plc. |
| Account Name | A. A LAUCARIE CONSULTING |
| Account Number | 4091991156 |

**Note:** Triple A corporate bank details TBC — support **multiple settlement entities** in config.

### PDF Output
Replicate exact layout: header, dual-column line items, variation section, settlement routing footer.

---

## FORM 4: Tenant Application Form

**Source:** `TENANT APPLICATION FORM.docx`  
**Module:** Rentals → Tenant Onboarding  
**Note:** Header says "TO BE FILLED IN TENANT'S HANDWRITING" — app supports digital fill + e-signature

### Personal Data Fields (exact numbering)

| # | Field Label | Field Key | Type |
|---|---|---|---|
| 1 | Surname | `surname` | text |
| 2 | Other Names | `other_names` | text |
| 3 | Nationality | `nationality` | text |
| 4 | State of Origin | `state_of_origin` | text |
| 5 | Marital Status | `marital_status` | select |
| 6 | Phone No. | `phone` | phone |
| 7 | Former Residential Address | `former_address` | textarea |
| 8 | Reason(s) for Vacating the former Place | `vacate_reason` | textarea |
| 9 | Permanent Contact Address | `permanent_address` | textarea |
| 10 | Occupation | `occupation` | text |
| 11 | Office/Business Address | `office_address` | textarea |
| 12 | Type of Property Accepted | `property_type_accepted` | text |
| 13 | Rent Accepted | `rent_accepted` | currency |
| 14 | Person to be Responsible for Rent Payment | `rent_payer` | text |
| 15 | Next of Kin | `next_of_kin_name` | text |
| 16 | Next of Kin Phone No | `next_of_kin_phone` | phone |
| 17 | Next of Kin Address | `next_of_kin_address` | textarea |
| 18 | Relationship | `next_of_kin_relationship` | text |
| 19 | Name of Guarantor | `guarantor_name` | text |
| 20 | Place of work/Address (Guarantor) | `guarantor_work_address` | textarea |
| 21 | Guarantor's Signature | `guarantor_signature` | signature |
| 22 | Guarantor Phone No | `guarantor_phone` | phone |
| 23 | Date of Inspection | `inspection_date` | date |

### Legal Clauses (display + mandatory accept)

**Clause 1:**
> I understand that this application is not a rental agreement and does not create any obligation on Mgt or Landlord.

**Clause 2:**
> This form shall serve as an acceptance to pay a total of **20% of the rental value** as Agency and Legal fee for the Professional services to be rendered.

### Automation on Submit

1. Create `tenant_application` record (status: Pending Review)
2. Calculate agency fee = `rent_accepted × 0.20`
3. Generate agency fee invoice
4. Notify property manager
5. On approval → create tenant profile → link to Estate Terrier unit

---

## MODULE 5: Estate Terrier (Rental Register)

**Source:** `Estate Terrier 2.pdf`  
**Title:** `ESTATE TERRIER FOR DAWAKI BLOCK OF FLAT`  
**Module:** Facility Management → Rental Ledger (per estate)

### Register Columns (exact)

| # | Column | Field Key | Type |
|---|---|---|---|
| 1 | S/NO | `serial_no` | int auto |
| 2 | TYPE OF PROPERTY | `property_type` | text |
| 3 | LOCATION OF PROPERTY | `location` | text |
| 4 | NAME OF TENANT | `tenant_name` | text → link tenant profile |
| 5 | TENANT PHONE CONTACT | `tenant_phone` | phone |
| 6 | RENT PAID/FIXED | `rent_paid_fixed` | enum: Paid / Fixed |
| 7 | RENT AMOUNT (N) | `rent_amount_ngn` | currency |
| 8 | MODE OF PAYMENT/TRANSACTION DETAILS | `payment_mode` | text |
| 9 | DATE PAID | `date_paid` | date |
| 10 | TENANCY START DATE | `tenancy_start` | date |
| 11 | TENANCY TERMINATION DATE | `tenancy_end` | date |
| 12 | CAUTION DEPOSIT | `caution_deposit` | currency |
| 13 | SERVICE CHARGE | `service_charge` | currency |
| 14 | RENTAL/MGT EXPENSES — DESCRIPTION | `expense_description` | text |
| 15 | RENTAL/MGT EXPENSES — AMOUNT | `expense_amount` | currency |
| 16 | AMOUNT NET RENTAL INCOME (N) | `net_rental_income` | **calculated** |

### Calculated Fields

```
net_rental_income = rent_amount - expense_amount
occupancy_rate = occupied_units / total_units (dashboard)
upcoming_terminations = tenancy_end within 60 days (alert)
```

### Estate Terrier Instances (expand per estate)

| Estate | Source | Status |
|---|---|---|
| Dawaki Block of Flats | Estate Terrier 2.pdf | Template created |
| *(others)* | TBC | Clone structure per estate |

---

## MODULE 6: Sales Listings Catalog

**Source:** `FOR SALE PROPERTIES TRIPLE A REALTY.pdf`  
**Seed data:** `data/LISTINGS_SEED.json` (80+ rows in source; seed file growing)  
**Full raw extract:** `extractions/FOR_SALE_PROPERTIES_TRIPLE_A_REALTY_pdf.txt`

### Listing Schema (from document columns)

| Field | Values |
|---|---|
| `location` | Area + estate name (e.g. Kapital Villa, Guzape) |
| `property_type` | 1BR Flat … 6BR Detached, Site & Services Plot, etc. |
| `finish` | `FF` (Fully Finished) / `SF` (Shell Finish) / `DPC` |
| `payment_plan` | Outright / 6 Months / 12 Months / 18 Months / Flexible / TBD / On request |
| `price_ngn` | Single price OR multi-tier |

### Multi-Tier Pricing (common in document)

Many listings have **three price points**:

| Plan | Field suffix |
|---|---|
| Outright | `price_outright_ngn` |
| 6 Months | `price_6m_ngn` |
| 12 Months | `price_12m_ngn` |
| 18 Months | `price_18m_ngn` |

**Example — Prime Villa Lifecamp 4BR Terrace:**
- Outright: ₦345,000,000
- 12 Months: ₦349,000,000
- 18 Months: ₦350,000,000

### Public Listing Card Display

- Show finish badge (FF/SF)
- Show payment plan options as tabs
- TBD → "Price on request" + Consultation CTA
- All listings link to CRM inquiry

---

## MODULE 7: Project Org Structure

**Source:** `Triple A PROJECT STRUCTURE.pdf`  
**Module:** RBAC + Site assignment

### Hierarchy (exact)

```
Client / Project Sponsor
└── Programme Manager / CEO
    ├── Project Quality Control Team
    ├── Procurement
    ├── Digital Marketing / Content Creators
    ├── Design Team
    │   ├── Architectural Design
    │   ├── Structural Design
    │   ├── Mechanical Design
    │   └── Electrical Design
    └── Project Site Teams ×4
        ├── JIKWOYI — Site Manager, Store/Stock Mgr, Supervisor 1, Supervisor 2, Artisans
        ├── MPAPE PLAZA — (same structure)
        ├── GUZAPE II VIDA SHELTER ESTATE — (same)
        └── GUZAPE III BOING ESTATE — (same)
```

### RBAC Mapping

| Org node | System role |
|---|---|
| Programme Manager/CEO | `ceo` |
| Site Manager | `project_manager` |
| Store/Stock Mgr | `store_manager` |
| Site Supervisor 1/2 | `foreman` |
| Artisans/Labourers | `artisan` |
| Architectural Design | `architect` |
| Structural Design | `structural_engineer` |
| Procurement | `procurement` |
| Digital Marketing | `marketing` |

**User assignment:** Each user has `primary_site_id` + optional `secondary_sites[]`

---

## REF 8: Pix Payment Research (Future Payments)

**Source:** `Pix Payment System Research.docx` (~41k chars)  
**Status:** Design reference — **not Brazil Pix implementation**  
**App takeaways for Nigeria Phase 2+:**

| Pix concept | Propa3 equivalent (build with code) |
|---|---|
| Instant settlement | Paystack transfer webhook → auto-verify |
| QR code payment | Generate dynamic QR per invoice (Naira bank QR standard when available) |
| Pix Cobrança (billing QR) | Client portal "Pay now" QR per installment |
| Alias directory (phone→account) | Store client phone as payment reference key |
| Recurring (Pix Automático) | Installment auto-debit scheduler (Paystack subscription) |
| 24/7 availability | Bank transfer proof upload works offline; verify business hours |

**Phase 1:** Bank transfer + proof upload (matches current invoice settlement routing)  
**Phase 2:** Paystack + optional QR on invoice PDF

---

## Logo Asset

**Source:** `WhatsApp Image 2026-07-15 at 23.19.46.jpeg`  
- Triple A Realty Projects Ltd logo (blue + grey three-A mountain/house icon)  
- Use on: app header, PDF headers, client portal, email templates

---

## Forms Still Awaited from Abraham

| Document | Draft until received |
|---|---|
| BOQ (project-specific) | `templates/BOQ_TEMPLATE.md` |
| Material request (signed version) | `templates/MATERIAL_REQUEST.md` |
| Allocation letter | `templates/ALLOCATION_LETTER.md` |
| Sales agreement | TBC |
| Triple A corporate bank details | Invoice uses Laucarie Consulting account for now |

**When received:** Add as `FORM_*` entries here; mark authoritative; update PDF generators.
