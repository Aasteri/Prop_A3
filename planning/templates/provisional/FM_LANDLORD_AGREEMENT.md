# Facility Manager ↔ Landlord Agreement — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_FM_LANDLORD_AGREEMENT`  
> **Anchors:** Doc 11 PM Services Proposal · Abraham SC spend rule · Doc 10 fee patterns

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

### Owner (Principal / Landlord)

| Field | Value |
|-------|-------|
| Full name | |
| Address | |
| Phone / email | |
| Bank account for remittances | |

### Manager (Agent)

| Field | Value |
|-------|-------|
| Firm | Triple A Realty Projects Ltd |
| Trading / related | A. Laucarie Consulting (legacy offers may still show) |
| Address | Suite D15B, Platinum Mega Plaza, Jahi, Abuja |
| Professional capacity | Estate Surveyors & Valuers / Property & Facility Management |

---

## 3. Appointment & services

Owner appoints Manager to:

1. Tenant acquisition & screening (advertising, showings, evaluation scores)  
2. Lease / tenancy preparation & administration  
3. Rent collection, receipts, remittance to Owner  
4. Service-charge administration & maintenance coordination  
5. Move-in / move-out inventories  
6. Renewals & vacancy marketing  
7. Financial reporting (income, expenses, cash position)  
8. Digital advertising + on-site “For Lease” signage (Owner authorises)

---

## 4. Professional fees (defaults — configurable per property)

| Fee | Default rule |
|-----|--------------|
| Letting fee | **10% of gross rent** for securing a **new tenant** |
| Management fee | Agreed **% of gross yearly rent collected** after tenant secured |
| Agency fee (tenant side) | Often **10% of rent** on offer |
| Legal fee | Often **5% of rent** on offer |
| Management fee (tenant-facing line) | Often **5% of rent** on offer |
| Application acceptance | Tenant accepts **Agency + Legal** combined % on application (often 20%) |

Exact % and payee accounts listed on the property fee schedule / offer.

---

## 5. Remittance

| Item | Default |
|------|---------|
| Frequency | Monthly (configurable) |
| Computation | **Gross collected − approved deductions = net** remitted to Owner |
| Statement | Remittance advice / `REMITTANCE_STATEMENT.md` |
| Channel | All money into the system first; then attributed and remitted |

---

## 6. Service charge handling & maintenance spend

| Rule | Detail |
|------|--------|
| SC collection | Per offer / SC schedule; held in property SC ledger |
| Spend boundary | Manager may commit maintenance **only within available SC balance** (CONFIRMED) |
| Excess | Written Owner approval before commit |
| Emergency make-safe | Manager may act immediately; notify Owner within 24 hours |

---

## 7. Reporting

Rent roll · SC statement · maintenance log · arrears aging · offers/tenancies/inventories on propA3.

---

## 8. Owner obligations

Provide keys, access, title info, insurance status, decisions on spends above SC, and timely funding when required.

---

## 9. Termination

Either party: 30 days written notice after initial term (configurable), or immediately for material breach. Hand back keys, records, and final account within 14 days.

---

## 10. Acceptance

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
