# Maintenance Invoice — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_MAINTENANCE_INVOICE`

---


## 1. Header

| Field | Value |
|-------|-------|
| Invoice No. | `MINV-{YYYY}-{SEQ}` |
| Date | |
| Work order ref | Required |
| Bill to | SC ledger · Landlord · Tenant (if liable) |
| Property / unit | |

## 2. Lines

| Description | Labour ₦ | Materials ₦ | Line total ₦ |
|-------------|----------|-------------|--------------|
| | | | |

| Summary | ₦ |
|---------|---|
| Labour subtotal | |
| Materials subtotal | |
| Platform fee 2.5% on labour (if Services) | |
| Tax (if configured) | |
| **Grand total** | |

## 3. Payment

| Field | Value |
|-------|-------|
| Payable to | Artisan / firm bank details |
| Payment blocked until | Tenant confirmation = Yes |
| Paid at | |
| Payment ref | |

## 4. App model

```
maintenance_invoices: id, work_order_id, bill_to_type, labour, materials, platform_fee, total, status
```
