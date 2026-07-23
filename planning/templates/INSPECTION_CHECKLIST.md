# Site Inspection & Quality Checklist (Draft)

> **Status:** Derived from Daily Site Log §6–7 + Team Charter + NNQP alignment  
> **Used by:** Engineer, PM, Foreman at milestone gates

---

## Inspection Header

| Field | Value |
|---|---|
| Inspection No. | `INS-{PROJECT}-{SEQ}` |
| Date | |
| Project | |
| Inspector (Name + Role) | |
| Milestone Gate | Foundation / Shell / Finishing / Handover |
| Weather | |

---

## A. Structural (Engineer — COREN)

| # | Check | Pass | Fail | N/A | Notes |
|---|---|---|---|---|---|
| 1 | Foundation dimensions per drawing | ☐ | ☐ | ☐ | |
| 2 | Rebar diameter, spacing, cover | ☐ | ☐ | ☐ | |
| 3 | Concrete mix design adhered (1:2:4 etc.) | ☐ | ☐ | ☐ | |
| 4 | Slump test conducted & recorded | ☐ | ☐ | ☐ | |
| 5 | Cube samples cast (7/14/28 day) | ☐ | ☐ | ☐ | |
| 6 | Column verticality & alignment | ☐ | ☐ | ☐ | |
| 7 | Blockwork mortar mix & bonding | ☐ | ☐ | ☐ | |
| 8 | Roof structure / slab deflection check | ☐ | ☐ | ☐ | |

**Engineer certification:** ☐ Approved for next phase ☐ Remedial work required

---

## B. Architectural (Creative Director / Architect)

| # | Check | Pass | Fail | N/A | Notes |
|---|---|---|---|---|---|
| 1 | Layout matches approved drawings | ☐ | ☐ | ☐ | |
| 2 | Door/window openings per schedule | ☐ | ☐ | ☐ | |
| 3 | Finishes spec compliance | ☐ | ☐ | ☐ | |
| 4 | FCDA/AEPB approval conditions met | ☐ | ☐ | ☐ | |

---

## C. MEP

| # | Check | Pass | Fail | N/A | Notes |
|---|---|---|---|---|---|
| 1 | Plumbing pressure test | ☐ | ☐ | ☐ | |
| 2 | Electrical conduit routing per NEC | ☐ | ☐ | ☐ | |
| 3 | Earthing / bonding | ☐ | ☐ | ☐ | |

---

## D. HSE (All inspections)

| # | Check | Pass | Fail | N/A | Notes |
|---|---|---|---|---|---|
| 1 | PPE compliance observed | ☐ | ☐ | ☐ | |
| 2 | Scaffolding tagged & safe | ☐ | ☐ | ☐ | |
| 3 | Toolbox talk conducted today | ☐ | ☐ | ☐ | |
| 4 | Incidents / near misses since last inspection | ☐ | ☐ | ☐ | |

---

## E. Photos Required

- [ ] Overview of inspected area
- [ ] Any defect close-up
- [ ] Cube test / slump test evidence (if applicable)

---

## Outcome

| Result | Action |
|---|---|
| **Pass** | Milestone gate approved; interim certificate issued |
| **Conditional Pass** | Minor items — remedial list attached; re-inspect in X days |
| **Fail** | Work stopped in affected area; remedial plan required |

**Signatures:** Inspector ___ PM ___ Date ___

---

## App Link

Tied to `milestones` table — inspection Pass required before `milestone.status = complete`
