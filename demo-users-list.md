# Demo users (Prop A3 MVP)

**Live login:** https://propa3.com/login  
**Domain:** all accounts use **`@propa3.com`** (aligned with Namecheap mailboxes).

**Full reference (roles, marketplace demo jobs, company settings):** **[docs/TEST_USERS.md](./docs/TEST_USERS.md)**  
**Seed source:** [`prisma/demo-users.ts`](./prisma/demo-users.ts) + [`prisma/marketplace-demo.ts`](./prisma/marketplace-demo.ts)

Create each mailbox on shared hosting with the **same password** as below.  
**App SMTP (system mail only):** `info@propa3.com` — password lives in server `.env` only (`SMTP_*`), not in this file.

| Email | Password | Role | What they can test |
|---|---|---|---|
| `ceo@propa3.com` | `RwrsW9r8xz&noJv3tept` | CEO | Full access — all sites, dashboards, company settings, marketplace admin |
| `admin@propa3.com` | `Admin@Propa3!` | Admin | Company settings, system admin, audit, assign/approve artisans |
| `pm.jkw@propa3.com` | `Bar4QMujSv$gu8fdb32J` | Project Manager | Jikwoyi site — approve daily logs, milestones, materials, change log |
| `foreman.jkw@propa3.com` | `D$RVW&@k^z*#zuhFN#3j` | Foreman | Jikwoyi — daily site logs (PWA), photos, material requests |
| `foreman.gz2@propa3.com` | `pjBgSiH&$LVyd*@^gwNF` | Foreman | Guzape II — daily site logs, photos, material requests |
| `engineer@propa3.com` | `Fq4CBjsU5Dgrhmb436ix` | Engineer | Certify milestone progress, FCDA gate on Foundation |
| `architect@propa3.com` | `Architect@Propa3!` | Architect | Design / planning document workflows |
| `store.jkw@propa3.com` | `7LhYmpTBgq3X*p3a#$5D` | Store Manager | Jikwoyi — fulfil/issue materials |
| `finance@propa3.com` | `QNp5miQQr@oaQwWD$UPB` | Finance | Invoices, payouts, money inflows; verify marketplace escrow |
| `sales@propa3.com` | `!dAscG#7$NhGnhdC7rH#` | Sales | CRM, listings, tenant applications; promote seeker → client |
| `client@propa3.com` | `MMBRg6fJHC^SStcPv$MP` | Client | Portal `/portal` **and** marketplace (DEMO-MKT-04 / 06) |
| `seeker@propa3.com` | `Seeker@Propa3!` | Marketplace seeker | My requests — DEMO-MKT-01…03, 05 |
| `artisan@propa3.com` | `Artisan@Propa3!` | Artisan | Chidi Plumber — `/artisan` |
| `artisan.elec@propa3.com` | `ArtisanElec@Propa3!` | Artisan | Bola Electrician — multi-quote on DEMO-MKT-03 |

**Quick marketplace UAT:** seed → seeker selects on DEMO-MKT-03 → client pays DEMO-MKT-04 → artisan quotes DEMO-MKT-02 → admin assigns DEMO-MKT-01. Full matrix in [TEST_USERS.md](./docs/TEST_USERS.md). Guide: `/user-guide`.

## Company settings & settlement bank

- **Company settings:** `/settings` — CEO/ADMIN edit fees & bank; FINANCE view-only.
- **Default settlement:** Triple A Realty Projects Ltd — Tajbank `0013925425`.

| Mailbox | Used for |
|---|---|
| `info@propa3.com` | **SMTP only** — Propa3 notifications / password reset |
| `ceo@propa3.com` … `artisan.elec@propa3.com` | Staff / client / marketplace login |

## Apply password/email changes on production DB

```bash
cd /var/www/propa3 && npm run db:seed
```

## Security

- Treat this file as **confidential** (UAT / initial mail setup).
- Rotate any password pasted in chat or committed to a public repo.
- Do not store `info@` SMTP password in git — use `/var/www/propa3/.env` on EC2.
