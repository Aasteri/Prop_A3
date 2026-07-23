# Change Order / Variation Register (Draft)

> **Status:** Aligned with Triple A Agile principle — "Welcome change for client competitive advantage"  
> **Rule:** Open-book — no hidden costs; all variations documented before execution

---

## Variation Record

| Field | Value |
|---|---|
| Variation No. | `VO-{PROJECT}-{SEQ}` |
| Date Raised | |
| Project | |
| Raised By | Client / PM / Engineer / Architect |
| Status | Draft → Under Review → Approved → Rejected → Implemented |

---

## Description

| Field | Detail |
|---|---|
| Title | e.g. "Add extra bathroom on first floor" |
| Reason | Client request / Site condition / Design improvement / Regulatory |
| Affected Area | |
| Linked Drawing Rev. | |

**Detailed scope change:**

---

## Impact Assessment (PM completes)

| Impact | Before | After | Delta |
|---|---|---|---|
| Scope | | | |
| Cost (₦) | | | + / − |
| Timeline (days) | | | + / − |
| BOQ items affected | | | |

---

## Approvals

| Party | Name | Decision | Date | Signature |
|---|---|---|---|---|
| Client | | Approve / Reject | | |
| PM | | Approve / Reject | | |
| Architect (if design change) | | Approve / Reject | | |
| Engineer (if structural) | | Approve / Reject | | |
| CEO (if > ₦X threshold) | | Approve / Reject | | |

**Threshold for CEO approval:** TBC with Abraham (suggest: > 5% of contract value or > ₦5M)

---

## Implementation

| Field | Value |
|---|---|
| Implementation start | |
| Implementation complete | |
| Linked daily log refs | |
| Invoice adjustment ref | |

---

## App Schema Hint

```
variations: id, project_id, number, title, reason, status, cost_delta, days_delta
variation_approvals: variation_id, approver_role, decision, signed_at
```
