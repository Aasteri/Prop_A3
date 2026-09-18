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
if grep -q '^NEXT_PUBLIC_API_URL=' .env; then
  grep '^NEXT_PUBLIC_API_URL=' .env > apps/web/.env.production
else
  echo "WARN: NEXT_PUBLIC_API_URL missing in .env — web may default to same-origin /api"
fi

echo "==> Stopping PM2 before build (t3.micro/small needs the RAM)..."
pm2 stop all || true
# Give Node time to release heap before nest/next build
sleep 3
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

echo "==> Building API + Web..."
npm run build

echo "==> Ensuring upload directories exist..."
mkdir -p uploads/{site-logs,payments,fcda,documents}

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
