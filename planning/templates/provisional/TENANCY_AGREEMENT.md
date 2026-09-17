# Tenancy Agreement — Nigeria Residential (Production Default)

> **Status: PRODUCTION DEFAULT** — Complete operational template for propA3.  
> **Form ID:** `FORM_TENANCY_AGREEMENT`  
> **Jurisdiction:** Federal Capital Territory, Abuja (default; adapt notice periods by state).  
> **Placeholders (PDF fill):** `{{landlord}}` · `{{tenant}}` · `{{property}}` · `{{rent}}` · `{{start}}` · `{{end}}` · `{{caution}}`

---

## 1. Document control

| Field | Value |
|-------|-------|
| Agreement No. | `TA-{PROPERTY_CODE}-{YYYY}-{SEQ}` |
| Version | 1.1 |
| Prepared by | Facility / Property Manager |
| Linked offer letter | |
| Linked tenant application | |
| Linked move-in inventory | |

---

## 2. Parties

### 2.1 Landlord / Owner

| Field | Value |
|-------|-------|
| Full legal name | {{landlord}} |
| Address | |
| Phone / email | |

### 2.2 Managing Agent (if appointed)

| Field | Value |
|-------|-------|
| Firm name | Triple A Realty Projects Ltd |
| Address | Suite D15B, Platinum Mega Plaza, Jahi, Abuja |
| Authority to collect rent | Yes / No |
| Authority to issue notices | Yes / No |
| Agency fee | Per offer / application schedule |

### 2.3 Tenant(s)

| Field | Value |
|-------|-------|
| Full name(s) | {{tenant}} |
| Phone / email | |
| Occupation | |
| Permanent address | |

### 2.4 Guarantor

| Field | Value |
|-------|-------|
| Full name | |
| Phone / work address | |
| Guarantee scope | Rent, caution shortfall, and tenant obligations under this agreement |

---

## 3. Property / demised premises

| Field | Value |
|-------|-------|
| Description / address | {{property}} |
| Unit identifier | |
| Inclusive amenities | Parking · BQ · Generator · Borehole · Estate facilities (list) |

---

## 4. Term

| Field | Value |
|-------|-------|
| Commencement | {{start}} |
| Expiry | {{end}} |
| Tenancy term | Usually 1 year (configurable) |
| Renewal | Mutual written agreement; reminders at **3 months** and **1 month** before expiry |
| Holding over | Occupancy after expiry without renewal/payment is breach |

---

## 5. Rent, deposit (caution), service charge & agency

| Item | Amount | Notes |
|------|--------|-------|
| Fixed rent | {{rent}} | Per annum unless stated otherwise |
| Caution / security deposit | {{caution}} | One-off; refundable less lawful deductions |
| Service charge | | Annual; administered by Manager |
| Agency / professional fees | | Per offer letter / application |

**Payment:** Bank transfer into the system (or approved channel). Receipt issued for every payment. Late payment → reminder → arrears notice → recovery process.

---

## 6. Quiet enjoyment

Landlord (and Agent) covenant that while Tenant pays rent and observes this agreement, Tenant may quietly enjoy the premises without unlawful interruption or self-help eviction.

---

## 7. Repairs — landlord / tenant split (default)

| Party | Responsibility |
|-------|----------------|
| **Landlord** | Structure (roof, external walls, foundation); major MEP; keep premises fit for habitation at start of term |
| **Tenant** | Interior cleanliness; minor upkeep (bulbs, minor fittings); damage beyond fair wear and tear |
| **Manager (SC)** | Common services funded from **available service-charge balance**; escalate to Landlord when cost exceeds SC |

Full default matrix: `MAINTENANCE_PAYOR_MATRIX.md`.

---

## 8. Tenant covenants (summary)

1. Pay rent and agreed charges on time.  
2. Use as private residence / agreed use only.  
3. No subletting/assignment without written consent.  
4. No structural alterations without written consent.  
5. Report defects promptly; allow reasonable inspection on notice.  
6. Comply with estate rules; return keys and vacant possession on exit.

---

## 9. Termination & notice

| Event | Action |
|-------|--------|
| End of term | Renewal or exit; 3-month and 1-month reminders |
| Breach / arrears | Arrears notice → remedy window → possession process |
| Early termination | Only as written addendum allows |

Notice templates: `RENEWAL_NOTICE.md`, `POSSESSION_ARREARS_NOTICE.md`.

---

## 10. Service charge & agency

Service charge covers items listed on the offer. Unspent SC remains in the property SC ledger (default). Agency acts for Landlord within the FM–Landlord appointment; fee lines as on the accepted offer.

---

## 11. Signatures

| Party | Name | Signature | Date |
|-------|------|-----------|------|
| Landlord | {{landlord}} | | |
| Managing Agent | Triple A Realty Projects Ltd | | |
| Tenant | {{tenant}} | | |
| Guarantor | | | |

---

## 12. App model

```
tenancy: id, property_id, unit_id, tenant_name, start_date, end_date,
  rent_annual, caution_amount, service_charge, agreement_no, status
```
