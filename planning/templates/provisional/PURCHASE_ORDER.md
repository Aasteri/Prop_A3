# Purchase Order (Goods) — Production Default

> **Status: PRODUCTION DEFAULT** · **Form ID:** `FORM_PURCHASE_ORDER`  
> Abraham pattern: payment often **before** delivery — record payment arrangement explicitly.

---

## 1. Header

| Field | Rules |
|-------|-------|
| PO No. | `PO-{YYYY}-{SEQ}` |
| PR ref(s) | One or more |
| Supplier | fk required |
| Project / property / warehouse destination | Required destination |
| Issue date | |
| Expected delivery date | |
| Expected transit days | number |
| Currency | NGN |
| Payment terms | Prepayment · Deposit% · On delivery · Net days |
| Payment before delivery? | Boolean (default true for many vendors) |
| Status | draft · pending_approval · approved · sent · accepted · partially_received · closed · cancelled |

## 2. Supplier block

| Field | Value |
|-------|-------|
| Legal name | |
| Contact / email / phone | |
| Delivery address confirmation | |

## 3. Lines

| # | Description | Spec | Unit | Qty | Unit price ₦ | Amount ₦ | PR line ref |
|---|-------------|------|------|-----|--------------|----------|-------------|
| 1 | | | | | | | |

Subtotal · Tax (if any, configurable) · Grand total

## 4. Approval & dispatch

| Step | Actor | Timestamp |
|------|-------|-----------|
| Approved | | |
| Emailed to supplier | System / user | |
| Supplier acceptance | Accepted / Rejected / Counter | |
| Payment recorded | Finance | |

## 5. App model

```
purchase_orders: id, number, supplier_id, destination_type, destination_id, status,
  payment_terms, prepaid, expected_delivery_date, total_amount
purchase_order_lines: po_id, description, qty, unit_price, pr_line_id
```
