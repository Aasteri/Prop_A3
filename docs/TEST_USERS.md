# Test users (Prop A3 / Propa3)

**Login:** https://propa3.com/login (local: `/login`)  
**Domain:** all accounts use **`@propa3.com`**.

**Canonical list in repo:** this file. Short copy: [`demo-users-list.md`](../demo-users-list.md) (root).  
**Source of truth for seed:** [`prisma/demo-users.ts`](../prisma/demo-users.ts) + [`prisma/marketplace-demo.ts`](../prisma/marketplace-demo.ts) — `npm run db:seed` upserts users and rebuilds `DEMO-MKT-*` jobs.

Create each mailbox on Namecheap with the **same password** as below (optional for UAT; app login works from DB alone).  
**App SMTP (system mail only):** `info@propa3.com` — password in server `.env` only (`SMTP_*`).

## Staff & property client

| Role | Email | Password | What to test |
|---|---|---|---|
| CEO | `ceo@propa3.com` | `RwrsW9r8xz&noJv3tept` | Full access — dashboards, approvals, [Company settings](/settings), admin purge, invoices, CRM, Estate Terrier, [marketplace admin](/marketplace-admin) |
| ADMIN | `admin@propa3.com` | `Admin@Propa3!` | Same admin surfaces as CEO — [Company settings](/settings) edit, [System admin](/admin), audit, marketplace assign/approve |
| PROJECT_MANAGER | `pm.jkw@propa3.com` | `Bar4QMujSv$gu8fdb32J` | Jikwoyi — site logs approvals, milestones, material requests, change log, tenant apps, PM fee schedules |
| FOREMAN | `foreman.jkw@propa3.com` | `D$RVW&@k^z*#zuhFN#3j` | Jikwoyi — daily site logs (PWA), photos, material requests |
| FOREMAN | `foreman.gz2@propa3.com` | `pjBgSiH&$LVyd*@^gwNF` | Guzape II — daily site logs, photos, material requests |
| ENGINEER | `engineer@propa3.com` | `Fq4CBjsU5Dgrhmb436ix` | Milestone certification, FCDA gate on Foundation, COREN licence |
| ARCHITECT | `architect@propa3.com` | `Architect@Propa3!` | Design / planning document workflows as role access expands |
| STORE_MANAGER | `store.jkw@propa3.com` | `7LhYmpTBgq3X*p3a#$5D` | Jikwoyi — fulfil/issue materials from approved requests |
| FINANCE | `finance@propa3.com` | `QNp5miQQr@oaQwWD$UPB` | Invoices, payments, money inflows, [payouts](/payouts), remittances; **view** [Company settings](/settings); verify marketplace escrow proofs |
| SALES | `sales@propa3.com` | `!dAscG#7$NhGnhdC7rH#` | CRM pipeline, listings, tenant applications, offers; **Add client** from existing seeker |
| CLIENT | `client@propa3.com` | `MMBRg6fJHC^SStcPv$MP` | Client portal `/portal` — Guzape II duplex. **Same login** on `/marketplace` (demo jobs DEMO-MKT-04, DEMO-MKT-06). |

## Artisan marketplace

| Role | Email | Password | What to test |
|---|---|---|---|
| MARKETPLACE_SEEKER | `seeker@propa3.com` | `Seeker@Propa3!` | Ada Seeker — `/marketplace/requests` owns DEMO-MKT-01…03 and DEMO-MKT-05 |
| ARTISAN | `artisan@propa3.com` | `Artisan@Propa3!` | Chidi Plumber (approved) — `/artisan` assignments & quotes |
| ARTISAN | `artisan.elec@propa3.com` | `ArtisanElec@Propa3!` | Bola Electrician (approved) — second quote on DEMO-MKT-03 |
| CLIENT (dual use) | `client@propa3.com` | *(same as above)* | Property client requesting artisans with one account |

Public signup still works for new seekers (`/marketplace/register`) and artisans (`/marketplace/apply`). Existing emails cannot create a duplicate account.

### Seeded demo jobs (`DEMO-MKT-*`)

| publicId | Owner | Status | How to use |
|---|---|---|---|
| DEMO-MKT-01 | seeker@ | SUBMITTED | Admin assigns artisans on `/marketplace-admin` |
| DEMO-MKT-02 | seeker@ | ASSIGNED | `artisan@` submits a quote on `/artisan` |
| DEMO-MKT-03 | seeker@ | QUOTED | Seeker selects between Chidi & Bola quotes → chat opens |
| DEMO-MKT-04 | client@ | AWAITING_PAYMENT | Chat open; pay escrow; address still locked |
| DEMO-MKT-05 | seeker@ | IN_PROGRESS | Escrow held; address unlocked in chat; Confirm complete |
| DEMO-MKT-06 | client@ | COMPLETED | History / completed flow |

Also seeded: pending artisan **Tunde Painter** (no login) for approve-on-admin practice.

In-app guide: [`/user-guide`](/user-guide) — filter ARTISAN / MARKETPLACE_SEEKER / section **Artisan marketplace**.

## Company settings

- **Route:** `/settings` (API: `GET/PATCH /company-settings`)
- **Who can change fees & bank:** CEO, ADMIN only
- **Who can view:** CEO, ADMIN, FINANCE
- Changes apply to **new** calculations only; existing invoices/engagements stay as saved unless edited.
- Marketplace platform fee default: **2.5%** of workmanship.

## Triple A bank (default settlement)

| Field | Value |
|---|---|
| Legal name | TRIPLE A REALTY PROJECTS LTD |
| Bank | Tajbank |
| Account name | TRIPLE A REALTY PROJECTS LTD |
| Account number | 0013925425 |

Synced from Company settings → settlement entity `seed-triplea` (default invoice payee).

## Apply on DB (local or live)

```bash
npm run db:seed
# or on EC2 after pull:
cd /var/www/propa3 && npm run db:seed
```

Deploy already runs seed as part of `deploy/deploy.sh`. Re-seed refreshes `DEMO-MKT-*` jobs to the statuses above.

## Security

- Treat this file as **confidential** (UAT passwords).
- Rotate any password pasted in chat or committed to a public repo.
- Do not store `info@` SMTP password in git.
