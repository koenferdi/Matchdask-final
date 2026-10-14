#!/usr/bin/env bash
# Matchdesk safe deploy: curl -sL https://raw.githubusercontent.com/koenferdi/Matchdask-final/main/d.sh | sudo bash
# Repo is an overlay (src/, public/), not a full app: new release = copy of current release + repo overlay.
set -euo pipefail
fail(){ echo "ERROR: $*"; echo FAILED; exit 1; }
[[ "$(id -u)" -eq 0 ]] || fail "run as root"
REL=/opt/matchdesk-releases
CONF=/etc/systemd/system/matchdesk.service.d/release.conf
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
NEW="$REL/$STAMP"
CUR=$(systemctl show -p WorkingDirectory --value matchdesk)
[[ -n "$CUR" && -f "$CUR/package.json" ]] || fail "current release not found ($CUR)"
echo "current: $CUR"; echo "new: $NEW"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
echo "== download main"
curl -fsSL https://codeload.github.com/koenferdi/Matchdask-final/tar.gz/refs/heads/main -o "$TMP/src.tgz" || fail "download"
mkdir "$TMP/x"; tar xzf "$TMP/src.tgz" -C "$TMP/x" --strip-components=1
[[ -d "$TMP/x/src" ]] || fail "no src/ in tarball"
echo "== copy current release (incl. node_modules, untracked runtime files)"
cp -a "$CUR" "$NEW"
rm -rf "$NEW/.output"
echo "== overlay src/ public/ from repo"
cp -a "$TMP/x/src/." "$NEW/src/"
cp -a "$TMP/x/public/." "$NEW/public/"
cd "$NEW"
echo "== reuse node_modules"
[[ -d node_modules ]] || fail "no node_modules in copied release"
echo "== build"
set -a; . /etc/matchdesk.env; set +a
export MATCHDESK_VPS=1 VITE_AUTH_ENABLED=true VITE_NATIVE_GOOGLE=true
export BETTER_AUTH_URL=https://www.getmatchdesk.nl
NODE_OPTIONS=--max-old-space-size=1536 npm run build || fail "build"
mkdir -p .output/public/higgsfield
cp -f public/higgsfield/* .output/public/higgsfield/ 2>/dev/null || true
cp -f public/home.webp .output/public/home.webp 2>/dev/null || true
echo "== sanity"
[[ -f .output/server/index.mjs || -f .output/server/index.js ]] || fail "no .output/server/index"
grep -rqs '225' .output/public || fail "'225' not in build"
if grep -rqs '10% van de dealwaarde' .output/public .output/server; then fail "old '10% van de dealwaarde' still in build"; fi
chown -R root:root "$NEW"; chmod -R a+rX "$NEW"
[[ -d /var/lib/matchdesk ]] && chown -R www-data:www-data /var/lib/matchdesk || true
[[ -d /opt/matchdesk/data ]] && chown -R www-data:www-data /opt/matchdesk/data || true
setrel(){ printf '[Service]\nWorkingDirectory=%s\n' "$1" > "$CONF"; systemctl daemon-reload; systemctl restart matchdesk || true; }
check(){ for i in $(seq 1 30); do c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:3000/ || true); [[ "$c" == 200 ]] && return 0; sleep 1; done; return 1; }
echo "== switch"
cp -a "$CONF" "$CONF.bak.$STAMP"
setrel "$NEW"
if check; then echo "OK $STAMP"; exit 0; fi
echo "new release not healthy, rolling back to $CUR"
journalctl -u matchdesk -n 30 --no-pager || true
setrel "$CUR"
check && echo "rollback healthy" || echo "rollback ALSO unhealthy"
echo FAILED; exit 1
