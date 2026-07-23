# Propa3

Grounded real estate & construction platform for **Triple A Realty Projects Ltd.** (Abuja, Nigeria).

---
<!-- Setup Commands -->
npm run dev          # API :4000 + Web :3000
npm run db:push      # After schema changes
npm run db:seed      # Users, sites, projects
npm run db:studio    # Browse prop_a3 in browser



## Repository layout

| Path | Purpose |
|---|---|
| **`planning/`** | All requirements, specs, Abraham's documents, seed data — **[start here](./planning/README.md)** |
| **`demo-users-list.md`** | Live demo logins for UAT (roles + passwords) |
| **`apps/`** | NestJS API + Next.js web |
| **`README.md`** | This file |

---

## Planning & knowledge base

Everything from discovery through MVP specification lives in **`planning/`**:

- [`planning/MVP_INTERNAL.md`](./planning/MVP_INTERNAL.md) — what to build first
- [`planning/MVP_ROADMAP.md`](./planning/MVP_ROADMAP.md) — **full todo list: now → deployable MVP**
- [`planning/FEATURES_MASTER.md`](./planning/FEATURES_MASTER.md) — full feature catalog
- [`planning/OPERATIONAL_FORMS.md`](./planning/OPERATIONAL_FORMS.md) — exact form specs
- [`planning/sources/abraham-uploads/`](./planning/sources/abraham-uploads/) — original client documents

See [`planning/README.md`](./planning/README.md) for the complete index.

---

## Stack (decided)

| Layer | Choice |
|---|---|
| API | NestJS (TypeScript) |
| Web | Next.js |
| Database | MySQL |
| ORM | Prisma |
| Deploy | AWS EC2 `t3.small` + PM2 + Nginx (MVP internal, ~50 users/day) |
| Files | S3 |

*Supersedes PostgreSQL note in `planning/PRODUCT_DECISIONS.md`.*

---

## Status

- [x] Requirements & MVP scoped
- [x] Planning archive organized
- [x] Local MySQL connected (`prop_a3`)
- [x] NestJS API scaffold + Prisma (starter schema)
- [x] Next.js web app (login, dashboard, site tracker)
- [x] Auth (JWT) + expanded schema (milestones, daily logs)
- [x] Client portal + public site
- [ ] AWS EC2 MVP server (see [docs/DEPLOY.md](./docs/DEPLOY.md) — **t3.small**, ~50 users/day)
- [ ] DNS A record + SSL on `propa3.com`

---

## Local development

### Prerequisites

- Node.js 20+
- MySQL (Laragon) with database **`prop_a3`**

### Environment

Copy `.env.example` → `.env` (already configured for local Laragon):

```
DATABASE_URL="mysql://root@localhost:3306/prop_a3"
API_PORT=4000
```

### Commands

```bash
npm install              # root + workspaces
npm run db:push          # sync Prisma schema → MySQL
npm run db:seed          # sites, users, projects, milestones
npm run dev              # API :4000 + Web :3000
npm run dev:api          # API only
npm run dev:web          # Web only
npm run db:studio        # Prisma Studio (DB browser)
```

### Dev login (after seed)

| Email | Role | Password |
|---|---|---|
| `ceo@triplea.ng` | CEO | `Propa3Dev!` |
| `pm.jkw@triplea.ng` | Project Manager (Jikwoyi) | `Propa3Dev!` |
| `foreman.gz2@triplea.ng` | Foreman (Guzape II) | `Propa3Dev!` |
| `foreman.jkw@triplea.ng` | Foreman (Jikwoyi) | `Propa3Dev!` |
| `store.jkw@triplea.ng` | Store Manager (Jikwoyi) | `Propa3Dev!` |
| `finance@triplea.ng` | Finance | `Propa3Dev!` |
| `sales@triplea.ng` | Sales | `Propa3Dev!` |
| `client@triplea.ng` | Client portal | `Propa3Dev!` |

### Production deploy (MVP internal)

Target: **~50 users/day** on one **`t3.small`** (2 GiB RAM, 30 GiB disk). Not a throwaway staging box — Triple A uses this daily after go-live.

See **[docs/DEPLOY.md](./docs/DEPLOY.md)** — EC2 wizard settings, DNS, Nginx, PM2, Certbot, backups.

```bash
bash deploy/setup-server.sh   # first time on EC2
bash deploy/deploy.sh         # each release
```

### Verify

```bash
curl http://localhost:4000/api/health
# {"status":"ok","database":"prop_a3",...}
```

### Starter tables (Prisma)

| Table | Purpose |
|---|---|
| `users` | Auth (MVP) |
| `sites` | Jikwoyi, Mpape, Guzape II/III |
| `projects` | Construction projects per site |
