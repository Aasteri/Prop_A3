# Property Listing (Sale / JV) — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_PROPERTY_LISTING`
> Capture list aligned with Master BRD Part H (CONFIRMED).
---


## 1. Listing identity

| Field | Rules |
|-------|-------|
| Listing No. | `LST-{YYYY}-{SEQ}` |
| Listing source | `propa3` · `external_agent` |
| Listed by (agent user) | Required |
| External agent org | Required if external |
| Purpose | Sale · JV · Both |
| Status | draft · published · under_offer · sold · withdrawn · jv_active |

## 2. Classification

| Field | Values |
|-------|--------|
| Category | Residential · Commercial |
| Land/building | Vacant land · Building · Occupied land/property |
| Density | low · medium · high |
| Title type | C of O · R of O · None · Other (text) |

## 3. Location & physical

| Field | Rules |
|-------|-------|
| Location name / estate | |
| Neighbourhood / character | |
| Access road / road condition | |
| Year built | Optional |
| GPS coordinates | lat/lng |
| Electricity / water / central sewage | Available · Not · Partial |
| Door type / window type | |
| Description | Rich text |
| Asking price ₦ | |
| Price negotiable | Y/N |

## 4. Media & documents

Photos (min 3 recommended) · Title docs · Survey · Other attachments

## 5. App model

```
listings: id, number, source, purpose, category, title_type, density, price, status, agent_id, property_id
listing_media: listing_id, url, kind
```
