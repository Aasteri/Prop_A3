# Tenant Evaluation Scores — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_TENANT_EVALUATION`  
> Method CONFIRMED by Abraham: score each parameter 1–10; system combines into a star rating.

---

## 1. Header

| Field | Value |
|-------|-------|
| Evaluation No. | `TEV-{YYYYMM}-{SEQ}` |
| Application ref | Required |
| Property / unit | |
| Evaluator (FM / Sales / PM) | Required — tenant does **not** self-score |
| Evaluation date | |

## 2. Scores (CONFIRMED)

| # | Criterion | Guidance | Score (1–10) |
|---|-----------|----------|--------------|
| 1 | Compatibility of tenant/use with property | Family size vs unit size, intended use, pressure on facilities | |
| 2 | Ability to pay | Employment/business; market income knowledge allowed | |
| 3 | Reason for vacating previous property | From application + investigation | |
| 4 | Guarantor | Character, reliability, ability to stand for obligations | |

**Scale:** 1 = lowest · 10 = highest.

**System average** = (C1+C2+C3+C4) / 4 — display to 1 decimal.

**Star rating** = average ÷ 2 (stored to 1 decimal, 0.5–5.0). Decision label = `STAR_1` … `STAR_5` from rounded stars.

## 3. Decision

Stars are informational. Accept / reject / further review is a **human** decision after seeing the rating. No automatic pass bands or mandatory override gates.

| Field | Value |
|-------|-------|
| Average | |
| Star rating | e.g. 3.5★ / STAR_4 |
| Decision | Accepted · Rejected · Further review |
| Internal notes | Never shown to applicant |
| Next step | Issue offer · Notify reject · Request docs |

## 4. App model

```
tenant_evaluations: id, application_id, evaluator_id, c1, c2, c3, c4,
  average, star_rating, decision [STAR_1..STAR_5], notes_internal
```
