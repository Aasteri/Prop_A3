# Project Change Log (AUTHORITATIVE — from Excel)

> **Source:** `PROJECT CHANGE LOG.xlsx`  
> **Project:** Construction of Mix-Use Devt, Jikwoyi, Abuja  
> **Supersedes:** Generic `CHANGE_ORDER.md` draft — use this for exact replication

---

## Sheet Title (display header)

**PROJECT CHANGE LOG FOR THE CONSTRUCTION OF MIX-USE DEVT, JIKWOYI, ABUJA**

---

## Columns (exact — do not rename in UI export)

| # | Column Header | Field Key | Type | Validation |
|---|---|---|---|---|
| 1 | CHANGE ID | `change_id` | string | Auto `CHG-JKW-{SEQ}` |
| 2 | DATE OF REVISION | `revision_date` | date | Required |
| 3 | ORIGINATOR/REQUESTER | `originator` | text/user | Required |
| 4 | CHANGE DESCRIPTION | `description` | textarea | Required |
| 5 | JUSTIFICATION | `justification` | textarea | Required |
| 6 | REVISED BY | `revised_by` | user | PM or QS |
| 7 | STATUS (approved, in review,rejected) | `status` | enum | `in_review` \| `approved` \| `rejected` |
| 8 | APPROVED BY | `approved_by` | user | Required on approve |
| 9 | IMPACT (Scope/Time/Cost) | `impact_level` | enum | `high` \| `med` \| `low` |

---

## Status Values (exact spelling from Excel)

- `approved`
- `in review` *(store as `in_review`)*
- `rejected`

---

## Impact Levels

Helper text in row 4: `e.g High/med/low`

---

## Workflow

1. Originator creates row → status `in review`
2. PM sets impact level + revises description if needed
3. If impact = **High** → CEO must approve
4. On **approved**:
   - Link to invoice variation (V-XX)
   - Update BOQ if applicable
   - Notify client (portal)
5. On **rejected** → log reason; notify originator

---

## Excel Export

Download must reproduce:
- Title row (merged)
- Header row (exact column names)
- Data rows
- Empty rows for future entries (min 15 blank rows like original)

---

## App Schema

```sql
project_change_logs (
  id, project_id, change_id, revision_date, originator,
  description, justification, revised_by, status,
  approved_by, impact_level, created_at, updated_at
)
```

**Note:** Same structure applies to all projects — Jikwoyi is first instance; clone per `project_id`.
