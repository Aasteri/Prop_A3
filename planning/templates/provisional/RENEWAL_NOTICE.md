# Tenancy Renewal Reminder — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_RENEWAL_NOTICE`
> Timing CONFIRMED: at least 3 months and 1 month before expiry.
---


## Template body

**Subject:** Reminder — Tenancy expiry ({3 months|1 month}) — {Property/Unit}

Dear {Tenant Name},

This is a formal reminder that your tenancy for **{Property/Unit}** is due to expire on **{Expiry Date}**.

Current rent: **₦{Rent}** per annum · Service charge: **₦{SC}**

Please contact the Facility Manager on or before **{Reply-by Date}** to:
1. Confirm renewal and payment arrangements, or  
2. Give notice that you will vacate and schedule move-out inspection.

Failure to renew or vacate may result in holdover procedures and recovery action.

Yours faithfully,  
{Agent Name} · {Firm} · {Date}

## Fields

notice_type[three_month|one_month], tenancy_id, sent_at, channel[email|sms|print], reply_by
