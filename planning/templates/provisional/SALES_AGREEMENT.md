# Contract of Sale (Operational Default) — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_SALES_AGREEMENT`
> Full conveyancing should still involve counsel for title transfer; this is the operational commercial agreement captured in-app.
---


## 1. Parties & property

Vendor · Purchaser · Property description · Title type · Listing ref

## 2. Consideration

| Field | Value |
|-------|-------|
| Purchase price ₦ | |
| Deposit ₦ / % | |
| Balance ₦ | |
| Completion / closing date | |

## 3. Vendor warranties (default)

Vendor warrants authority to sell; property free of undisclosed encumbrances known to vendor; to deliver vacant possession on completion unless agreed otherwise.

## 4. Purchaser obligations

Pay per schedule; accept title process; pay agreed fees/taxes as allocated.

## 5. Allocations

Outgoings apportioned as of completion date · Risk passes on completion · Keys/handover checklist

## 6. Default & termination

Failure to pay → notice · cure period (configurable, default 14 days) · termination/forfeiture per schedule

## 7. Signatures

Vendor · Purchaser · Witnesses · Date · Counsel acknowledgment optional

## 8. App model

```
sale_agreements: id, listing_id, buyer_id, vendor_id, price, deposit, completion_date, status
```
