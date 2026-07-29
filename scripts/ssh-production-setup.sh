#!/usr/bin/env bash
# One-shot production maintenance: SMTP in .env, pull, deploy (includes db:seed).
# Run from your PC (EC2 security group must allow SSH from your IP).
#
#   SMTP_PASS='your-info@propa3.com-password' bash scripts/ssh-production-setup.sh
#
# Optional: EC2_HOST, EC2_USER, SSH_KEY (default: propa3-mvp.pem in repo root)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${EC2_HOST:-52.209.36.187}"
USER="${EC2_USER:-ubuntu}"
KEY="${SSH_KEY:-$ROOT/propa3-mvp.pem}"
APP="/var/www/propa3"

if [[ ! -f "$KEY" ]]; then
  echo "ERROR: SSH key not found: $KEY"
  exit 1
fi

if [[ -z "${SMTP_PASS:-}" ]]; then
  echo "ERROR: Set SMTP_PASS (info@propa3.com mailbox password)."
  exit 1
fi

chmod 400 "$KEY" 2>/dev/null || true

SMTP_PASS_B64="$(printf '%s' "$SMTP_PASS" | base64 -w 0 2>/dev/null || printf '%s' "$SMTP_PASS" | base64)"

ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "${USER}@${HOST}" \
  "SMTP_PASS_B64=${SMTP_PASS_B64@Q} APP=${APP@Q} bash -s" <<'REMOTE'
set -euo pipefail
export SMTP_PASS_REMOTE="$(printf '%s' "$SMTP_PASS_B64" | base64 -d 2>/dev/null || printf '%s' "$SMTP_PASS_B64" | base64 -D)"
python3 <<'PY'
import os, re
path = os.path.join(os.environ["APP"], ".env")
pass_ = os.environ["SMTP_PASS_REMOTE"]
text = open(path, encoding="utf-8").read()
updates = {
    "SMTP_HOST": "server360.web-hosting.com",
    "SMTP_PORT": "465",
    "SMTP_SECURE": "true",
    "SMTP_USER": "info@propa3.com",
    "SMTP_PASS": pass_,
    "SMTP_FROM": '"Propa3" <info@propa3.com>',
}
for key, val in updates.items():
    if key == "SMTP_FROM":
        line = 'SMTP_FROM="Propa3" <info@propa3.com>'
    else:
        line = f"{key}={val}"
    pat = re.compile(rf"^{re.escape(key)}=.*$", re.M)
    if pat.search(text):
        text = pat.sub(line, text)
    else:
        if not text.endswith("\n"):
            text += "\n"
        text += line + "\n"
open(path, "w", encoding="utf-8").write(text)
print("SMTP vars updated in .env")
PY
cd "$APP"
git fetch origin main
git reset --hard origin/main
bash deploy/deploy.sh
REMOTE

echo "==> Done. Smoke: curl -s https://propa3.com/api/health"
