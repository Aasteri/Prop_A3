# Arrears / Possession Notice — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_POSSESSION_NOTICE`
> Production-ready operational notice. For court recovery, engage counsel to align with FCT/state procedure.
---


## 1. Types

| Type | When used |
|------|-----------|
| `rent_arrears` | Rent outstanding beyond grace period |
| `holdover` | Occupancy after expiry without renewal/payment |
| `intention_to_recover` | Pre-recovery formal notice (counsel may customise wording) |

## 2. Fields

| Field | Value |
|-------|-------|
| Notice No. | `NTC-{YYYY}-{SEQ}` |
| Type | |
| Tenant / property / unit | |
| Amount outstanding ₦ | |
| Period covered | |
| Prior reminders sent | dates |
| Remedy deadline | |
| Service method | Hand · Email · WhatsApp logged · Courier |
| Date served | |
| Server name | |

## 3. Standard arrears wording (default)

You are hereby notified that the sum of **₦{Amount}** is outstanding in respect of rent/charges for **{Property}** covering **{Period}**.

You are required to pay the full outstanding sum on or before **{Deadline}**.

Failure to comply may result in further recovery steps including termination process and recovery of possession in accordance with applicable law and your tenancy agreement.

## 4. App model

```
tenancy_notices: id, tenancy_id, type, amount, deadline, served_at, method, body_snapshot
```
