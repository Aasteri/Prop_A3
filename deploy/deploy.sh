#!/usr/bin/env bash
# Propa3 — deploy / update on EC2
# Usage: bash deploy/deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Propa3 deploy from $ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: .env missing. Copy .env.production.example → .env first."
  exit 1
fi

echo "==> Installing dependencies..."
npm ci --include=dev

echo "==> Generating Prisma client..."
npm run db:generate

echo "==> Syncing database schema..."
# Production may need --accept-data-loss for enum/column reshapes (e.g. tenant stars).
# Without it, prisma db push aborts and PM2 keeps serving the previous build forever.
npx prisma db push --accept-data-loss

echo "==> Seeding demo users (idempotent)..."
npx --yes tsx prisma/seed.ts

echo "==> Upserting Triple A settlement bank (CONFIRMED)..."
npx --yes tsx scripts/upsert-settlement-entities.ts

echo "==> Syncing web env for Next build..."
{
  if grep -q '^NEXT_PUBLIC_API_URL=' .env; then
    grep '^NEXT_PUBLIC_API_URL=' .env
  else
    echo "WARN: NEXT_PUBLIC_API_URL missing in .env — web may default to same-origin /api" >&2
  fi
  # Canonical site URL for sitemap / Open Graph (organic SEO)
  if grep -q '^NEXT_PUBLIC_SITE_URL=' .env; then
    grep '^NEXT_PUBLIC_SITE_URL=' .env
  elif grep -q '^WEB_URL=' .env; then
    echo "NEXT_PUBLIC_SITE_URL=$(grep '^WEB_URL=' .env | head -1 | cut -d= -f2- | cut -d, -f1)"
  else
    echo 'NEXT_PUBLIC_SITE_URL=https://propa3.com'
  fi
} > apps/web/.env.production

echo "==> Freeing RAM for builds (keep API up as long as possible so login does not 502)..."
# Next.js build is the memory hog — stop web first; leave API serving /api/auth/login.
pm2 stop propa3-web || true
sleep 2
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

echo "==> Building API..."
npm run build:api

echo "==> Reloading API immediately (minimize Bad Gateway windows)..."
if pm2 describe propa3-api >/dev/null 2>&1; then
  pm2 restart propa3-api --update-env || true
else
  pm2 start deploy/ecosystem.config.cjs --only propa3-api || true
fi
sleep 2

echo "==> Building Web (API stays online for Sign in)..."
# If RAM is critically low, briefly stop API — prefer not to.
AVAILABLE_MB="$(awk '/MemAvailable:/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)"
if [[ "${AVAILABLE_MB}" -gt 0 && "${AVAILABLE_MB}" -lt 250 ]]; then
  echo "WARN: only ${AVAILABLE_MB}Mi available — stopping API for Next build"
  pm2 stop propa3-api || true
  sleep 2
fi
npm run build --workspace=apps/web

echo "==> Ensuring upload directories exist..."
mkdir -p uploads/{site-logs,payments,fcda,documents,marketplace}

echo "==> Starting / reloading PM2..."
if pm2 describe propa3-api >/dev/null 2>&1; then
  pm2 restart deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi

pm2 save

echo ""
echo "Deploy complete."
pm2 status
echo ""
echo "Smoke test: curl -s http://127.0.0.1:4000/api/health"
curl -sf http://127.0.0.1:4000/api/health || echo "API health failed"
echo ""
curl -s -o /dev/null -w "login_page:%{http_code}\n" http://127.0.0.1:3000/login || true
