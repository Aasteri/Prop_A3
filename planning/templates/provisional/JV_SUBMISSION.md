# Joint Venture Property Submission — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_JV_SUBMISSION`  
> Standard intake for JV / partnership proposals. Commercial term sheet follows after review.

---

## 1. Header

| Field | Value |
|-------|-------|
| JV No. | `JV-{YYYY}-{SEQ}` |
| Submitted by | |
| Submission date | |
| Status | submitted · under_review · term_sheet · agreed · rejected |

---

## 2. Owner / counterparty

| Field | Rules |
|-------|-------|
| Owner / sponsor name | Required |
| Contact phone / email | Required |
| Address | |
| ID / company registration | |

---

## 3. Property

| Field | Rules |
|-------|-------|
| Property address | Required |
| Title type | C of O · R of O · Governor’s Consent · Other |
| Title / survey docs attached | Yes / No + refs |
| Land size | |
| Building description | Existing · Proposed · Mixed |
| Photos / plans attached | |

---

## 4. Contribution & economics (intake)

| Field | Rules |
|-------|-------|
| Owner contribution | Land · Cash · Building · Other (describe) |
| Estimated contribution value ₦ | |
| propA3 / partner contribution sought | Cash · Development · Management · Other |
| Proposed share % (owner) | |
| Proposed share % (partner) | |
| Desired return / profit share | % or fixed — state clearly |
| Timeline expectation | |
| Preferred model | Equity · Develop-and-share · Manage-and-share · Other |

---

## 5. Supporting documents checklist

| Document | Attached |
|----------|----------|
| Title | |
| Survey plan | |
| Photos | |
| Existing approvals / drawings | |
| Financial projections (if any) | |

---

## 6. Review notes (internal)

Commercial term sheet produced as next artefact after review. Do not invent equity splits in product until confirmed on a deal memo.

---

## 7. App model

```
jv_submissions: id, number, owner_name, contact, property_address, title_type,
  owner_contribution, share_pct_owner, share_pct_partner, desired_return,
  model, docs_json, status, notes_internal
```
