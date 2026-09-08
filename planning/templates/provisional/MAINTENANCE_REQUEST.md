# Maintenance Request — Production Default

> **Status: PRODUCTION DEFAULT** · **Form ID:** `FORM_MAINTENANCE_REQUEST`  
> Photo + description required (Abraham CONFIRMED). Triage → SC check → artisan path.

---

## 1. Header

| Field | Type | Rules |
|-------|------|-------|
| Request No. | auto | `MRQ-{PROPERTY}-{YYYYMM}-{SEQ}` |
| Created at | datetime | System |
| Channel | enum | Tenant portal · Phone logged by FM · Walk-in |
| Property | fk | Required |
| Unit | fk | Required if multi-unit |
| Tenant | fk | Required |
| Reported by name/phone | text | If different from tenant |
| Component / location | text | e.g. Kitchen sink, Bedroom 1 AC |
| Category | enum | Plumbing · Electrical · HVAC · Civil · Carpentry · Security · Other |
| Urgency | enum | Low · Medium · High · Emergency |

## 2. Problem statement

| Field | Rules |
|-------|-------|
| Description | Required, min 20 chars |
| When noticed | datetime optional |
| Photos / video | **At least 1 photo required** |
| Access instructions | Optional |

## 3. FM triage

| Field | Rules |
|-------|-------|
| Triaged by | User |
| Triaged at | datetime |
| Outcome | `remote_resolved` · `work_order` · `rejected_duplicate` · `tenant_responsibility` |
| Remote guidance given | textarea |
| Responsibility | FM (SC) · Landlord · Tenant · Shared |
| Linked work order | fk nullable |

## 4. Status machine

`submitted` → `triaging` → `remote_resolved` | `awaiting_approval` | `assigned` → `in_progress` → `pending_tenant_confirm` → `closed`  
Also: `cancelled`, `escalated_landlord`

## 5. SLA defaults (configurable)

| Urgency | First response | Resolution target |
|---------|----------------|-------------------|
| Emergency | 2 hours | 24 hours |
| High | 8 hours | 72 hours |
| Medium | 24 hours | 7 days |
| Low | 48 hours | 14 days |

## 6. App model

```
maintenance_requests: id, property_id, unit_id, tenant_id, number, category, urgency,
  description, status, responsibility, created_at, triaged_by, work_order_id
maintenance_request_media: request_id, url, kind[photo|video]
```
