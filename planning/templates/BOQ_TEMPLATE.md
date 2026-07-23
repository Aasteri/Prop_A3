# Bill of Quantities — BOQ (Draft Template)

> **Status:** Standard Nigerian residential/commercial BOQ structure — refine when Abraham sends project BOQ  
> **Use:** Cost estimation, procurement, progress valuation, variation baseline

---

## Cover Sheet

| Field | Value |
|---|---|
| Project Name | |
| Client / Employer | |
| Location | |
| Prepared By | |
| Checked By (QS / PM) | |
| Date | |
| Revision | v1.0 |
| Currency | NGN (₦) |

---

## BOQ Structure (CSI-style adapted for Nigeria)

### Section A — Preliminaries
| Item | Description | Unit | Qty | Rate (₦) | Amount (₦) |
|---|---|---|---|---|---|
| A.1 | Site establishment & mobilization | sum | 1 | | |
| A.2 | Temporary works (scaffolding, hoarding) | sum | 1 | | |
| A.3 | Project management & supervision | month | | | |
| A.4 | Insurance & bonds | sum | 1 | | |
| A.5 | HSE provisions | sum | 1 | | |

### Section B — Substructure / Foundation
| Item | Description | Unit | Qty | Rate (₦) | Amount (₦) |
|---|---|---|---|---|---|
| B.1 | Excavation to reduced level | m³ | | | |
| B.2 | Blinding concrete (1:3:6) | m³ | | | |
| B.3 | Foundation concrete (1:2:4) | m³ | | | |
| B.4 | Reinforcement — foundation | kg | | | |
| B.5 | DPM / waterproofing | m² | | | |

### Section C — Superstructure / Shell
| Item | Description | Unit | Qty | Rate (₦) | Amount (₦) |
|---|---|---|---|---|---|
| C.1 | Blockwork — 6" sandcrete | m² | | | |
| C.2 | Columns & beams concrete | m³ | | | |
| C.3 | Reinforcement — superstructure | kg | | | |
| C.4 | Suspended slabs | m² | | | |
| C.5 | Roof structure | m² | | | |

### Section D — MEP Rough-In
| Item | Description | Unit | Qty | Rate (₦) | Amount (₦) |
|---|---|---|---|---|---|
| D.1 | Plumbing — supply & drainage | point | | | |
| D.2 | Electrical — conduit & wiring | point | | | |
| D.3 | Water storage & pumping | sum | 1 | | |

### Section E — Finishes
| Item | Description | Unit | Qty | Rate (₦) | Amount (₦) |
|---|---|---|---|---|---|
| E.1 | External plastering | m² | | | |
| E.2 | Internal plastering | m² | | | |
| E.3 | Floor tiling | m² | | | |
| E.4 | Painting — internal | m² | | | |
| E.5 | Painting — external | m² | | | |
| E.6 | Doors & windows (supply + fix) | nr | | | |
| E.7 | Kitchen fittings | sum | 1 | | |
| E.8 | Bathroom fittings | nr | | | |

### Section F — External Works
| Item | Description | Unit | Qty | Rate (₦) | Amount (₦) |
|---|---|---|---|---|---|
| F.1 | Perimeter wall & gate | m | | | |
| F.2 | External paving | m² | | | |
| F.3 | Drainage & soakaway | sum | 1 | | |

---

## Summary

| Section | Amount (₦) |
|---|---|
| A Preliminaries | |
| B Foundation | |
| C Shell | |
| D MEP | |
| E Finishes | |
| F External | |
| **Subtotal** | |
| Contingency (5–10%) | |
| **Grand Total** | |

---

## Milestone Valuation Link

| Milestone | BOQ Sections Included | Target % of Contract |
|---|---|---|
| Foundation | A (partial) + B | ~25% |
| Shell | C + D (rough) | ~45% |
| Finishing | D (fit-off) + E + F | ~30% |

*Aligns with Triple A Agile milestones: Foundation → Shell → Finishing*

---

## App Schema Hint

```
boqs: id, project_id, version, total_amount, status
boq_sections: boq_id, code, title, sort_order
boq_items: section_id, item_code, description, unit, qty, rate, amount
```
