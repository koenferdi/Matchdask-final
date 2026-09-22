#!/usr/bin/env bash
# Zet de broncode van een momentopname op de server in een nieuwe git-branch.
#
# Waarom: tussen 20 en 22 september is er rechtstreeks op de server gewerkt (met
# Codex). Dat werk staat alleen in /opt/matchdesk-releases, niet in git. Dit script
# maakt er een branch van, zodat git weer de enige bron is.
#
# Gebruik (als root op de server):
#   bash stand-naar-git.sh [momentopname]
# Standaard: /opt/matchdesk-releases/20260922T095621Z. Er verandert niets aan de site.
set -euo pipefail

RELEASE_DIR="${1:-/opt/matchdesk-releases/20260922T095621Z}"
REPO_URL="${MD_REPO_URL:-https://github.com/koenferdi/Matchdask-final.git}"
# PR #2, de laatste git-versie die de server vanochtend had
BASE_SHA="${MD_BASE_SHA:-551c38c02fc4bc264c265b65337f5479435be5a9}"
BRANCH="${MD_BRANCH:-codex/serverstand-$(basename "$RELEASE_DIR")}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

[[ -d "$RELEASE_DIR/src" ]] || { echo "Geen broncode gevonden in $RELEASE_DIR" >&2; exit 1; }
command -v git >/dev/null || { apt-get update -qq && apt-get install -y -qq git >/dev/null; }

echo "== Kopie maken van $RELEASE_DIR"
mkdir "$WORK/stand"
tar -C "$RELEASE_DIR" \
  --exclude=./node_modules --exclude=./.output --exclude=./data --exclude=./.git \
  --exclude='.env' --exclude='.env.*' --exclude='*.log' \
  -cf - . | tar -C "$WORK/stand" -xf -

echo "== Controleren op geheimen"
# Resend, Stripe (geheime en webhooksleutels), OpenAI, GitHub, AWS, privésleutels en database-URL's met wachtwoord
PATTERN='(re_[A-Za-z0-9_]{20,}|(sk|rk)_(live|test)_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|postgres(ql)?://[^:/ "]+:[^@ "]+@)'
if hits="$(grep -rInE "$PATTERN" "$WORK/stand" 2>/dev/null)"; then
  echo "Mogelijke geheimen gevonden. Er is niets gepusht:" >&2
  printf '%s\n' "$hits" \
    | sed -E "s#^$WORK/stand/##; s/(re_|sk_live_|sk_test_|rk_live_|rk_test_|whsec_|sk-|gh[pousr]_|github_pat_|AKIA)[A-Za-z0-9_-]+/\1****/g; s#(://[^:]+:)[^@]+@#\1****@#g" \
    | cut -c1-160 >&2
  exit 1
fi
big="$(find "$WORK/stand" -type f -size +90M)"
if [[ -n "$big" ]]; then
  echo "Bestanden te groot voor GitHub (max 100 MB). Er is niets gepusht:" >&2
  printf '%s\n' "${big//$WORK\/stand\//}" >&2
  exit 1
fi
echo "   niets gevonden"

if [[ -f "$WORK/stand/scripts/release-vps.mjs" ]]; then
  echo "== Paden in Codex' uitroltool (release-vps.mjs), ter info:"
  grep -oE '"/(opt|root|home|srv|var)/[^"]+"' "$WORK/stand/scripts/release-vps.mjs" | sort -u | sed 's/^/     /' || true
fi

echo "== Branch $BRANCH opbouwen op basis ${BASE_SHA:0:7}"
git init -q "$WORK/repo"
cd "$WORK/repo"
git remote add origin "$REPO_URL"
git fetch -q --depth=1 origin "$BASE_SHA"
git checkout -q -b "$BRANCH" FETCH_HEAD
tar -C "$WORK/stand" -cf - . | tar -C "$WORK/repo" -xf -
git add -A
git -c user.name="koenferdi" -c user.email="96620866+koenferdi@users.noreply.github.com" \
  commit -q -m "Serverstand $(basename "$RELEASE_DIR"): werk van Codex op de VPS" \
  -m "Broncode uit $RELEASE_DIR, zonder node_modules, .output, data en env-bestanden. Basis: ${BASE_SHA:0:7} (PR #2). Dit werk is op de server gedaan en stond niet in git."
git show --stat --format= HEAD | tail -1
ignored="$(git status --short --ignored | sed -n 's/^!! //p')"
[[ -z "$ignored" ]] || { echo "   genegeerd door .gitignore, niet meegenomen:"; printf '     %s\n' $ignored; }

echo "== Pushen"
if [[ "$REPO_URL" == https://* ]]; then
  TOKEN="${MD_TOKEN:-}"
  if [[ -z "$TOKEN" ]]; then
    read -rsp "Plak je GitHub-token (je ziet niets verschijnen) en druk op Enter: " TOKEN < /dev/tty
    echo
  fi
  [[ -n "$TOKEN" ]] || { echo "Geen token ingevoerd. Niets gepusht." >&2; exit 1; }
  git -c credential.helper= push -q "https://x-access-token:${TOKEN}@${REPO_URL#https://}" "HEAD:refs/heads/$BRANCH" 2>&1 | sed "s/${TOKEN}/****/g"
else
  git push -q origin "HEAD:refs/heads/$BRANCH"
fi
echo "KLAAR: branch $BRANCH staat op GitHub. Aan de site is niets veranderd."
