# Maintenance Payor Matrix — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_MAINTENANCE_PAYOR_MATRIX`  
> Default who pays what. Override per property / lease addendum when documented.

---

## 1. Principles

1. **Fair wear and tear** → Landlord (not charged to tenant).  
2. **Tenant-caused damage** → Tenant (caution first, then invoice).  
3. **Common / estate services** → Service charge, within **available SC balance**.  
4. **Above SC balance** → Landlord approval before commit (emergency make-safe excepted).

---

## 2. Default matrix

| Category | Examples | Payor | Funding |
|----------|----------|-------|---------|
| Structural | Roof structure, foundation, external wall fabric | Landlord | Landlord |
| Major MEP | Main board failure, major pipe burst, borehole pump (landlord asset) | Landlord | Landlord (unless SC covers) |
| SC-covered commons | External lights, compound cleaning, AEPB, estate water, security (per SC schedule) | FM / estate | Service charge |
| Minor internal | Bulbs, minor washers, cleanliness, tenant fixtures | Tenant | Tenant |
| Pre-move-in defects | Found at inventory before move-in | Landlord | Landlord gate before move-in |
| Emergency make-safe | Stop leak, isolate power | FM may act | SC if available else Landlord |
| Appliance (tenant-owned) | Tenant fridge, AC bought by tenant | Tenant | Tenant |
| Appliance (landlord-supplied) | Listed on inventory as landlord asset | Landlord (wear) / Tenant (misuse) | As applicable |
| Artisan labour on SC job | Approved work order within SC | SC ledger | SC (− platform fee rules if applicable) |
| Artisan labour landlord-approved | Above SC or landlord-direct | Landlord | Landlord |

---

## 3. Decision flow

```
Request → classify category → check SC balance (if SC-eligible)
  → within SC: FM proceeds
  → above SC: Landlord written approval
  → tenant-caused: charge tenant / caution
```

---

## 4. App model

```
maintenance_payor_rules: property_id?, category, payor [LANDLORD|TENANT|SC|SPLIT], notes
maintenance_requests: payor_override?, sc_gate_passed, landlord_approved_at
```
