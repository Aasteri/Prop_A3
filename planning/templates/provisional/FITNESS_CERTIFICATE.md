# Fitness / UAT Handover Certificate — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_FITNESS_CERTIFICATE`  
> Used at practical completion / unit handover / pre-move-in readiness sign-off.

---

## 1. Document control

| Field | Value |
|-------|-------|
| Certificate No. | `FIT-{PROJECT_OR_PROPERTY}-{YYYY}-{SEQ}` |
| Date of inspection | |
| Project / property | |
| Unit / block | |
| Prepared by | |
| Witnessed by (client / landlord / tenant) | |

---

## 2. Scope

This certificate records that the premises (or defined works package) were inspected against the agreed snag / UAT checklist and are fit for the stated purpose, subject to any listed outstanding items.

| Field | Value |
|-------|-------|
| Purpose | Residential occupancy · Commercial use · Works package handover |
| Reference drawings / BOQ / snag list | |
| Linked inventory / inspection | |

---

## 3. Checklist summary

| Area | Result (PASS / FAIL / NA) | Remarks |
|------|---------------------------|---------|
| Structure / fabric | | |
| Electrical | | |
| Plumbing / drainage | | |
| Doors / windows / locks | | |
| Finishes | | |
| Sanitary fittings | | |
| Kitchen / appliances (if any) | | |
| External / compound | | |
| Safety (extinguishers, exits, etc.) | | |
| Meters & readings recorded | | |

---

## 4. Outstanding items (snags)

| # | Item | Owner | Target date | Status |
|---|------|-------|-------------|--------|
| 1 | | | | |

---

## 5. Declaration

We certify that, except for outstanding items listed above, the premises / works are fit for the stated purpose as of the inspection date.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Contractor / Site lead | | | |
| Project / Facility Manager | | | |
| Client / Landlord / Tenant | | | |

---

## 6. App model

```
fitness_certificates: id, number, property_id?, project_id?, unit_id?,
  inspected_at, checklist_json, snags_json, status, signed_by_json
```
