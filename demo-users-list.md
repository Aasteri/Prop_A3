# Demo users (Prop A3 MVP)

**Live login:** https://propa3.com/login  
**Domain:** all accounts use **`@propa3.com`** (aligned with Namecheap mailboxes).

Create each mailbox on shared hosting with the **same password** as below.  
**App SMTP (system mail only):** `info@propa3.com` — password lives in server `.env` only (`SMTP_*`), not in this file.

| Email | Password | Role | What they can test |
|---|---|---|---|
| `ceo@propa3.com` | `RwrsW9r8xz&noJv3tept` | CEO | Full access — all sites, dashboards, log approvals, change orders, invoices, CRM, listings, milestones, Estate Terrier |
| `pm.jkw@propa3.com` | `Bar4QMujSv$gu8fdb32J` | Project Manager | Jikwoyi site — approve daily logs, milestones, material requests, change log, tenant application approval |
| `foreman.jkw@propa3.com` | `D$RVW&@k^z*#zuhFN#3j` | Foreman | Jikwoyi — submit daily site logs (incl. offline PWA), photos, material requests |
| `foreman.gz2@propa3.com` | `pjBgSiH&$LVyd*@^gwNF` | Foreman | Guzape II — submit daily site logs, photos, material requests |
| `store.jkw@propa3.com` | `7LhYmpTBgq3X*p3a#$5D` | Store Manager | Jikwoyi — fulfil/issue materials from approved requests |
| `engineer@propa3.com` | `Fq4CBjsU5Dgrhmb436ix` | Engineer | Certify milestone progress, FCDA gate on Foundation |
| `finance@propa3.com` | `QNp5miQQr@oaQwWD$UPB` | Finance | Invoices, payment proof review, Estate Terrier |
| `sales@propa3.com` | `!dAscG#7$NhGnhdC7rH#` | Sales | CRM pipeline, listings admin, tenant applications |
| `client@propa3.com` | `MMBRg6fJHC^SStcPv$MP` | Client | Client portal at `/portal` — Guzape II duplex, payments, changes |

## Mailboxes to create on Namecheap (9 + info)

| Mailbox | Used for |
|---|---|
| `info@propa3.com` | **SMTP only** — Propa3 notifications / password reset (already created) |
| `ceo@propa3.com` … `client@propa3.com` | Staff/client login + email (same passwords as table) |

## Not seeded (roles exist, no demo account yet)

| Role | Notes |
|---|---|
| `ARCHITECT` | Add when design-review workflows are built |
| `ADMIN` | CEO covers most admin-style access for MVP UAT |

## Apply password/email changes on production DB

After deploy, on the server:

```bash
cd /var/www/propa3 && npm run db:seed
```

This migrates legacy `@triplea.ng` rows to `@propa3.com` and updates password hashes.

## Security

- Treat this file as **confidential** (passwords for UAT / initial mail setup).
- Rotate any password that was pasted in chat or committed to a public repo.
- Do not store `info@` SMTP password in git — use `/var/www/propa3/.env` on EC2.
