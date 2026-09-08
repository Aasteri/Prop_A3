# Service Request (Artisan / Professional) — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_SERVICE_REQUEST`
> Photo + description CONFIRMED.
---


## 1. Header

| Field | Rules |
|-------|-------|
| Request No. | `SRQ-{YYYYMM}-{SEQ}` |
| Source | Maintenance · Project · Property · Standalone |
| Linked maintenance request / project | Optional |
| Requester | |
| Property / project / site | |

## 2. Problem pack (required)

| Field | Rules |
|-------|-------|
| Description | Required |
| Item / component | Required |
| Work required | Required |
| Photo(s) | **≥ 1 required** |
| Suggested tools | Optional |
| Suggested materials | Optional |
| Required artisan trade | Required from registry |

## 3. Workflow

Select artisan → Notify → Assess → Estimate → Funding/approval → Assign → Complete → User confirm + rating → Invoice → Pay (2.5% on service fee excl. materials) → Performance record

## 4. App model

```
service_requests: id, number, trade_code, description, component, status, artisan_id, labour_amount, materials_amount
service_request_media: request_id, url
```
