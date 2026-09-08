# Artisan / Professional KYC — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_ARTISAN_KYC`
> All identity fields CONFIRMED by Abraham; none are universally mandatory if absent — capture what exists.
---


## 1. Identity

| Field | Required | Notes |
|-------|----------|-------|
| Full name | Yes | |
| Business name | No | Where applicable |
| Phone | Yes | Primary |
| Alt phone | No | |
| Email | No | |
| Residential address | Yes | |
| Business location | No | |
| Trades / skills | Yes | Multi-select: mason, carpenter, iron bender, welder, electrician, plumber, gypsum, solar, architect, SE, other |

## 2. KYC documents (attach what applies)

| Document | Number / details | File |
|----------|------------------|------|
| NIN | | |
| Voter’s Card / other ID | | |
| CAC registration | | |
| Passport photo | | |

## 3. Guarantor (CONFIRMED)

| Field | Required |
|-------|----------|
| Guarantor full name | Yes |
| Guarantor phone | Yes |
| Relationship / details | Recommended |
| Guarantor address | Recommended |

## 4. Banking & compliance

Bank name · Account name · Account number · Tax ID optional · Status: pending_review · approved · suspended · blacklisted

## 5. Performance rollup (system)

Jobs completed · Avg rating · On-time % · Rework count · Total paid

## 6. App model

```
artisan_profiles: id, full_name, business_name, phone, nin, cac, address, business_address,
  guarantor_name, guarantor_phone, status, avg_rating
artisan_trades: artisan_id, trade_code
artisan_documents: artisan_id, doc_type, file_url
```
