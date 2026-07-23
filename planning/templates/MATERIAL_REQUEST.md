# Material Request Form (Draft Template)

> **Status:** Industry-standard draft — replace with Abraham's version when received  
> **Workflow:** Foreman → PM approval → Store issuance  
> **Team Charter rule:** All issuances must be authorised by Foreman or PM

---

## Header

| Field | Value |
|---|---|
| Request No. | `MR-{PROJECT_CODE}-{YYYYMM}-{SEQ}` (auto-generated) |
| Date | |
| Project Name | |
| Site Location | |
| Requested By (Foreman) | |
| Approved By (PM) | |

---

## Line Items

| # | Material Description | Specification / Grade | Unit | Qty Requested | Qty Approved | Purpose / Area of Work | Required Date |
|---|---|---|---|---|---|---|---|
| 1 | e.g. Cement | Dangote 42.5R | bags | | | Foundation Block A | |
| 2 | e.g. Sharp sand | — | trip | | | | |
| 3 | e.g. 12mm rebar | High tensile | lengths/tons | | | | |
| 4 | e.g. 6" blocks | | pieces | | | | |

**Common units (Nigeria construction):** bags, tons, trip (sand/gravel), pieces, lengths, litres, sheets, rolls

---

## Justification

| Field | Detail |
|---|---|
| Linked daily log ref | DL-xxx (optional) |
| BOQ line ref | BOQ-xxx (optional) |
| Urgency | Normal / Urgent (stoppage risk) |
| Reason if urgent | |

---

## Store Use Only

| # | Material | Qty Issued | Balance Before | Balance After | Issued By | Date |
|---|---|---|---|---|---|---|
| | | | | | | |

---

## Signatures

| Role | Name | Signature | Date |
|---|---|---|---|
| Foreman (Request) | | | |
| PM (Approval) | | | |
| Store Manager (Issue) | | | |

---

## App Fields Mapping

```
material_requests: id, project_id, requested_by, status [draft|pending|approved|issued|rejected]
material_request_lines: material_id, qty_requested, qty_approved, qty_issued, unit, spec, area, required_date
```
