#!/usr/bin/env bash
# Merge SMTP_* into repo .env when DEPLOY_SMTP_PASS is set (deploy hook / CI only).
set -euo pipefail

if [[ -z "${DEPLOY_SMTP_PASS:-}" ]]; then
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
export ROOT

python3 <<'PY'
import os, re
path = os.path.join(os.environ["ROOT"], ".env")
pass_ = os.environ["DEPLOY_SMTP_PASS"]
text = open(path, encoding="utf-8").read()
updates = {
    "SMTP_HOST": "server360.web-hosting.com",
    "SMTP_PORT": "465",
    "SMTP_SECURE": "true",
    "SMTP_USER": "info@propa3.com",
    "SMTP_PASS": pass_,
}
for key, val in updates.items():
    line = f"{key}={val}"
    pat = re.compile(rf"^{re.escape(key)}=.*$", re.M)
    if pat.search(text):
        text = pat.sub(line, text)
    else:
        if not text.endswith("\n"):
            text += "\n"
        text += line + "\n"
line = 'SMTP_FROM="Propa3" <info@propa3.com>'
pat = re.compile(r"^SMTP_FROM=.*$", re.M)
if pat.search(text):
    text = pat.sub(line, text)
else:
    text += line + "\n"
open(path, "w", encoding="utf-8").write(text)
print("SMTP_* merged into .env")
PY

unset DEPLOY_SMTP_PASS
