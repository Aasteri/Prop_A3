# Artisan Estimate / Quotation — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_ARTISAN_ESTIMATE`

---


## Fields

| Field | Rules |
|-------|-------|
| Estimate No. | `EST-{YYYYMM}-{SEQ}` |
| Service request ref | Required |
| Labour / service fee ₦ | Required — **chargeable base for 2.5%** |
| Materials ₦ | Excluded from 2.5% |
| Duration (days/hours) | |
| Validity date | |
| Notes / exclusions | |
| Platform fee preview | 2.5% × labour |
| Approval | Pending · Approved · Rejected |

## App model

```
artisan_estimates: id, service_request_id, labour, materials, days, valid_until, status
```
