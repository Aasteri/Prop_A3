# Abraham Property Docs — Batch 2 Extraction (Sep 8, 2026)

> Full extraction of 4 Google Docs made public Sep 8, 2026.  
> Status: **EXTRACTED — authoritative for Property Management forms listed below.**  
> Raw files: `google/docs/doc_09…12.{txt,html,pdf}` + named copies in `extractions/`.

---

## Document map

| # | Title | Google ID | Closes Part F rows |
|---|-------|-----------|-------------------|
| **Doc 9** | House/Property Inventory Condition (Move-in + Move-out) | `1dzfQ4g8nLyzZhJOqYeqarh8uNgzJpQHzCFGhsRKc2PE` | Move-in inspection · Move-out inspection |
| **Doc 10** | Offer Letter (example — 2-bed Guzape) | `1w2yKKi4kGugWxN-GOHvdx74yzv5VY09Ft04ekHOl2_A` | Offer letter fee structure |
| **Doc 11** | Proposal for Real Estate Property Management Services | `10RNOVkMsUYptSPWZnGl3Fb5gE5_O2ocNorAdxe1pLOY` | FM service scope · letting/management fees |
| **Doc 12** | Tenant Application — Personal Data | `1gyLTbxuBUdO2trPSeXGPlaYpLd9mLsPvwwJJXWcOALM` | Tenant application (confirms Part D FORM 4) |

---

## Doc 12 — Tenant Application (Personal Data) — EXTRACTED

**Matches Part D FORM 4 field-for-field.** Confirmed clauses:

1. Application is **not** a rental agreement and creates **no obligation** on Management or Landlord.
2. Applicant accepts paying **20% of the rental value** as **Agency and Legal fee** for professional services.

Fields 1–23: surname, other names, nationality, state of origin, marital status, phone, former residential address, reason(s) for vacating former place, permanent contact address, occupation, office/business address, type of property accepted, rent accepted, person responsible for rent payment, next of kin (+ phone, address, relationship), guarantor name, guarantor place of work/address, guarantor signature, guarantor phone, date of inspection.

---

## Doc 10 — Offer Letter — EXTRACTED (example instance)

**Entity:** A. Laucarie Consulting (Estate Surveyors & Valuers), Suite D15B Platinum Mega Plaza, Jahi, Abuja.  
**Example property:** 2 Bedroom Flat, Plot 32, 13 Road, ENL/FHA, Guzape District, Abuja.  
**Addressee example:** Kubai Miriam Lekwot.

### Fee / payment lines (system must support as offer components)

| Component | Example rule / amount | Payee account (example) |
|-----------|----------------------|-------------------------|
| Rent (per annum) | ₦6,000,000 | Landlord account (e.g. Patience Erima A. / Zenith) |
| Caution Fee (one-off) | ₦600,000 | Same landlord account |
| **Subtotal rent+caution** | ₦6,600,000 | |
| Management Fee | **5%** of rent (₦300,000) | Management entity (e.g. Silver Court / Fidelity) |
| Legal Fee | **5%** of rent (₦300,000) | Management entity |
| Service Charge (per annum) | ₦550,000 — covers External lights, Cleaning of compound, AEPB, Water, Security | Management entity |
| ENL Service Charge (estate-specific) | ₦200,000 — ENL Gate Pass, Estate Cleaning and Management | Management entity |
| **Subtotal fees+SC** | ₦1,350,000 | |
| Agency Fee | **10%** of rent (₦600,000) | A. A Laucarie Consulting / Taj Bank |

**Build rules from this example:**

- Offer letter supports **multiple settlement accounts** (landlord / management / agency).
- Service charge description is structured (line items of what SC covers).
- Estate-specific surcharge (e.g. ENL) is a separate optional line.
- **Fee reconciliation note:** Application form (Doc 12) accepts **20% Agency + Legal combined**. Offer letter shows Agency **10%** + Legal **5%** (=15%) plus Management **5%**. Do **not** collapse without client confirmation — implement configurable fee lines; default application clause remains 20% Agency+Legal acceptance; offer template uses separate % lines as in Doc 10.

---

## Doc 9 — House/Property Inventory Condition — EXTRACTED

**Single form covers Move-in AND Move-out.** Form No. field present.

### Header blocks

| Block | Fields |
|-------|--------|
| Landlord / Agent | Name, Address, Contact details |
| Tenant | Name/s, Address, Contact details |
| Property | Property address |
| Move-in inspection | Date of inventory inspection, Inspected by, Move-in date |
| Move-out inspection | Date of inventory inspection, Inspected by, Move-out date |
| Photographic/video evidence | Photo taken Y/N + date copy given to tenant; Video taken Y/N + date copy given to tenant |

### Declarations

**Move-in:** Inspected on {date}; true representation of condition; agreed by Landlord/Agent and Tenant/s. **Any discrepancies must be reported in writing within 7 days of receiving this inventory.** Signatures: Landlord/Agent name+signature; Tenant name+signature.

**Move-out:** Inspected on {date}; true representation. Landlord/Agent name+signature. If tenant/representative available: Tenant name+signature.

### Keys (Move-in | Move-out columns)

- Number of Front Door keys
- Number of Back Door Keys

### Meter information

| Utility | Meter Number | Move-in reading | Move-out reading |
|---------|--------------|-----------------|------------------|
| Electric | | | |
| Water | | | |

### Abbreviations (system reference list)

**Locations:** GF Ground Floor · FF First Floor · SF Second Floor  

**Defects / actions:** CC Complete Clean · PC Part Clean · RD Redecorate · PR Part Redecorate · SD Surface Damage · RP Repair · RPL Replace · BRR Beyond Reasonable Repair · ✓ Satisfactory condition  

**Default rule:** *All items are assumed to be clean and in good condition unless otherwise stated.*

### Inventory sections — each row: Move-in defects | Move-out defects | Comments | Cost

**Exterior Front:** Wall/fence · Gate · Water storage tank · Roofing · Guttering · Front door · Windows & Frames · Security lights · Refuse bin · Flowers  

**Porch:** Ceiling · Walls · Floor · Door/s · Window/s · Light fitting/s · Light bulb/s · Switches/sockets · Railings  

**Living Room:** Ceiling · Walls · Floor · Floor Covering · Doors · Windows · Light Fittings · Light Bulbs · Switches/Sockets · Water heater · Fire extinguishers · Air conditioners · Chair/s  

**Kitchen:** Ceiling · Walls · Floor · Floor Covering · Doors · Windows · Light Fittings · Light Bulbs · Switches/Sockets · Sink/Taps/Draining board · Worksurfaces/counter top · Smoke Extractor · Cabinets · Cooker (*source typo “Coker”*)  

**Bedroom 1 / 2 / 3:** Ceiling · Walls · Floor · Floor Covering · Doors/Windows · Curtains/Blinds (Bed 2–3) · Light Fittings · Light Bulbs · Air conditioners · Switches/Sockets · Wardrobe/s  

**Continuation table:** Room & Location + same four columns (extensible rooms).

### Closing signatures

Move-In Date + Landlord/Agent Signature + Tenant Signature  
Move-Out Date + Landlord/Agent Signature + Tenant Signature  
Note: photos (digital or otherwise) have been taken of the premises.

---

## Doc 11 — Property Management Services Proposal — EXTRACTED

**Example:** 4 units of 2-bedroom flat + 5-bedroom detached duplex at Dawaki, Abuja.  
**Date on sample:** 9th April, 2026.  
**Addressee example:** Lt Cmdr Sani Abdulateef.

### Service scope (product modules must cover)

1. **Tenant Acquisition and Screening** — advertising, showings, lease preparation, background checks  
2. **Rental Collection and Financial Management** — collect rent, financial reporting, prompt remittance  
3. **Property Maintenance and Repairs** — routine + prompt repairs  
4. **Tenancy/Lease Administration and Renewals** — lease admin, inspections, renewals  
5. **Comprehensive Financial Analysis and Reporting** — income statements, balance sheets, cash flow  

### Marketing strategy

- Digital advertising (rental platforms, social, other)  
- Targeted outreach (pre-screened tenants, local agents)  
- On-site “For Lease” signage  

### Professional fees (CONFIRMED from this doc)

| Fee | Rule |
|-----|------|
| **Letting Fee** | **10% of gross rent** paid for securing a **new tenant** (covers advertising, showings, background checks) |
| **Management Fee** | After securing tenant: **agreed percentage** (to be discussed) of **gross yearly rent collected** — day-to-day ops, rent collection, maintenance |

### Acceptance / authorization

Owner grants consent to: (1) advertise via all necessary media; (2) place banners/signage on premises; (3) collect professional fees in Section 3.  
Signatures: Owner + Manager + dates.

### Customer benefits (marketing copy — optional UI)

Enhanced property performance; time/effort savings; superior tenant relations; financial transparency.

---

## Gap reconciliation (Batch 2 → Part F)

| Part F item | Result |
|-------------|--------|
| Tenant application form | **EXTRACTED / CONFIRMED** (Doc 12 = Part D FORM 4) |
| Offer letter | **EXTRACTED** template structure + fee lines (Doc 10); not a blank template — use as schema + PDF layout |
| Move-in inspection | **EXTRACTED** (Doc 9) |
| Move-out inspection | **EXTRACTED** (same Doc 9 dual form) |
| Full tenant/FM/landlord agreement | Still **WAITING** (proposal Doc 11 is engagement proposal, not full tenancy/FM agreement) |
| Tenancy agreement | Still **WAITING** |
| Maintenance request / work order / invoice | Still **WAITING** |
| Service-charge statement / remittance form | Still **WAITING** (concepts confirmed; form templates not in this batch) |
| Agency/Legal % | Application **20%** Agency+Legal (Doc 12); Offer Agency **10%** + Legal **5%** + Mgmt **5%** (Doc 10); Letting **10%** (Doc 11). **Configurable — do not hard-code one number without reconciliation note** |

---

## Source URLs

1. https://docs.google.com/document/d/1dzfQ4g8nLyzZhJOqYeqarh8uNgzJpQHzCFGhsRKc2PE/edit  
2. https://docs.google.com/document/d/1w2yKKi4kGugWxN-GOHvdx74yzv5VY09Ft04ekHOl2_A/edit  
3. https://docs.google.com/document/d/10RNOVkMsUYptSPWZnGl3Fb5gE5_O2ocNorAdxe1pLOY/edit  
4. https://docs.google.com/document/d/1gyLTbxuBUdO2trPSeXGPlaYpLd9mLsPvwwJJXWcOALM/edit  
