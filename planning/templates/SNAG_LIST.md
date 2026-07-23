# Snag List — Pre-Handover (Draft)

> **Status:** Standard residential handover format  
> **Trigger:** Finishing milestone ~95%; client walkthrough scheduled

---

## Snag Register

| Field | Value |
|---|---|
| Project | |
| Plot/Unit | |
| Client | |
| Walkthrough Date | |
| PM | |
| Target Handover Date | |

---

## Items

| # | Location / Room | Description of Defect | Severity | Assigned To | Target Fix | Status | Fixed Date | Client Sign-off |
|---|---|---|---|---|---|---|---|---|
| 1 | Master bathroom | Grout discoloration — floor tiles | Minor | Tiler | | Open | | |
| 2 | Kitchen | Cabinet door alignment | Minor | Carpenter | | Open | | |
| 3 | External | Paint touch-up — south wall | Cosmetic | Painter | | Open | | |
| 4 | | | Critical / Major / Minor / Cosmetic | | | Open/In Progress/Fixed/Accepted | | |

**Severity definitions:**
- **Critical:** Safety or habitability — blocks handover
- **Major:** Functional defect — blocks handover until fixed
- **Minor:** Cosmetic or inconvenience — may handover with commitment to fix
- **Cosmetic:** Punch list item — fix within 14 days post-handover

---

## Summary

| Severity | Open | Fixed | Accepted |
|---|---|---|---|
| Critical | | | |
| Major | | | |
| Minor | | | |
| Cosmetic | | | |

**Handover clearance:** ☐ All Critical & Major resolved ☐ Client accepts with outstanding Minor/Cosmetic list

---

## Signatures

| Party | Name | Date |
|---|---|---|
| Client | | |
| PM | | |
| QA (Pelumi / Odekina) | | |

---

## App Schema

```
snag_lists: id, plot_id, walkthrough_date, handover_date, status
snag_items: list_id, location, description, severity, assigned_to, status, photos[]
```
