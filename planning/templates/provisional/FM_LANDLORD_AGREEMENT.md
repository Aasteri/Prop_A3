# Facility Manager ↔ Landlord Agreement — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_FM_LANDLORD_AGREEMENT`  
> **Anchors:** Doc 11 PM Services Proposal (EXTRACTED) · Abraham SC spend rule · Doc 10 fee patterns  
> **Supersession:** Replace only when Abraham supplies a fuller owner–manager instrument.

---

## 1. Document control

| Field | Value |
|-------|-------|
| Agreement No. | `PMA-{YYYY}-{SEQ}` |
| Date | |
| Initial term | 12 months (default), renewable |
| Property portfolio | Single property / multi-unit list attached |

---

## 2. Parties

### Owner (Principal)

| Field | Value |
|-------|-------|
| Full name | |
| Address | |
| Phone / email | |
| Bank account for remittances | |

### Manager (Agent)

| Field | Value |
|-------|-------|
| Firm | A. Laucarie Consulting / Triple A Realty Projects Ltd |
| Address | Suite D15B, Platinum Mega Plaza, Jahi, Abuja |
| Phones | 09121061221, 08052538585 (configurable) |
| Professional capacity | Estate Surveyors & Valuers / Property & Facility Management |

---

## 3. Property schedule

| # | Address / description | Units | Type |
|---|----------------------|-------|------|
| 1 | | | e.g. 4 × 2-bed + 1 × 5-bed duplex |

Attach title copies / C of O where available (reference only).

---

## 4. Appointed services (mandatory scope)

| # | Service | Included |
|---|---------|----------|
| 1 | Tenant acquisition & screening (advertising, showings, background checks, evaluation scores) | Yes |
| 2 | Lease / tenancy preparation & administration | Yes |
| 3 | Rent collection, receipts, remittance to Owner | Yes |
| 4 | Service-charge administration & maintenance coordination | Yes |
| 5 | Move-in / move-out inventories | Yes |
| 6 | Renewals & vacancy marketing | Yes |
| 7 | Financial reporting (income, expenses, cash position) | Yes |
| 8 | Digital advertising + on-site “For Lease” signage | Yes (Owner authorises) |

---

## 5. Professional fees (defaults — configurable per property)

| Fee | Default rule | Source |
|-----|--------------|--------|
| **Letting fee** | **10% of gross rent** for securing a **new tenant** | Doc 11 EXTRACTED |
| **Management fee** | Agreed **% of gross yearly rent collected** after tenant secured | Doc 11 EXTRACTED |
| **Agency fee (tenant side)** | Often **10% of rent** on offer | Doc 10 EXTRACTED |
| **Legal fee** | Often **5% of rent** on offer | Doc 10 EXTRACTED |
| **Management fee (tenant-facing line)** | Often **5% of rent** on offer | Doc 10 EXTRACTED |
| **Application acceptance** | Tenant accepts **20% Agency + Legal** combined on application | Doc 12 EXTRACTED |

Fee schedule attachment must list exact % and payee accounts for each property.

---

## 6. Authority & limits

| Authority | Rule |
|-----------|------|
| Advertise property | Yes — digital + physical signage |
| Sign tenancy ≤ 1 year | Yes, unless Owner opts out |
| Collect rent | Yes |
| Maintenance spend | **Only within available service-charge balance** (Abraham CONFIRMED). Above balance → written Owner approval before commit |
| Emergency make-safe | Manager may act immediately to prevent further loss; notify Owner within 24 hours |
| Instruct artisans / suppliers | Yes, via platform KYC vendors |
| Legal proceedings | Only with Owner written instruction |

---

## 7. Remittance & reporting

| Item | Default |
|------|---------|
| Remittance frequency | Monthly (configurable) |
| Net remittance | Gross collected − approved expenses |
| Reports | Rent roll, SC statement, maintenance log, arrears aging |
| Documents | Offers, tenancies, inventories stored on propA3 |

---

## 8. Owner obligations

Provide keys, access, title info, insurance status, decision on spends above SC, and timely funding when required.

---

## 9. Termination

Either party: 30 days written notice after initial term (configurable), or immediately for material breach. Hand back keys, records, and final account within 14 days.

---

## 10. Acceptance (from Doc 11 pattern)

Owner authorises Manager to: (1) advertise; (2) place signage; (3) collect professional fees as scheduled.

| Party | Name | Signature | Date |
|-------|------|-----------|------|
| Owner | | | |
| Manager | | | |

---

## 11. App model

```
pm_engagement: id, owner_id, manager_org_id, start_date, end_date, status,
  letting_fee_pct, management_fee_pct, remittance_frequency
pm_engagement_properties: engagement_id, property_id
```
