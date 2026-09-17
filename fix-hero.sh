#!/usr/bin/env bash
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
APP=/opt/matchdesk
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main
cd "$APP"
mkdir -p src/routes/api src/lib src/components /opt/matchdesk/data
files=(
  src/components/cinema-hero.tsx
  src/components/auth-form.tsx
  src/components/site-shell.tsx
  src/styles.css
  src/lib/matchdesk.ts
  src/lib/store.ts
  src/lib/blog.ts
  src/lib/workspace-file.ts
  src/lib/owner.ts
  src/routes/index.tsx
  src/routes/aanvragen.tsx
  src/routes/rapport.tsx
  src/routes/exclusief.tsx
  src/routes/installateurs.tsx
  src/routes/aanmelden.tsx
  src/routes/wachtlijst.tsx
  src/routes/klant.tsx
  src/routes/beheer.tsx
  src/routes/privacy.tsx
  src/routes/cookies.tsx
  src/routes/api/workspace.ts
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
NODE_OPTIONS=--max-old-space-size=1536 npm run build
mkdir -p .output/public/higgsfield
cp -f public/higgsfield/* .output/public/higgsfield/ 2>/dev/null || true
cp -f public/home.webp .output/public/home.webp 2>/dev/null || true
systemctl restart matchdesk
echo HERO_DONE
