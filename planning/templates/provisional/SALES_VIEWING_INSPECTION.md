# Sales Viewing / Physical Inspection — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_SALES_INSPECTION`
> Physical inspection MANDATORY; platform response REQUIRED (Abraham CONFIRMED).
---


## 1. Request

| Field | Value |
|-------|-------|
| Inspection No. | `VIN-{YYYYMM}-{SEQ}` |
| Interest / CRM lead | Required |
| Property / listing | |
| Proposed slots | datetime multi |
| Confirmed slot | |
| Inspector / agent | |

## 2. Attendance & outcome (platform response)

| Field | Rules |
|-------|-------|
| Inspection occurred | Y/N — if N, reason required |
| Actual datetime | |
| Buyer attended | Y/N |
| Other attendees | |
| Observations | Required if occurred |
| Buyer feedback | |
| Interest level | Hot · Warm · Cold · Not interested |
| Next action | Follow-up · Offer · Disqualify · Re-schedule |
| Photos | Optional |
| Response submitted at | Required to close inspection step |
| Submitted by | Agent |

## 3. Status

`requested` → `scheduled` → `completed_response_logged` → `follow_up`
