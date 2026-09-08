# Supplier / OEM Registration — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_SUPPLIER_REGISTRATION`

---


## Identity

Legal name · Trading name · CAC · TIN · Registered address · Warehouse address · Contacts (sales, accounts) · Categories (cement, steel, electrical, finishing, OEM devices, other)

## Banking

Bank · Account name · Account number

## Compliance docs

CAC cert · Tax clearance · Catalogue · Price list

## Status

pending_kyc · approved · suspended · blacklisted

## App model

```
suppliers: id, legal_name, cac, tin, status, rating_avg
supplier_categories: supplier_id, category_code
```
