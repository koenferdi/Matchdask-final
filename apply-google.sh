#!/usr/bin/env bash
set -euo pipefail
APP=/opt/matchdesk
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main
cd "$APP"
curl -fsSL "$BASE/src/lib/auth/server.ts" -o src/lib/auth/server.ts
curl -fsSL "$BASE/src/lib/auth/client.ts" -o src/lib/auth/client.ts
curl -fsSL "$BASE/src/lib/auth/providers.ts" -o src/lib/auth/providers.ts
curl -fsSL "$BASE/src/lib/auth/gates.tsx" -o src/lib/auth/gates.tsx
curl -fsSL "$BASE/src/components/auth-form.tsx" -o src/components/auth-form.tsx
grep -q VITE_NATIVE_GOOGLE /etc/matchdesk.env 2>/dev/null || echo 'VITE_NATIVE_GOOGLE=true' >> /etc/matchdesk.env
grep -q '^BETTER_AUTH_URL=' /etc/matchdesk.env 2>/dev/null || echo 'BETTER_AUTH_URL=https://www.getmatchdesk.nl' >> /etc/matchdesk.env
sed -i 's|^BETTER_AUTH_URL=$|BETTER_AUTH_URL=https://www.getmatchdesk.nl|' /etc/matchdesk.env || true
set -a
# shellcheck disable=SC1091
. /etc/matchdesk.env
set +a
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-https://www.getmatchdesk.nl}"
export MATCHDESK_VPS=1 VITE_AUTH_ENABLED=true VITE_NATIVE_GOOGLE=true
if [[ -z "${GOOGLE_CLIENT_ID:-}" || -z "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  echo "GOOGLE keys ontbreken in /etc/matchdesk.env"
  exit 1
fi
echo "Google keys geladen (${#GOOGLE_CLIENT_ID} / ${#GOOGLE_CLIENT_SECRET} tekens)"
echo "BETTER_AUTH_URL=$BETTER_AUTH_URL"
mkdir -p /etc/systemd/system/matchdesk.service.d
cat >/etc/systemd/system/matchdesk.service.d/override.conf <<'OVR'
[Service]
Environment=BETTER_AUTH_URL=https://www.getmatchdesk.nl
Environment=MATCHDESK_VPS=1
Environment=VITE_AUTH_ENABLED=true
OVR
systemctl daemon-reload
NODE_OPTIONS=--max-old-space-size=1536 npm run build
systemctl restart matchdesk
sleep 2
systemctl is-active matchdesk
echo GOOGLE_PATCH_DONE
