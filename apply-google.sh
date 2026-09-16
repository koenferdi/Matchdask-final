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
grep -q GOOGLE_CLIENT_ID /etc/matchdesk.env 2>/dev/null || echo 'GOOGLE_CLIENT_ID=' >> /etc/matchdesk.env
grep -q GOOGLE_CLIENT_SECRET /etc/matchdesk.env 2>/dev/null || echo 'GOOGLE_CLIENT_SECRET=' >> /etc/matchdesk.env
export MATCHDESK_VPS=1 VITE_AUTH_ENABLED=true VITE_NATIVE_GOOGLE=true
NODE_OPTIONS=--max-old-space-size=1536 MATCHDESK_VPS=1 VITE_NATIVE_GOOGLE=true VITE_AUTH_ENABLED=true npm run build
systemctl restart matchdesk
echo GOOGLE_PATCH_DONE
