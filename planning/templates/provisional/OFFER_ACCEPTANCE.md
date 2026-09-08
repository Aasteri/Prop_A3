# Offer Acceptance — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_OFFER_ACCEPTANCE`
> Follows Offer Letter (Doc 10 EXTRACTED).
---


## 1. Reference

| Field | Value |
|-------|-------|
| Acceptance No. | `OAC-{YYYY}-{SEQ}` |
| Offer letter ref | Required |
| Property / unit | |
| Applicant / tenant | |
| Offer date | |
| Acceptance deadline | |
| Accepted at | datetime |

## 2. Accepted commercial terms (copied from offer, editable only with audit)

| Line | Amount ₦ | Payee account |
|------|----------|---------------|
| Rent (per annum) | | Landlord |
| Caution (one-off) | | Landlord |
| Management fee | | Management |
| Legal fee | | Management |
| Service charge | | Management |
| Estate surcharge (if any) | | As offer |
| Agency fee | | Agency |

## 3. Declarations

1. I have read and accept the Offer Letter terms and conditions.  
2. I understand this acceptance is not yet the Tenancy Agreement until executed.  
3. I agree to pay the sums listed to the stated accounts by the due dates.

## 4. Signatures

| Party | Name | Signature | Date |
|-------|------|-----------|------|
| Tenant | | | |
| Agent acknowledgment | | | |

## 5. App model

```
offer_acceptances: id, offer_letter_id, tenant_id, accepted_at, status[pending|accepted|expired|withdrawn]
```
