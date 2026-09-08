# Landlord Remittance Advice — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_LANDLORD_REMITTANCE`

---


## 1. Header

| Field | Value |
|-------|-------|
| Remittance No. | `REM-{YYYYMM}-{SEQ}` |
| Period | |
| Property | |
| Landlord | |
| Prepared by / Approved by | |

## 2. Computation

| Item | ₦ |
|------|---|
| Gross rent collected | |
| Other receipts | |
| **Gross total** | |
| Less: approved expenses (itemised below) | |
| **Net remittance** | |

## 3. Expense schedule

| Date | Description | Amount ₦ | Approval |

## 4. Payment

| Field | Value |
|-------|-------|
| Remittance date | |
| Bank / account | |
| Transfer ref | |
| Landlord acknowledgment | |

## 5. App model

```
landlord_remittances: id, property_id, landlord_id, period_start, period_end, gross, expenses, net, paid_at
```
