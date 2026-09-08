# Maintenance Work Order — Production Default

> **Status: PRODUCTION DEFAULT** · **Form ID:** `FORM_MAINTENANCE_WORK_ORDER`  
> Spend gate: available service charge (Abraham CONFIRMED). Payment only after tenant confirmation.

---

## 1. Header

| Field | Rules |
|-------|-------|
| WO No. | `WO-{YYYYMM}-{SEQ}` |
| Linked request | Required |
| Property / unit | Inherited |
| Issued by | FM user |
| Issued at | datetime |
| Priority | Copied from request; editable |
| Artisan / contractor | fk `artisan_profile` |

## 2. Scope of work

| Field | Rules |
|-------|-------|
| Work description | Required |
| Suggested tools | Optional multi-text |
| Suggested materials | Optional lines |
| Site access notes | Optional |
| Target start / end | dates |

## 3. Commercial estimate

| Field | Rules |
|-------|-------|
| Labour / service fee (₦) | Required — **2.5% base** |
| Materials (₦) | Separate — **excluded from 2.5%** |
| Platform fee 2.5% | `0.025 * labour` when Services category |
| Gross payable to artisan | labour + materials (per contract) |
| Available SC balance | System lookup |
| Within SC? | Boolean computed |
| Landlord approval ref | Required if not within SC |
| Landlord approved amount | currency |

## 4. Execution & evidence

| Field | Rules |
|-------|-------|
| Dispatched at | datetime |
| Completed at | datetime |
| Completion photos | ≥ 1 required |
| Artisan notes | textarea |
| Artisan sign-off | signature / checkbox |

## 5. Tenant gate (CONFIRMED)

| Field | Rules |
|-------|-------|
| Tenant satisfied | Y/N required before payment release |
| Rating | 1–5 (configurable scale) |
| Feedback | textarea |
| Confirmed at | datetime |

## 6. Status machine

`draft` → `pending_sc_or_landlord` → `approved` → `assigned` → `in_progress` → `completed_pending_confirm` → `confirmed` → `invoiced` → `paid` → `closed`

## 7. App model

```
work_orders: id, request_id, artisan_id, number, labour_amount, materials_amount,
  platform_fee, sc_ok, landlord_approval_id, status, completed_at, tenant_rating
```
