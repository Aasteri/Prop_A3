# Remittance Statement — Production Default

> **Status: PRODUCTION DEFAULT**  
> **Form ID:** `FORM_REMITTANCE_STATEMENT`  
> Companion to landlord remittance advice. Formula: **gross − deductions = net**.

---

## 1. Header

| Field | Value |
|-------|-------|
| Statement No. | `REM-{YYYYMM}-{SEQ}` |
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
| Less: approved deductions (itemised below) | |
| **Net remittance** | |

## 3. Deduction schedule

| Date | Description | Category | Amount ₦ | Ref |
|------|-------------|----------|----------|-----|
| | | Management fee / SC spend / maintenance / other | | |

## 4. Payment

| Field | Value |
|-------|-------|
| Remittance date | |
| Bank / account | |
| Transfer ref | |
| Inflow / money attribution refs | |
| Landlord acknowledgment | |

## 5. Notes

All money is received into the system first (bank transfer or Paystack). Attribution records who earned/should receive each portion; this statement is the landlord net payout view.

## 6. App model

```
landlord_remittances: id, property_id, landlord_id, period_start, period_end,
  gross, expenses, net, paid_at, transfer_ref
```
