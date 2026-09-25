# Expenses and inflow Project record (Abraham)

**Source:** [Google Sheet](https://docs.google.com/spreadsheets/d/16yKk_50QLno2x3W188jWkiTequDULYCMAI4rOoTuJWY/edit?usp=sharing)  
**Title:** Expenses and inflow Project record  
**Example project code:** `AAA/GZP/DPLX/PLOT/530/2026/I` (Guzape plot 530)

## Purpose

Daily site cashbook: money **received** onto the job (inflow) and **spend** lines (labour, plant hire, materials, food, logistics), with optional **balance in account** snapshots and day/section **totals**.

## Columns (header row)

| Column | Meaning |
|---|---|
| ITEM No./DATE | Entry date or blank (continuation under same day) |
| RECEIVED | Cash / transfer brought to site or account |
| BALANCE IN ACC | Optional recorded balance after movements |
| JOB/ITEM DESCRIPTION | What was bought / labour / plant / note |
| QTY | Quantity |
| UNIT | e.g. labour, truck, day, roll, bags |
| RATE | Unit rate (₦) |
| AMOUNT | Line spend (qty × rate when applicable) |
| TOTAL | Day / section total when used as a summary row |

## Operational pattern (from Abraham’s sheet)

1. Date row often pairs with a **RECEIVED** amount (site float top-up).
2. Following rows are expenses (description + qty/unit/rate/amount, or amount-only).
3. Occasional balance / net figures appear as summary rows.

Digitised in Propa3 as **Project cashbook** (`/project-cashbooks`) under Projects · Execute / Monitor, linked to a project + optional project code string.
