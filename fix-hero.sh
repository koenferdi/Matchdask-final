#!/usr/bin/env bash
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
APP=/opt/matchdesk
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main
cd "$APP"
mkdir -p src/routes/api/partner src/routes/api/mail src/lib/mail src/lib src/components /opt/matchdesk/data
rm -f src/routes/rapport.voorbeeld.tsx src/routes/exclusief.voorbeeld.tsx
files=(
  src/components/cinema-hero.tsx
  src/components/auth-form.tsx
  src/components/site-shell.tsx
  src/components/demo-portal.tsx
  src/components/path-choice.tsx
  src/components/proof-badge.tsx
  src/components/fit-document.tsx
  src/components/ui/button.tsx
  src/styles.css
  src/lib/matchdesk.ts
  src/lib/store.ts
  src/lib/blog.ts
  src/lib/workspace-file.ts
  src/lib/owner.ts
  src/lib/mail/core.mjs
  src/lib/mail/server.ts
  src/lib/auth/gates.tsx
  src/routes/index.tsx
  src/routes/aanvragen.tsx
  src/routes/rapport.tsx
  src/routes/voorbeeld-rapport.tsx
  src/routes/exclusief.tsx
  src/routes/voorbeeld-badge.tsx
  src/routes/woning.tsx
  src/routes/voor-bedrijven.tsx
  src/routes/installateurs.tsx
  src/routes/aanmelden.tsx
  src/routes/activeren.tsx
  src/routes/wachtlijst.tsx
  src/routes/klant.tsx
  src/routes/beheer.tsx
  src/routes/privacy.tsx
  src/routes/cookies.tsx
  src/routes/api/workspace.ts
  src/routes/api/partner/gate.ts
  src/routes/api/partner/activeren.ts
  src/routes/api/mail/bericht.ts
)
for f in "${files[@]}"; do
  echo "sync $f"
  curl -fsSL "$BASE/$f" -o "$f"
done
chown -R www-data:www-data /opt/matchdesk/data 2>/dev/null || chmod 777 /opt/matchdesk/data
set -a
# shellcheck disable=SC1091
. /etc/matchdesk.env
set +a
export MATCHDESK_VPS=1 VITE_AUTH_ENABLED=true VITE_NATIVE_GOOGLE=true
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-https://www.getmatchdesk.nl}"
export MATCHDESK_DATA=/opt/matchdesk/data
grep -q '^MATCHDESK_DATA=' /etc/matchdesk.env 2>/dev/null || echo 'MATCHDESK_DATA=/opt/matchdesk/data' >> /etc/matchdesk.env
grep -q '^FROM_EMAIL=' /etc/matchdesk.env 2>/dev/null || echo 'FROM_EMAIL=info@getmatchdesk.nl' >> /etc/matchdesk.env
grep -q '^RESEND_API_KEY=' /etc/matchdesk.env 2>/dev/null || echo 'RESEND_API_KEY=' >> /etc/matchdesk.env
grep -q '^MATCHDESK_PUBLIC_URL=' /etc/matchdesk.env 2>/dev/null || echo 'MATCHDESK_PUBLIC_URL=https://www.getmatchdesk.nl' >> /etc/matchdesk.env
NODE_OPTIONS=--max-old-space-size=1536 npm run build
mkdir -p .output/public/higgsfield
cp -f public/higgsfield/* .output/public/higgsfield/ 2>/dev/null || true
cp -f public/home.webp .output/public/home.webp 2>/dev/null || true
systemctl restart matchdesk
echo HERO_DONE
echo GATE_PHOTO

