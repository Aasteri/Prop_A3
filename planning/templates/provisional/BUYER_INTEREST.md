# Buyer Interest (Show Interest → CRM) — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_BUYER_INTEREST`
> CONFIRMED: interest creates CRM lead; branch on propA3 vs external listing.
---


## Fields

| Field | Rules |
|-------|-------|
| Interest No. | `INT-{YYYYMM}-{SEQ}` |
| Listing | Required |
| Buyer name | Required |
| Phone | Required |
| Email | Optional |
| Message | Optional |
| Source channel | Web · Portal · Referral |
| Listing ownership snapshot | propA3 · external (immutable copy) |
| Assigned agent | System: propA3 agent or notify external |
| CRM lead id | Created on submit |
| Status | new · inspection_requested · inspecting · responded · negotiating · won · lost |

## Automation

On create → CRM lead → if propA3 assign agent else notify external agent → require physical inspection → require platform response.
