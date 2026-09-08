# Material Schedule — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_MATERIAL_SCHEDULE`
> Links BOQ ↔ WBS ↔ Procurement.
---


## Header

Project · Phase · Prepared by (QS/PM) · Date · Revision

## Lines

| S/N | Material | Spec/Grade | Unit | Qty | BOQ ref | WBS task | Required-by date | Source | PR/PO ref | Status |
|-----|----------|------------|------|-----|---------|----------|------------------|--------|-----------|--------|
| | | | | | | | | Warehouse · External | | planned·ordered·received·issued |

## App model

```
material_schedule_lines: id, project_id, material_name, spec, unit, qty, boq_line_id, wbs_task_id, required_by, status
```
