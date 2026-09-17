#!/usr/bin/env bash
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
APP=/opt/matchdesk
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main
cd "$APP"
curl -fsSL "$BASE/src/components/cinema-hero.tsx" -o src/components/cinema-hero.tsx
curl -fsSL "$BASE/src/styles.css" -o src/styles.css
curl -fsSL "$BASE/src/routes/index.tsx" -o src/routes/index.tsx
set -a
# shellcheck disable=SC1091
. /etc/matchdesk.env
set +a
export MATCHDESK_VPS=1 VITE_AUTH_ENABLED=true VITE_NATIVE_GOOGLE=true
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-https://www.getmatchdesk.nl}"
NODE_OPTIONS=--max-old-space-size=1536 npm run build
# keep media in the new public output
mkdir -p .output/public/higgsfield
cp -f public/higgsfield/* .output/public/higgsfield/ 2>/dev/null || true
cp -f public/home.webp .output/public/home.webp 2>/dev/null || true
systemctl restart matchdesk
echo HERO_DONE
