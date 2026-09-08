# Tenant Evaluation Scores — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_TENANT_EVALUATION`
> Method CONFIRMED by Abraham. Default bands included so the product works without further input; Owner may override per property.
---


## 1. Header

| Field | Value |
|-------|-------|
| Evaluation No. | `TEV-{YYYYMM}-{SEQ}` |
| Application ref | Required |
| Property / unit | |
| Evaluator (FM) | Required — tenant does **not** self-score |
| Evaluation date | |

## 2. Scores (CONFIRMED)

| # | Criterion | Guidance | Score (0–10) |
|---|-----------|----------|--------------|
| 1 | Compatibility of tenant/use with property | Family size vs unit size, intended use, pressure on facilities | |
| 2 | Ability to pay | Employment/business; market income knowledge allowed | |
| 3 | Reason for vacating previous property | From application + investigation | |
| 4 | Guarantor | Character, reliability, ability to stand for obligations | |

**System average** = (C1+C2+C3+C4) / 4 — display to 1 decimal.

## 3. Default decision bands (PRODUCTION DEFAULT — configurable)

| Average | Decision label | Default system action |
|---------|----------------|----------------------|
| ≥ 7.5 | Preferred | Recommend Accept |
| 6.0 – 7.4 | Acceptable | Accept allowed; FM may request further review |
| 4.0 – 5.9 | Borderline | Further review required |
| < 4.0 | Unsuitable | Recommend Reject |

FM may override with mandatory reason code.

## 4. Internal notes (never shown to applicant)

Investigation notes · Landlord preferences applied · References checked

## 5. Decision

| Field | Value |
|-------|-------|
| Decision | Accepted · Rejected · Further review |
| Override used? | Y/N + reason |
| Next step | Issue offer · Notify reject · Request docs |

## 6. App model

```
tenant_evaluations: id, application_id, evaluator_id, c1, c2, c3, c4, average, decision, notes_internal
```
