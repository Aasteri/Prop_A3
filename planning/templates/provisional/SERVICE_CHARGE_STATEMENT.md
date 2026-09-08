# Service Charge Statement — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_SERVICE_CHARGE_STATEMENT`
> Available balance = FM maintenance spend ceiling (Abraham CONFIRMED).
---


## 1. Header

| Field | Value |
|-------|-------|
| Statement No. | `SCS-{PROPERTY}-{YYYY}-{MM}` |
| Property | |
| Period start / end | |
| Opening balance | ₦ |
| Levies received this period | ₦ |
| Expenditure this period | ₦ |
| Closing **available** balance | ₦ |
| Reserved / held (optional) | ₦ |
| Notes on unspent treatment | Default: remains credited to property SC account |

## 2. Ledger lines

| Date | Description | WO/Ref | Debit ₦ | Credit ₦ | Running balance ₦ | Evidence |
|------|-------------|--------|---------|----------|-------------------|----------|
| | | | | | | |

## 3. App model

```
service_charge_accounts: id, property_id, balance_available, balance_reserved
service_charge_entries: id, account_id, date, description, debit, credit, work_order_id, media_url
```
