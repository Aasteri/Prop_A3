# Plant & Equipment Schedule (Abraham paper form)

**Source photos:** `PLANT_EQUIPMENT_SCHEDULE_FORM.jpg`  
**Companion:** Labour Schedule paper form (`LABOUR_SCHEDULE_FORM.jpg`) — already digitised at `/labour-schedules`.

## Header

- PROJECT TITLE
- PROJECT PHASE
- SITE/PROJECT MANAGER
- SHEET NO
- DATE

## Columns

| Column | Digitised field |
|---|---|
| S/N | `sn` |
| DESCRIPTION OF EQUIPMENT | `description` |
| NAME/SOURCE OF EQUIPMENT | `nameSource` |
| START DATE | `startDate` |
| START TIME | `startTime` |
| END TIME | `endTime` |
| NO. OF HRS OR DAYS USED | `qtyUsed` + `costUnit` (HOUR \| DAY) |
| COST/DAY OR HR | `costPerUnit` |
| TOTAL AMOUNT | `totalAmount` |
| SUPERVISED BY | `supervisedBy` |
| REMARK | `remark` |

Propa3 route: `/plant-equipment-schedules` (Projects · Plan, beside labour schedules).
