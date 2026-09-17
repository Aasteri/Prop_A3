# Commission Arrangement — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_COMMISSION`  
> Defaults for internal vs external agents. Override per deal; always show schedule before acceptance.

---

## 1. Default schedule (editable per org / deal)

| Scenario | Default commission | Notes |
|----------|-------------------|-------|
| **Internal agent** (propA3 staff / sole listing) | **5%** of sale price to firm (configurable) | Staff incentive split is internal HR/payroll — not hidden from deal memo |
| **External agent** listing / intro | Split e.g. **external 3% / propA3 2%** (configurable) | Show both payees on deal |
| Co-brokerage | As deal memo | Written before acceptance |
| Letting / agency (rentals) | Per Doc 10 / engagement fee schedule | Not this sales commission form |

All % are **configurable**; never hard-code hidden fees.

---

## 2. Fields

| Field | Value |
|-------|-------|
| Deal / listing ref | |
| Gross price ₦ | |
| Commission % (total) | |
| Commission amount ₦ | |
| Internal share % / ₦ | |
| External agent name / share % / ₦ | |
| When payable | On deposit · On completion · Other |
| Invoice / money inflow refs | |
| Signatures | |

---

## 3. Attribution

When payment is received into the system, create money attributions:

- Firm share → `COMPANY` / `COMMISSION`  
- External agent share → `EXTERNAL_AGENT` / `COMMISSION`  
- Internal staff bonus (if tracked) → `INTERNAL_STAFF` / `COMMISSION`

---

## 4. Rule

Never hard-code hidden fees; always show schedule on the deal before acceptance.
