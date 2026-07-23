# Propa3 — AWS deploy runbook (MVP internal production)

**One server serves both purposes:** validate the MVP, then **daily internal use by Triple A** on `propa3.com`.

Deploy target: **Ubuntu 22.04 or 24.04 LTS EC2** + **MySQL 8** (same box) + **Nginx** + **PM2**.  
Domain: **`propa3.com`** — A records to Elastic IP (direct DNS, no Cloudflare proxy).

---

## Capacity tiers

| Tier | Instance | Daily users | ~Monthly cost | Use when |
|---|---|---|---|---|
| **Budget (launch now)** | **t3.micro** (1 GiB + 3 GiB swap) | **~10** | **~$13** | Stretching $100 credits ~8 months |
| **Standard** | **t3.small** (2 GiB + 2 GiB swap) | **~50** | **~$23** | Team rollout, heavier daily use |

**Budget tier is fine for early internal testing.** Upgrade instance type in-place when traffic grows or before public launch.

---

## EC2 launch wizard — budget settings (~$100 credit year)

Use these in the AWS **Launch instance** screen:

| Section | Setting |
|---|---|
| **Name** | `Prop A3 Server` |
| **AMI** | **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** — Canonical, x86 |
| **Instance type** | **`t3.micro`** (2 vCPU, 1 GiB) — OK for ~10 users/day with swap |
| **Key pair** | `propa3-mvp` |
| **Network** | Default VPC, **Auto-assign public IP: Enable** |
| **Security group** | SSH **My IP** only; HTTP + HTTPS from internet |

### Storage

| Setting | Value |
|---|---|
| Root volume | **20 GiB gp3** (enough for MVP; expand later if needed) |
| Encryption | Optional |

After launch: **Elastic IP → allocate → associate** before DNS.

### Cost notes ($100 signup credit)

| Item | ~Monthly |
|---|---|
| t3.micro | ~$7.50 |
| 20 GiB gp3 | ~$1.60 |
| Public IPv4 | ~$3.60 |
| **Total** | **~$13/month** |

- **$100 alone** covers about **7–8 months**, not a full 12.
- To get closer to 12 months free: complete **Explore AWS** activities for **+$100** credits (Console Home → filter “Earn AWS credits”).
- Set billing alarms at **$80** and **$100**.
- After credits: expect **~$50–60/year** out of pocket on budget tier, or migrate to another VPS.

---

## EC2 launch wizard — standard settings (~50 users/day)

| Section | Setting |
|---|---|
| **Instance type** | **`t3.small`** (2 vCPU, 2 GiB) |
| **Root volume** | **30 GiB gp3** |

*(Other settings same as budget tier above.)*

---

## Architecture

```
propa3.com (A → Elastic IP)
    → Nginx :443
         /api, /uploads  → NestJS :4000  (PM2)
         /               → Next.js :3000 (PM2)
    → MySQL 8 (localhost)
    → /var/www/propa3/uploads/  (site photos, payment proofs, FCDA)
```

---

## Phase A — AWS account (one-time)

1. MFA on root; IAM admin user for daily use.
2. Billing alarms: **$80 / $100** (budget t3.micro ≈ $13/month); add **$25** if you upgrade to t3.small.
3. **Weekly EBS snapshot** on the root volume (Lifecycle Manager or manual).

---

## Phase B — DNS

| Type | Host | Value |
|---|---|---|
| **A** | `@` | Elastic IP |
| **A** | `www` | Elastic IP |

Verify: `dig +short propa3.com`

---

## Phase C — First-time server setup

```bash
ssh -i propa3-mvp.pem ubuntu@<ELASTIC_IP>

sudo mkdir -p /var/www
sudo chown ubuntu:ubuntu /var/www
git clone <YOUR_REPO_URL> /var/www/propa3
cd /var/www/propa3

sudo bash deploy/setup-server.sh
```

The setup script installs Node 20, MySQL, Nginx, PM2, **3 GiB swap**, and a light MySQL tune for t3.micro.

### MySQL database

```bash
sudo mysql
```

```sql
CREATE DATABASE prop_a3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'propa3'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON prop_a3.* TO 'propa3'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Environment

```bash
cp .env.production.example .env
nano .env
openssl rand -base64 48   # paste as JWT_SECRET
```

Rebuild web after changing `NEXT_PUBLIC_API_URL` (baked in at build time):

```bash
npm ci
npm run db:push
npm run db:seed          # first deploy only — real Triple A users/projects
npm run build
bash deploy/deploy.sh
```

### Nginx + SSL

```bash
sudo cp deploy/nginx/propa3.conf /etc/nginx/sites-available/propa3
sudo ln -sf /etc/nginx/sites-available/propa3 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d propa3.com -d www.propa3.com
```

### PM2 on reboot

```bash
pm2 startup systemd
pm2 save
```

---

## Phase D — Deploy updates

```bash
cd /var/www/propa3
git pull
bash deploy/deploy.sh
```

---

## Operations (50 users/day)

### Daily health check

```bash
curl -s https://propa3.com/api/health
pm2 status
df -h /
free -h
```

### Backups

| What | How often |
|---|---|
| EBS snapshot | Weekly |
| MySQL dump | Daily (cron) — see below |
| `uploads/` | Included in EBS snapshot; move to S3 when >5 GB |

Daily MySQL backup cron (as `ubuntu`):

```bash
mkdir -p /var/backups/propa3
crontab -e
# Add:
0 2 * * * mysqldump -u propa3 -p'YOUR_PASSWORD' prop_a3 | gzip > /var/backups/propa3/prop_a3_$(date +\%Y\%m\%d).gz
```

Keep 7 days; copy off-server when possible.

### When to upgrade instance

| Signal | Action |
|---|---|
| `free -h` swap constantly used | Upgrade to **t3.medium** (4 GiB) |
| Site log photo uploads slow | Add S3 for uploads |
| >100 daily users | Split DB to RDS; consider ALB + 2 app servers |

---

## Smoke tests (before team rollout)

```bash
curl -s https://propa3.com/api/health
curl -sI https://propa3.com/
```

Manual:

- [ ] Public homepage + property inquiry → CRM lead
- [ ] Staff login (foreman, PM, sales)
- [ ] Client portal (`client@triplea.ng`)
- [ ] Site log submit + photo upload (mobile)
- [ ] PM approve log → milestone updates
- [ ] Invoice payment proof upload

---

## Go-live checklist (Triple A internal)

- [ ] Replace seed passwords; create real user accounts per site
- [ ] Confirm bank details on settlement entities (Abraham)
- [ ] Remove or disable unused seed demo data
- [ ] Share login URL: `https://propa3.com/login`
- [ ] Foreman training: PWA site log on mobile data
- [ ] PM training: approve logs within 24h (Charter rule)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| 502 Bad Gateway | `pm2 status` · `pm2 logs propa3-api --lines 50` |
| Out of memory / kills | Upgrade to t3.small+; check `free -h`; swap should exist |
| CORS errors | `WEB_URL` must list exact browser origin |
| Upload fails | Nginx `client_max_body_size 25M` · disk space `df -h` |
| SSL expiry | `sudo certbot renew --dry-run` |

---

## File reference

| File | Purpose |
|---|---|
| `deploy/setup-server.sh` | First-time EC2 (swap, MySQL tune) |
| `deploy/deploy.sh` | Repeat deploy |
| `deploy/ecosystem.config.cjs` | PM2 |
| `deploy/nginx/propa3.conf` | Reverse proxy |
| `deploy/mysql/mvp-my.cnf` | MySQL memory limits |
| `.env.production.example` | Environment template |
