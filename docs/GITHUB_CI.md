# GitHub + CI/CD setup

After you create the GitHub repository, follow these steps once.

## 1. Push the codebase (your PC)

```bash
cd /e/software_projects/propa3
git init
git add .
git commit -m "Initial Prop A3 MVP"
git branch -M main
git remote add origin https://github.com/Aasteri/Prop_A3.git
git push -u origin main
```

## 2. Connect the server to GitHub (one-time)

SSH to the server and point `/var/www/propa3` at your repo.

**If the folder is already deployed (tarball):**

```bash
ssh -i propa3-mvp.pem ubuntu@52.209.36.187
cd /var/www/propa3
git init
git remote add origin https://github.com/Aasteri/Prop_A3.git
git fetch origin main
git reset --hard origin/main
```

The server `.env` stays on disk and is **not** in git — it will not be overwritten.

## 3. GitHub Actions secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|---|---|
| `EC2_HOST` | `52.209.36.187` *(optional — only if using SSH deploy)* |
| `DEPLOY_HOOK_SECRET` | Same value as `DEPLOY_HOOK_SECRET` in server `.env` |

Generate hook secret on the server: `openssl rand -hex 32`

Deploy uses **HTTPS webhook** (`POST /api/deploy/hook`) because EC2 SSH is restricted to your IP — GitHub Actions cannot SSH in directly.

## 4. How deploy works

On every push to **`main`**, `.github/workflows/deploy.yml`:

1. SSH into EC2
2. `git fetch` + `git reset --hard origin/main`
3. `bash deploy/deploy.sh` (install, migrate, build, PM2 reload)
4. Health check on `/api/health`

Manual deploy: **Actions** → **Deploy to EC2** → **Run workflow**.

## 5. Verify CI/CD

After secrets are set, push a small change to `main` and watch the workflow in the **Actions** tab.

---

**Never commit:** `.env`, `*.pem`, `node_modules/`
