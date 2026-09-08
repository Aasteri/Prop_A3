# Purchase Requisition (Goods) — Production Default

> **Status: PRODUCTION DEFAULT** · **Form ID:** `FORM_PURCHASE_REQUISITION`  
> Start of Goods workflow: Need → PR → Review → Supplier match → PO.

---

## 1. Header

| Field | Rules |
|-------|-------|
| PR No. | `PR-{PROJECT\|PROPERTY}-{YYYYMM}-{SEQ}` |
| Date | |
| Requested by | User |
| Department / site | |
| Linked project | fk nullable |
| Linked property | fk nullable |
| Needed by date | Required |
| Priority | Normal · Urgent · Stoppage risk |
| Status | draft · submitted · approved · rejected · converted_to_po |

## 2. Justification

| Field | Rules |
|-------|-------|
| Why required | Required |
| BOQ / material schedule ref | Optional |
| Daily log / WBS ref | Optional |

## 3. Line items

| # | Item description | Spec / grade | Unit | Qty | Est. unit cost ₦ | Est. total ₦ | Preferred supplier (optional) |
|---|------------------|--------------|------|-----|------------------|--------------|-------------------------------|
| 1 | | | | | | | |

**Units (NG construction):** bags, tons, trip, pieces, lengths, litres, sheets, rolls, set, sum

## 4. Approvals

| Role | Name | Decision | Date |
|------|------|----------|------|
| Requester | | Submit | |
| PM / Procurement | | Approve / Reject | |
| Finance (if over threshold) | | Approve / Reject | |

Approval threshold: configurable org setting.

## 5. App model

```
purchase_requisitions: id, number, project_id, property_id, requested_by, needed_by, status
purchase_requisition_lines: pr_id, description, spec, unit, qty, est_unit_cost
```
