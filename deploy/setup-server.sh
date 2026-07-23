#!/usr/bin/env bash
# Propa3 — first-time EC2 server setup (Ubuntu 22.04)
# Sized for budget MVP ~10 users/day (t3.micro + 3 GiB swap)
# Run: sudo bash deploy/setup-server.sh

set -euo pipefail

echo "==> Updating packages..."
apt-get update -y
apt-get upgrade -y

echo "==> Installing base tools..."
apt-get install -y curl git build-essential ufw jq

echo "==> Configuring 3 GiB swap (required on t3.micro — 1 GiB RAM is tight)..."
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 3G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v

echo "==> Installing MySQL 8..."
apt-get install -y mysql-server
systemctl enable mysql
systemctl start mysql

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$SCRIPT_DIR/mysql/mvp-my.cnf" ]]; then
  cp "$SCRIPT_DIR/mysql/mvp-my.cnf" /etc/mysql/mysql.conf.d/99-propa3.cnf
  systemctl restart mysql
  echo "    Applied MySQL tune for t3.micro (see deploy/mysql/mvp-my.cnf)"
fi

echo "==> Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx

echo "==> Installing PM2..."
npm install -g pm2

echo "==> Creating uploads directories..."
APP_ROOT="${APP_ROOT:-/var/www/propa3}"
mkdir -p "$APP_ROOT/uploads"/{site-logs,payments,fcda} 2>/dev/null || true
if [[ -d "$APP_ROOT" ]]; then
  chown -R "${SUDO_USER:-ubuntu}:www-data" "$APP_ROOT/uploads" 2>/dev/null || true
fi

mkdir -p /var/backups/propa3
chown "${SUDO_USER:-ubuntu}:${SUDO_USER:-ubuntu}" /var/backups/propa3 2>/dev/null || true

echo "==> Configuring UFW..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "Setup complete (budget MVP — target ~10 users/day on t3.micro)."
echo ""
echo "Instance check: t3.micro (1 GiB) + swap is OK for low traffic; upgrade to t3.small at ~30+ daily users."
echo "  free -h   # verify RAM + swap"
echo ""
echo "Next steps:"
echo "  1. Create MySQL database + user (docs/DEPLOY.md)"
echo "  2. cp .env.production.example .env && edit JWT_SECRET, DATABASE_URL"
echo "  3. npm ci && npm run db:push && npm run db:seed && npm run build"
echo "  4. bash deploy/deploy.sh"
echo "  5. Nginx + Certbot (docs/DEPLOY.md)"
