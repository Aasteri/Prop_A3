# Goods Receipt Note (GRN) — Production Default

> **Status: PRODUCTION DEFAULT** · **Form ID:** `FORM_GOODS_RECEIPT`  
> Three-way awareness: PO · Supplier invoice · Physical goods.

---

## 1. Header

| Field | Rules |
|-------|-------|
| GRN No. | `GRN-{YYYYMM}-{SEQ}` |
| PO No. | Required |
| Supplier invoice No. | Required for verification |
| Received date | |
| Destination | Warehouse / site / property |
| Received by | Store Manager / Site |
| Verified by | Second checker optional |

## 2. Lines

| # | Description | PO qty | Invoiced qty | Received qty | Accepted qty | Rejected qty | Discrepancy reason |
|---|-------------|--------|--------------|--------------|--------------|--------------|--------------------|
| 1 | | | | | | | |

## 3. Verification checklist

| Check | Y/N |
|-------|-----|
| Invoice matches PO prices | |
| Quantities match delivery | |
| Spec / grade acceptable | |
| Packaging undamaged | |
| Photos of delivery attached | |

## 4. Outcomes

| Outcome | Action |
|---------|--------|
| Full accept | Update stock; close PO line |
| Partial | Backorder remaining |
| Reject | Return / debit note workflow |

## 5. App model

```
goods_receipts: id, number, po_id, invoice_no, received_at, received_by, status
goods_receipt_lines: grn_id, po_line_id, qty_received, qty_accepted, qty_rejected, notes
```
