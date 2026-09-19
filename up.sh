#!/usr/bin/env bash
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main
echo "== nginx =="
curl -fsSL "$BASE/recover-nginx.sh" | bash
echo "== app =="
curl -fsSL "$BASE/fix-hero.sh" | bash
echo ALL_DONE
