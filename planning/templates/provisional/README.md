# Production-Default Form Templates

> **Policy (updated Sep 8, 2026):** These are **PRODUCTION DEFAULT** templates — complete enough to ship and operate if Abraham never sends alternatives.  
> If he later provides a different document: extract → gap-reconcile → **replace** the matching file → mark EXTRACTED in the master registry.  
> Until replaced, **this folder is the source of truth** for schemas, UI, PDFs, and acceptance tests.

## Quality bar

Every template here must include:

1. Document control / numbering  
2. Complete field tables (types + rules)  
3. Workflow / status machine where relevant  
4. Signature or approval blocks  
5. App data-model sketch  
6. Abraham **CONFIRMED** rules baked in (SC spend boundary, 2.5%/10% fees, photo requests, 4×0–10 scoring, inspection mandates, fee lines from Docs 10–12, etc.)

## Index

### Property management

| File | Form ID | Notes |
|------|---------|-------|
| [TENANCY_AGREEMENT.md](./TENANCY_AGREEMENT.md) | FORM_TENANCY_AGREEMENT | Full covenants + SC matrix |
| [FM_LANDLORD_AGREEMENT.md](./FM_LANDLORD_AGREEMENT.md) | FORM_FM_LANDLORD_AGREEMENT | Doc 11 fees + SC authority |
| [OFFER_ACCEPTANCE.md](./OFFER_ACCEPTANCE.md) | FORM_OFFER_ACCEPTANCE | After Doc 10 offer |
| [TENANT_EVALUATION_SCORES.md](./TENANT_EVALUATION_SCORES.md) | FORM_TENANT_EVALUATION | Method confirmed + default bands |
| [MAINTENANCE_REQUEST.md](./MAINTENANCE_REQUEST.md) | FORM_MAINTENANCE_REQUEST | Photo required |
| [MAINTENANCE_WORK_ORDER.md](./MAINTENANCE_WORK_ORDER.md) | FORM_MAINTENANCE_WORK_ORDER | SC gate + tenant confirm |
| [MAINTENANCE_INVOICE.md](./MAINTENANCE_INVOICE.md) | FORM_MAINTENANCE_INVOICE | 2.5% on labour |
| [SERVICE_CHARGE_STATEMENT.md](./SERVICE_CHARGE_STATEMENT.md) | FORM_SERVICE_CHARGE_STATEMENT | Spend boundary ledger |
| [LANDLORD_REMITTANCE.md](./LANDLORD_REMITTANCE.md) | FORM_LANDLORD_REMITTANCE | Gross − expenses |
| [RENEWAL_NOTICE.md](./RENEWAL_NOTICE.md) | FORM_RENEWAL_NOTICE | 3mo / 1mo |
| [POSSESSION_ARREARS_NOTICE.md](./POSSESSION_ARREARS_NOTICE.md) | FORM_POSSESSION_NOTICE | Operational + counsel path |

### Sales / JV

| File | Form ID |
|------|---------|
| [PROPERTY_LISTING.md](./PROPERTY_LISTING.md) | FORM_PROPERTY_LISTING |
| [BUYER_INTEREST.md](./BUYER_INTEREST.md) | FORM_BUYER_INTEREST |
| [SALES_VIEWING_INSPECTION.md](./SALES_VIEWING_INSPECTION.md) | FORM_SALES_INSPECTION |
| [SALES_OFFER_QUOTATION.md](./SALES_OFFER_QUOTATION.md) | FORM_SALES_OFFER |
| [SALES_AGREEMENT.md](./SALES_AGREEMENT.md) | FORM_SALES_AGREEMENT |
| [SALES_PAYMENT_SCHEDULE.md](./SALES_PAYMENT_SCHEDULE.md) | FORM_SALES_PAYMENT_SCHEDULE |
| [COMMISSION_ARRANGEMENT.md](./COMMISSION_ARRANGEMENT.md) | FORM_COMMISSION |
| [JV_SUBMISSION.md](./JV_SUBMISSION.md) | FORM_JV_SUBMISSION |

### Procurement

| File | Form ID |
|------|---------|
| [PURCHASE_REQUISITION.md](./PURCHASE_REQUISITION.md) | FORM_PURCHASE_REQUISITION |
| [PURCHASE_ORDER.md](./PURCHASE_ORDER.md) | FORM_PURCHASE_ORDER |
| [GOODS_RECEIPT_NOTE.md](./GOODS_RECEIPT_NOTE.md) | FORM_GOODS_RECEIPT |
| [SUPPLIER_REGISTRATION.md](./SUPPLIER_REGISTRATION.md) | FORM_SUPPLIER_REGISTRATION |
| [SUPPLIER_EVALUATION.md](./SUPPLIER_EVALUATION.md) | FORM_SUPPLIER_PERFORMANCE |
| [ARTISAN_KYC.md](./ARTISAN_KYC.md) | FORM_ARTISAN_KYC |
| [SERVICE_REQUEST.md](./SERVICE_REQUEST.md) | FORM_SERVICE_REQUEST |
| [ARTISAN_ESTIMATE.md](./ARTISAN_ESTIMATE.md) | FORM_ARTISAN_ESTIMATE |
| [WORK_COMPLETION.md](./WORK_COMPLETION.md) | FORM_WORK_COMPLETION |
| [USER_SATISFACTION_RATING.md](./USER_SATISFACTION_RATING.md) | FORM_USER_SATISFACTION |

### Works / construction (also see parent `templates/`)

| File | Form ID |
|------|---------|
| [MATERIAL_SCHEDULE.md](./MATERIAL_SCHEDULE.md) | FORM_MATERIAL_SCHEDULE |
| [PERSONNEL_LOG.md](./PERSONNEL_LOG.md) | FORM_PERSONNEL_LOG |
| [SUBCONTRACTOR_AGREEMENT.md](./SUBCONTRACTOR_AGREEMENT.md) | FORM_WORKS_CONTRACT |
| [PROJECT_HANDOVER.md](./PROJECT_HANDOVER.md) | FORM_HANDOVER |
| [../BOQ_TEMPLATE.md](../BOQ_TEMPLATE.md) | FORM_BOQ |
| [../MATERIAL_REQUEST.md](../MATERIAL_REQUEST.md) | FORM_MATERIAL_REQUEST |
| [../PAYMENT_RECEIPT.md](../PAYMENT_RECEIPT.md) | FORM_PAYMENT_RECEIPT |

## Already EXTRACTED from Abraham (do not duplicate here)

Tenant application (Doc 12) · Offer letter schema (Doc 10) · Inventory move-in/out (Doc 9) · PM proposal (Doc 11) · Charter, kick-off, daily log, inspection, IVC, closeout, etc. (Parts B–D)

## UI rule

Optional subtle footer on generated PDFs:  
`propA3 standard form · superseded when client-specific template uploaded`  
Do **not** show a blocking “incomplete” warning — these are shippable defaults.
