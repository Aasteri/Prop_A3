# Tenancy Agreement — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template for propA3.  
> **Supersession:** If Abraham later supplies a different agreement, extract and replace this file; until then this is the system source of truth.  
> **Form ID:** `FORM_TENANCY_AGREEMENT`  
> **Governing context:** Residential / mixed-use tenancies in FCT Abuja and similar Nigerian jurisdictions. Adapt state-specific notice periods via config.  
> **Related:** Offer Letter (Doc 10 EXTRACTED), Tenant Application (Doc 12 EXTRACTED), Inventory (Doc 9 EXTRACTED), FM–Landlord Agreement.

---

## 1. Document control

| Field | Value |
|-------|-------|
| Agreement No. | `TA-{PROPERTY_CODE}-{YYYY}-{SEQ}` |
| Version | 1.0 |
| Prepared by | Facility / Property Manager |
| Jurisdiction | Federal Capital Territory, Abuja (default; configurable) |
| Effective date | |
| Linked offer letter ref | |
| Linked tenant application ref | |
| Linked inventory (move-in) ref | |

---

## 2. Parties

### 2.1 Landlord / Owner

| Field | Value |
|-------|-------|
| Full legal name | |
| Address | |
| Phone | |
| Email | |
| ID type / number (optional) | |

### 2.2 Managing Agent (if appointed)

| Field | Value |
|-------|-------|
| Firm name | Triple A Realty Projects Ltd / A. Laucarie Consulting |
| Address | Suite D15B, Platinum Mega Plaza, Jahi, Abuja (configurable) |
| Phone | |
| Email | |
| Authority to collect rent | Yes / No |
| Authority to issue notices | Yes / No |

### 2.3 Tenant(s)

| Field | Value |
|-------|-------|
| Full name(s) | |
| Phone | |
| Email | |
| Occupation | |
| Permanent address | |
| Next of kin name / phone | |

### 2.4 Guarantor

| Field | Value |
|-------|-------|
| Full name | |
| Phone | |
| Address / place of work | |
| Relationship to tenant | |
| Guarantee scope | Rent, caution shortfall, and tenant obligations under this agreement |

---

## 3. Property / demised premises

| Field | Value |
|-------|-------|
| Property name / estate | |
| Full address | |
| Unit identifier | e.g. Flat 2, Block B |
| Property type | 1-bed / 2-bed / 3-bed / duplex / other |
| Inclusive amenities | Parking · BQ · Generator access · Borehole · Estate facilities (list) |
| Title / ownership note | For reference only — not a title transfer |

---

## 4. Term

| Field | Value |
|-------|-------|
| Commencement date | |
| Expiry date | |
| Tenancy term | Usually 1 year (configurable) |
| Renewal | By mutual written agreement; subject to renewal notices at **3 months** and **1 month** before expiry |
| Holding over | Occupancy after expiry without renewal/payment is breach; recovery process may commence |

---

## 5. Rent, deposits and charges

| Item | Amount (₦) | Frequency | Payable to |
|------|------------|-----------|------------|
| Fixed rent | | Per annum | Landlord account (per offer) |
| Caution / security deposit | | One-off | Landlord / Agent as stated on offer |
| Service charge | | Per annum | Management / SC ledger |
| Estate surcharge (if any) | | Per annum | As stated on offer (e.g. ENL) |
| Agency fee | | As offer / application | Agency account |
| Legal fee | | As offer / application | Management / legal account |

**Payment rules**

| Rule | Detail |
|------|--------|
| Due date | As stated on offer / anniversary |
| Mode | Bank transfer / cheque / other approved |
| Receipt | Issued for every payment |
| Late payment | Reminder → arrears notice → recovery process per notices module |
| Rent vs expenses | Recorded separately; remittance = gross − approved expenses |

**Application fee clause (from Doc 12 EXTRACTED):** Tenant acknowledged on application that **20% of rental value** may be payable as Agency and Legal fees for professional services (configurable schedule may split Agency/Legal/Management as on Offer Letter Doc 10).

---

## 6. Landlord covenants

1. Allow quiet enjoyment while tenant complies with this agreement.  
2. Keep structure (roof, external walls, foundation) in reasonable repair.  
3. Ensure major plumbing, electrical, and common services are maintained (directly or via Agent).  
4. Not unlawfully disturb occupation or use self-help eviction.  
5. Return caution deposit (less lawful deductions) within configured days after move-out settlement.

---

## 7. Tenant covenants

1. Pay rent and agreed charges on time.  
2. Use premises only as private residence / agreed use.  
3. Keep interior clean; perform minor upkeep (bulbs, minor fittings, cleanliness).  
4. Not cause damage beyond fair wear and tear.  
5. Not sublet, assign, or part with possession without prior written consent.  
6. Not make structural alterations without written consent.  
7. Report defects promptly via the maintenance channel.  
8. Allow reasonable inspection access on notice (except emergencies).  
9. Comply with estate rules and service-charge regulations.  
10. Return keys and vacant possession on expiry/termination.

---

## 8. Managing Agent / Facility Manager duties (when appointed)

1. Collect rent and remit per remittance schedule.  
2. Administer tenancy, renewals, and inspections.  
3. Coordinate maintenance using **available service-charge funds** as the spend boundary; escalate to Landlord when cost exceeds available SC.  
4. Keep financial records and provide statements.  
5. Manage move-in / move-out inventory comparison and deposit settlement.

---

## 9. Maintenance responsibility matrix (default)

| Category | Examples | Responsible | Funding |
|----------|----------|-------------|---------|
| Structural | Roof leak (structure), foundation, external wall fabric | Landlord | Landlord |
| Major MEP | Main electrical board failure, major pipe burst, borehole pump (if landlord asset) | Landlord | Landlord (unless SC covers) |
| SC-covered common services | External lights, compound cleaning, AEPB, estate water, security (per offer SC description) | FM | Service charge |
| Minor internal | Bulbs, minor taps washers, internal cleanliness, tenant-caused breakage | Tenant | Tenant |
| Pre-move-in defects | Found at inventory before move-in | Landlord | Landlord approval gate before move-in |
| Emergency make-safe | Stop leak, isolate power | FM may act immediately | SC if available else Landlord |

---

## 10. Service charge

| Field | Detail |
|-------|--------|
| Annual SC amount | |
| What SC covers | Per offer letter schedule |
| Unspent SC | Carried in ledger (treatment configurable; default: remain credited to property SC account) |
| Spend rule | FM may commit maintenance only within **available SC balance**; excess requires Landlord approval |

---

## 11. Inventory, damage and deposit

1. Move-in inventory (Doc 9 schema) is baseline.  
2. Discrepancies on move-in inventory must be reported **in writing within 7 days**.  
3. Move-out inventory compared room-by-room.  
4. Fair wear and tear → not charged to tenant.  
5. Tenant-caused damage → deduct from caution; if shortfall → invoice tenant.  
6. Settlement record produced before deposit release.

---

## 12. Termination & notices

| Event | Action |
|-------|--------|
| End of term | Renewal or exit; reminders at 3 months and 1 month |
| Breach / arrears | Arrears notice → remedy window → possession process |
| Early termination | Only as written addendum allows |

Notice templates: `RENEWAL_NOTICE.md`, `POSSESSION_ARREARS_NOTICE.md`.

---

## 13. Dispute resolution

Negotiate in good faith → mediation → courts of competent jurisdiction in the configured state/FCT.

---

## 14. Signatures

| Party | Name | Signature | Date |
|-------|------|-----------|------|
| Landlord / Owner | | | |
| Managing Agent | | | |
| Tenant | | | |
| Guarantor | | | |
| Witness (optional) | | | |

---

## 15. App data model

```
tenancy: id, property_id, unit_id, tenant_id, guarantor_id, agent_org_id,
  agreement_no, start_date, end_date, rent_annual, caution, service_charge,
  estate_surcharge, status [draft|active|renewal_pending|expired|terminated],
  offer_letter_id, application_id, move_in_inventory_id, move_out_inventory_id
tenancy_fee_lines: type [agency|legal|management|other], pct_or_amount, payee_account_id
```
