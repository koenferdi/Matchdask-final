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
curl -fsSL "$BASE/src/lib/owner.ts" -o src/lib/owner.ts
curl -fsSL "$BASE/src/routes/login.tsx" -o src/routes/login.tsx
curl -fsSL "$BASE/src/components/site-shell.tsx" -o src/components/site-shell.tsx
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
# Force production origin in the built server (Nitro otherwise keeps localhost:8080)
find .output/server -type f \( -name '*.mjs' -o -name '*.js' \) -print0 \
  | xargs -0 grep -l 'localhost:8080' \
  | xargs -r sed -i 's|http://localhost:8080|https://www.getmatchdesk.nl|g'
echo "localhost leftovers:" 
grep -R 'localhost:8080' .output/server | head || echo none
systemctl restart matchdesk
sleep 2
systemctl is-active matchdesk
echo -n "google_redirect="
curl -sS -m 8 -H 'content-type: application/json' -H 'origin: https://www.getmatchdesk.nl' \
  -X POST http://127.0.0.1:3000/api/auth/sign-in/social \
  --data '{"provider":"google","callbackURL":"/klant"}' | tr '"' '\n' | grep -E 'redirect_uri|localhost|getmatchdesk' | head
echo GOOGLE_PATCH_DONE
