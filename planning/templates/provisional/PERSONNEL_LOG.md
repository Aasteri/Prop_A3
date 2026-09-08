# Personnel / Attendance Log — Production Default

> **Status: PRODUCTION DEFAULT** — Complete operational template. Superseded only if Abraham supplies a replacement.
> **Form ID:** `FORM_PERSONNEL_LOG`

---


## Header

Project · Date · Shift · Supervisor · Weather (optional)

## Entries

| # | Full name | Role/Trade | Company (internal/sub) | Planned | Time in | Time out | Hours | Performance 1–5 | Notes |
|---|-----------|------------|------------------------|---------|---------|----------|-------|-----------------|-------|

## Daily totals

Headcount · Total hours · Trades present

## App model

```
personnel_logs: id, project_id, date, supervisor_id
personnel_log_entries: log_id, person_name, trade, time_in, time_out, performance, notes
```
