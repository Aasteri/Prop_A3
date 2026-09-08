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
npm run db:push

echo "==> Seeding demo users (idempotent)..."
npx --yes tsx prisma/seed.ts

echo "==> Syncing web env for Next build..."
if grep -q '^NEXT_PUBLIC_API_URL=' .env; then
  grep '^NEXT_PUBLIC_API_URL=' .env > apps/web/.env.production
else
  echo "WARN: NEXT_PUBLIC_API_URL missing in .env — web may default to same-origin /api"
fi

echo "==> Building API + Web..."
npm run build

echo "==> Ensuring upload directories exist..."
mkdir -p uploads/{site-logs,payments,fcda,documents}

echo "==> Starting / reloading PM2..."
if pm2 describe propa3-api >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi

pm2 save

echo ""
echo "Deploy complete."
pm2 status
echo ""
echo "Smoke test: curl -s http://127.0.0.1:4000/api/health"
