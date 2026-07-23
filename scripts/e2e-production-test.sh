#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://propa3.com/api}"
PASS='Propa3Dev!'

jget() { node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); $1"; }

login() {
  curl -sf "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$PASS\"}" | jget "process.stdout.write(d.accessToken)"
}

echo "==> Health"
curl -sf "$BASE/health"
echo ""

echo "==> Login foreman (JKW) + PM + client"
FOREMAN_TOKEN=$(login 'foreman.jkw@triplea.ng')
PM_TOKEN=$(login 'pm.jkw@triplea.ng')
CLIENT_TOKEN=$(login 'client@triplea.ng')
echo "tokens OK"

echo "==> PM dashboard"
curl -sf "$BASE/dashboard/pm" -H "Authorization: Bearer $PM_TOKEN" | jget "console.log('pendingLogs',d.pendingLogCount,'materials',d.pendingMaterialCount,'hse',d.openHseCount)"

echo "==> Notifications"
curl -sf "$BASE/notifications/unread-count" -H "Authorization: Bearer $PM_TOKEN"

echo ""
echo "==> Create + submit + approve site log (JKW)"
PROJECT_ID="seed-jkw-mixuse"
TODAY=$(date -u +%Y-%m-%d)
LOG_ID=$(curl -sf "$BASE/site-tracker/logs" -H "Authorization: Bearer $FOREMAN_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"projectId\":\"$PROJECT_ID\",\"date\":\"$TODAY\",\"projectName\":\"E2E Duplex\",\"projectLocation\":\"Guzape\",\"startTime\":\"07:00\",\"endTime\":\"17:00\",\"activities\":[{\"activity\":\"E2E works\",\"status\":\"ONGOING\",\"progressPercent\":50}],\"materials\":[{\"material\":\"Cement\",\"receivedQty\":10,\"consumedQty\":15}],\"safetyIncidentsNearMisses\":true,\"issueMaterialShortage\":true}" \
  | jget "process.stdout.write(d.id)")
echo "logId=$LOG_ID"

curl -sf -X POST "$BASE/site-tracker/logs/$LOG_ID/submit" -H "Authorization: Bearer $FOREMAN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"supervisorSignature":"Foreman E2E"}' | jget "console.log('submitted',d.status,d.refCode)"

curl -sf "$BASE/notifications" -H "Authorization: Bearer $PM_TOKEN" | jget "console.log('notifications',d.length,d[0]?.type,d[0]?.title)"

curl -sf -X POST "$BASE/site-tracker/logs/$LOG_ID/approve" -H "Authorization: Bearer $PM_TOKEN" | jget "console.log('approved',d.status)"

curl -sf "$BASE/hse/incidents" -H "Authorization: Bearer $PM_TOKEN" | jget "console.log('hse',d.length,d[0]?.status)"

echo "==> Client portal"
curl -sf "$BASE/client-portal/invoices" -H "Authorization: Bearer $CLIENT_TOKEN" | jget "console.log('invoices',d.length,d[0]?.invoiceNumber,'outstanding',d[0]?.outstanding)"

INVOICE_ID=$(curl -sf "$BASE/client-portal/invoices" -H "Authorization: Bearer $CLIENT_TOKEN" | jget "process.stdout.write(d[0]?.id||'')")
if [ -n "$INVOICE_ID" ]; then
  echo "==> Client payment proof upload"
  PROOF_FILE="e:/software_projects/propa3/.e2e-proof.tmp"
  echo 'fake-proof-content' > "$PROOF_FILE"
  PAY_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/invoices/$INVOICE_ID/payments" \
    -H "Authorization: Bearer $CLIENT_TOKEN" \
    -F "amount=5000000" \
    -F "proof=@$PROOF_FILE;type=image/png")
  PAY_BODY=$(echo "$PAY_RESP" | head -n -1)
  PAY_CODE=$(echo "$PAY_RESP" | tail -1)
  echo "payment http=$PAY_CODE"
  echo "$PAY_BODY" | jget "console.log('payment',d.status,d.amount)"
  rm -f "$PROOF_FILE"

  FIN_TOKEN=$(login 'finance@triplea.ng')
  PAY_ID=$(curl -sf "$BASE/invoices/$INVOICE_ID" -H "Authorization: Bearer $FIN_TOKEN" | jget "const p=d.payments.find(x=>x.status==='PENDING'); process.stdout.write(p?.id||'')")
  if [ -n "$PAY_ID" ]; then
    echo "==> Finance verify payment"
    curl -sf -X POST "$BASE/invoices/payments/$PAY_ID/verify" -H "Authorization: Bearer $FIN_TOKEN" | jget "console.log('verified',d.status,d.receiptNumber)"
  fi
fi

echo "==> Document upload (FCDA permit v1)"
SALES_TOKEN=$(login 'sales@triplea.ng')
DOC_FILE="e:/software_projects/propa3/.e2e-doc.tmp"
echo '%PDF-1.4 fake fcda permit' > "$DOC_FILE"
curl -sf -X POST "$BASE/documents/upload" -H "Authorization: Bearer $PM_TOKEN" \
  -F "entityType=PROJECT" -F "entityId=$PROJECT_ID" -F "category=PERMIT" \
  -F "title=FCDA Permit E2E" -F "file=@$DOC_FILE;type=application/pdf" \
  | jget "console.log('doc',d.version,d.category,d.fileUrl)"
rm -f "$DOC_FILE"

echo "==> Allocation letter PDF"
CLIENT_ID=$(curl -sf "$BASE/crm/clients" -H "Authorization: Bearer $SALES_TOKEN" \
  | jget "const c=d.find(x=>x.clientRef==='CLT-0001')||d[0]; process.stdout.write(c?.id||'')")
if [ -n "$CLIENT_ID" ]; then
  curl -sf -X POST "$BASE/documents/allocation-letter" -H "Authorization: Bearer $SALES_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"clientId\":\"$CLIENT_ID\",\"projectId\":\"seed-gz2-duplex\"}" \
    | jget "console.log('allocation',d.title,d.version)"
fi

echo "==> Client portal documents"
curl -sf "$BASE/client-portal/documents" -H "Authorization: Bearer $CLIENT_TOKEN" \
  | jget "console.log('clientDocs',d.length,d[0]?.category)"

echo "E2E_OK"
