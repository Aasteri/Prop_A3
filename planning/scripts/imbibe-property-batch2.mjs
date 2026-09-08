#!/usr/bin/env node
/**
 * Imbibe Property Docs Batch 2 (docs 9–12) into ABRAHAM_MASTER_BUILD_DOCUMENT.md
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTER = path.join(__dirname, '..', 'ABRAHAM_MASTER_BUILD_DOCUMENT.md');
const BATCH2 = path.join(__dirname, '..', 'extractions', 'ABRAHAM_PROPERTY_DOCS_BATCH2.md');
const DOC9 = path.join(__dirname, '..', 'extractions', 'google', 'docs', 'doc_09.txt');
const DOC10 = path.join(__dirname, '..', 'extractions', 'google', 'docs', 'doc_10.txt');
const DOC11 = path.join(__dirname, '..', 'extractions', 'google', 'docs', 'doc_11.txt');
const DOC12 = path.join(__dirname, '..', 'extractions', 'google', 'docs', 'doc_12.txt');

function replaceBetween(src, startMarker, endMarker, replacement) {
  const a = src.indexOf(startMarker);
  if (a < 0) throw new Error(`Start not found: ${startMarker}`);
  const b = src.indexOf(endMarker, a + startMarker.length);
  if (b < 0) throw new Error(`End not found after ${startMarker}: ${endMarker}`);
  return src.slice(0, a) + replacement.trim() + '\n\n' + src.slice(b);
}

const G4 = `## G.4 Tenant application — EXTRACTED (Doc 12 / Part D FORM 4)

> **Source:** Google Doc 12 — https://docs.google.com/document/d/1gyLTbxuBUdO2trPSeXGPlaYpLd9mLsPvwwJJXWcOALM/edit  
> **Status:** EXTRACTED — authoritative. Matches Part D FORM 4.

Prospective tenants complete an application/screening form (**Personal Data — to be filled in tenant's handwriting**; app supports digital fill + e-signature).

### G.4.1 Fields (exact)

| # | Field | Type |
|---|-------|------|
| 1 | Surname | text |
| 2 | Other Names | text |
| 3 | Nationality | text |
| 4 | State of Origin | text |
| 5 | Marital Status | select |
| 6 | Phone No. | phone |
| 7 | Former Residential Address | textarea |
| 8 | Reason(s) for Vacating the former Place | textarea → feeds Criterion 3 |
| 9 | Permanent Contact Address | textarea |
| 10 | Occupation | text |
| 11 | Office/Business Address | textarea |
| 12 | Type of Property Accepted | text |
| 13 | Rent Accepted | currency |
| 14 | Person to be Responsible for Rent Payment | text |
| 15–18 | Next of Kin · Phone · Address · Relationship | |
| 19–22 | Guarantor Name · Place of work/Address · Signature · Phone | |
| 23 | Date of Inspection | date |

### G.4.2 Mandatory acceptance clauses (EXTRACTED)

1. Application is **not** a rental agreement and creates **no obligation** on Mgt or Landlord.
2. Form serves as acceptance to pay a total of **20% of the rental value as Agency and Legal fee** for professional services.

### G.4.3 Applicant-facing vs internal (CONFIRMED)

| Layer | Content |
|-------|---------|
| Applicant-facing | Fields above + clauses |
| Internal evaluation | 4×0–10 FM scores (G.5), observations, investigations, landlord preferences — **not fully exposed** |

<details open>
<summary><strong>Embedded source — Doc 12 Tenant Application (verbatim)</strong></summary>

`;

const G6 = `## G.6 Offer letter → tenancy agreement — EXTRACTED offer schema (Doc 10)

> **Offer letter source:** Google Doc 10 — https://docs.google.com/document/d/1w2yKKi4kGugWxN-GOHvdx74yzv5VY09Ft04ekHOl2_A/edit  
> **Status:** EXTRACTED example instance → use as **offer letter schema + PDF layout**. Tenancy agreement body still WAITING.

### G.6.1 Offer letter workflow

1. After tenant **accepted** via evaluation → issue **Offer Letter**.
2. Offer specifies property, rent, caution, fees, service charges, payment accounts.
3. Tenant accepts / signs acceptance of terms.
4. Then execute **Tenancy Agreement** (WAITING full document) and FM–landlord–tenant agreement (WAITING).

### G.6.2 Offer line items (from Doc 10 example — Guzape 2-bed)

| Line | Rule from example | Notes |
|------|-------------------|-------|
| Rent (per annum) | Fixed amount | Paid to **landlord** account |
| Caution Fee | One-off (example 10% of rent) | Landlord account |
| Management Fee | **5%** of rent | Management entity account |
| Legal Fee | **5%** of rent | Management entity account |
| Service Charge (per annum) | Fixed; covers External lights, Cleaning, AEPB, Water, Security | Management entity |
| Estate Service Charge (optional) | e.g. ENL Gate Pass / Estate Cleaning / Management | Estate-specific |
| Agency Fee | **10%** of rent | A. A Laucarie Consulting account |

**Multi-account settlement (EXTRACTED):** system must support separate bank details for landlord, management entity, and agency on one offer.

### G.6.3 Fee reconciliation (do not silently merge)

| Source | Agency / Legal / Mgmt |
|--------|------------------------|
| Doc 12 application clause | **20%** of rental value as **Agency and Legal** (combined) |
| Doc 10 offer letter | Agency **10%** + Legal **5%** (+ Management **5%** separate) |
| Doc 11 PM proposal | **Letting Fee 10%** of gross rent for new tenant; Management Fee = **agreed %** of gross yearly rent |

→ Implement **configurable fee schedule per engagement**; display Doc 12 clause as mandatory acceptance on application; generate offer lines from configured schedule (defaulting to Doc 10 structure unless overridden).

<details open>
<summary><strong>Embedded source — Doc 10 Offer Letter example (verbatim)</strong></summary>

`;

const G7 = `## G.7 Move-in / Move-out inventory — EXTRACTED (Doc 9)

> **Source:** Google Doc 9 — https://docs.google.com/document/d/1dzfQ4g8nLyzZhJOqYeqarh8uNgzJpQHzCFGhsRKc2PE/edit  
> **Status:** EXTRACTED — **one form** covers Move-in **and** Move-out (\`FORM_MOVE_IN_INSPECTION\` + \`FORM_MOVE_OUT_INSPECTION\` share schema).  
> Form title: **HOUSE/PROPERTY INVENTORY CONDITION** · Form No.

### G.7.1 Header & evidence

| Block | Fields |
|-------|--------|
| Landlord / Agent | Name, Address, Contact |
| Tenant | Name/s, Address, Contact |
| Property | Property address |
| Move-in | Inventory inspection date, Inspected by, Move-in date |
| Move-out | Inventory inspection date, Inspected by, Move-out date |
| Evidence | Photographic Y/N + date copy to tenant; Video Y/N + date copy to tenant |

### G.7.2 Declarations & 7-day rule (EXTRACTED)

Move-in declaration: true representation of condition on inspection date; agreed by Landlord/Agent and Tenant/s.  
**Any discrepancies must be reported in writing within 7 days of receiving this inventory.**  
Move-out declaration + signatures (tenant optional if representative unavailable).

### G.7.3 Keys & meters

| Item | Move-in | Move-out |
|------|---------|----------|
| Number of Front Door keys | | |
| Number of Back Door Keys | | |
| Electric meter number + reading | | |
| Water meter number + reading | | |

### G.7.4 Abbreviations (system dictionary)

Locations: GF · FF · SF  
Defect codes: CC · PC · RD · PR · SD · RP · RPL · BRR · ✓ Satisfactory  
**Default:** All items assumed clean and in good condition unless otherwise stated.

### G.7.5 Room inventory matrix

Every line item has columns: **Move-in defects | Move-out defects | Comments | Cost**

| Section | Components |
|---------|------------|
| Exterior Front | Wall/fence, Gate, Water storage tank, Roofing, Guttering, Front door, Windows & Frames, Security lights, Refuse bin, Flowers |
| Porch | Ceiling, Walls, Floor, Door/s, Window/s, Light fitting/s, Light bulb/s, Switches/sockets, Railings |
| Living Room | Ceiling, Walls, Floor, Floor Covering, Doors, Windows, Light Fittings, Light Bulbs, Switches/Sockets, Water heater, Fire extinguishers, Air conditioners, Chair/s |
| Kitchen | Ceiling, Walls, Floor, Floor Covering, Doors, Windows, Light Fittings, Light Bulbs, Switches/Sockets, Sink/Taps/Draining board, Worksurfaces/counter top, Smoke Extractor, Cabinets, Cooker |
| Bedroom 1 | Ceiling, Walls, Floor, Floor Covering, Doors, Windows, Light Fittings, Light Bulbs, Air conditioners, Switches/Sockets, Wardrobe/s |
| Bedroom 2 | + Curtains/Blinds; Doors/Windows combined |
| Bedroom 3 | same pattern as Bedroom 2 |
| Continuation | Extensible Room & Location rows |

### G.7.6 Closing

Move-in / Move-out dates + Landlord/Agent + Tenant signatures; note that photos have been taken.

### G.7.7 Pre-move-in repairs gate (unchanged CONFIRMED)

Defect → estimate → landlord approval/funding → repair → verify → allow move-in (unless waiver).

<details open>
<summary><strong>Embedded source — Doc 9 Inventory Condition (verbatim)</strong></summary>

`;

const G15 = `## G.15 Property management engagement proposal — EXTRACTED (Doc 11)

> **Source:** Google Doc 11 — https://docs.google.com/document/d/10RNOVkMsUYptSPWZnGl3Fb5gE5_O2ocNorAdxe1pLOY/edit  
> **Status:** EXTRACTED — defines FM service package + letting/management fee model for owner engagement.  
> **Not** a substitute for the full tenant–FM–landlord agreement (still WAITING).

### G.15.1 Service modules (must exist in product)

1. Tenant Acquisition and Screening (advertising, showings, lease prep, background checks)
2. Rental Collection and Financial Management (collect, report, remit)
3. Property Maintenance and Repairs
4. Tenancy/Lease Administration and Renewals (incl. inspections)
5. Comprehensive Financial Analysis and Reporting (income statement, balance sheet, cash flow)

### G.15.2 Marketing channels (EXTRACTED)

Digital advertising · Targeted outreach · On-site “For Lease” signage.

Owner acceptance authorizes advertising + physical signage + fee collection.

### G.15.3 Professional fees (EXTRACTED)

| Fee | Rule |
|-----|------|
| Letting Fee | **10% of gross rent** for securing a **new tenant** |
| Management Fee | After new tenant secured: **agreed %** (negotiated) of **gross yearly rent collected** |

<details open>
<summary><strong>Embedded source — Doc 11 PM Services Proposal (verbatim)</strong></summary>

`;

async function main() {
  let master = await readFile(MASTER, 'utf8');
  const [d9, d10, d11, d12, batch2] = await Promise.all([
    readFile(DOC9, 'utf8'),
    readFile(DOC10, 'utf8'),
    readFile(DOC11, 'utf8'),
    readFile(DOC12, 'utf8'),
    readFile(BATCH2, 'utf8'),
  ]);

  // Update form registry statuses
  master = master.replace(
    '| FORM_TENANT_APPLICATION | Tenant Application | Property Mgmt | Partial (Part D) / WAITING full |',
    '| FORM_TENANT_APPLICATION | Tenant Application | Property Mgmt | **EXTRACTED** Doc 12 / Part D FORM 4 |'
  );
  master = master.replace(
    '| FORM_OFFER_LETTER | Offer Letter (rent/SC/deposit) | Property Mgmt | WAITING template |',
    '| FORM_OFFER_LETTER | Offer Letter (rent/SC/deposit/fees) | Property Mgmt | **EXTRACTED** Doc 10 example schema |'
  );
  master = master.replace(
    '| FORM_MOVE_IN_INSPECTION | Move-in Inspection | Property Mgmt | CONFIRMED components; form WAITING |',
    '| FORM_MOVE_IN_INSPECTION | Move-in Inventory Condition | Property Mgmt | **EXTRACTED** Doc 9 |'
  );
  master = master.replace(
    '| FORM_MOVE_OUT_INSPECTION | Move-out Inspection | Property Mgmt | WAITING |',
    '| FORM_MOVE_OUT_INSPECTION | Move-out Inventory Condition | Property Mgmt | **EXTRACTED** Doc 9 (same form) |'
  );

  if (!master.includes('FORM_PM_ENGAGEMENT_PROPOSAL')) {
    master = master.replace(
      '| FORM_WORKS_CONTRACT | Works / Construction Contract Link | Procurement | CONFIRMED link to project; agreement WAITING |',
      `| FORM_WORKS_CONTRACT | Works / Construction Contract Link | Procurement | CONFIRMED link to project; agreement WAITING |
| FORM_PM_ENGAGEMENT_PROPOSAL | Property Management Services Proposal | Property Mgmt | **EXTRACTED** Doc 11 |`
    );
  }

  // Replace G.4 through start of G.5
  master = replaceBetween(
    master,
    '## G.4 Tenant application',
    '## G.5 Tenant selection scoring',
    G4 + '\n' + d12.trim() + '\n\n</details>\n'
  );

  // Replace G.6 through G.7
  master = replaceBetween(
    master,
    '## G.6 Offer letter → tenancy agreement',
    '## G.7 Move-in inspection',
    G6 + '\n' + d10.trim() + '\n\n</details>\n'
  );

  // Replace G.7 through G.8
  master = replaceBetween(
    master,
    '## G.7 Move-in inspection',
    '## G.8 Pre-move-in repairs',
    G7 + '\n' + d9.trim() + '\n\n</details>\n'
  );

  // Insert G.15 before Part H if missing
  if (!master.includes('## G.15 Property management engagement')) {
    master = master.replace(
      '# Part H: Property Sales',
      G15 + '\n' + d11.trim() + '\n\n</details>\n\n---\n\n# Part H: Property Sales'
    );
  }

  // Update Part F incoming batch status
  master = master.replace(
    `| 9 | https://docs.google.com/document/d/1dzfQ4g8nLyzZhJOqYeqarh8uNgzJpQHzCFGhsRKc2PE/edit | **401 private** — awaiting “Anyone with the link” |
| 10 | https://docs.google.com/document/d/1w2yKKi4kGugWxN-GOHvdx74yzv5VY09Ft04ekHOl2_A/edit | **401 private** |
| 11 | https://docs.google.com/document/d/10RNOVkMsUYptSPWZnGl3Fb5gE5_O2ocNorAdxe1pLOY/edit | **401 private** |
| 12 | https://docs.google.com/document/d/1gyLTbxuBUdO2trPSeXGPlaYpLd9mLsPvwwJJXWcOALM/edit | **401 private** |

Once public: extract verbatim → classify which Part F rows they close → update Parts G/H/I/J → mark EXTRACTED.`,
    `| 9 | Inventory Condition (Move-in/out) | **EXTRACTED** Doc 9 |
| 10 | Offer Letter (Guzape 2-bed example) | **EXTRACTED** Doc 10 |
| 11 | PM Services Proposal (Dawaki) | **EXTRACTED** Doc 11 |
| 12 | Tenant Application Personal Data | **EXTRACTED** Doc 12 |

Full write-up: \`planning/extractions/ABRAHAM_PROPERTY_DOCS_BATCH2.md\`. Verbatim embedded under Part G.`
  );

  // Update waiting table rows that are now extracted
  master = master.replace(
    '| Tenant application form | Finalize FORM_TENANT_APPLICATION fields |',
    '| Tenant application form | **DONE — EXTRACTED** Doc 12 / FORM 4 |'
  );
  master = master.replace(
    '| Offer letter | FORM_OFFER_LETTER |',
    '| Offer letter | **DONE — EXTRACTED** Doc 10 schema (blank template optional) |'
  );
  master = master.replace(
    '| Move-in inspection form | Expand FORM_MOVE_IN beyond verbal list |',
    '| Move-in inspection form | **DONE — EXTRACTED** Doc 9 |'
  );
  master = master.replace(
    '| Move-out inspection form | Compare-to-move-in |',
    '| Move-out inspection form | **DONE — EXTRACTED** Doc 9 (dual form) |'
  );

  // Append batch2 summary into Part C if not present
  if (!master.includes('ABRAHAM_PROPERTY_DOCS_BATCH2')) {
    const partD = master.indexOf('# Part D: Form Field Specs');
    if (partD > 0) {
      const insert = `\n\n---\n\n# Part C-2: Property Documents Batch 2 (Sep 8, 2026)\n\n> See also standalone: \`planning/extractions/ABRAHAM_PROPERTY_DOCS_BATCH2.md\`\n\n${batch2}\n\n---\n\n`;
      master = master.slice(0, partD) + insert + master.slice(partD);
    }
  }

  // Bump updated date in header
  master = master.replace(
    /\*\*Updated:\*\* Sep 8, 2026 \([^)]+\)/,
    '**Updated:** Sep 8, 2026 (Property Docs Batch 2 EXTRACTED — inventory, offer letter, PM proposal, tenant application)'
  );

  // FORM 4 source note
  master = master.replace(
    '**Source:** `TENANT APPLICATION FORM.docx`  \n**Module:** Rentals → Tenant Onboarding',
    '**Source:** `TENANT APPLICATION FORM.docx` + Google Doc 12 (`1gyLTbxuBUdO2trPSeXGPlaYpLd9mLsPvwwJJXWcOALM`) — **EXTRACTED**  \n**Module:** Rentals → Tenant Onboarding'
  );

  await writeFile(MASTER, master, 'utf8');
  console.log('Master updated. Lines:', master.split(/\n/).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
