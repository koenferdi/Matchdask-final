#!/usr/bin/env bash
# 1) nginx weer aan  2) nieuwste Matchdesk-build  — zonder nginx daarna nog te raken
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }

echo "== nginx =="
curl -fsSL "https://raw.githubusercontent.com/koenferdi/Matchdask-final/main/recover-nginx.sh" | bash

echo "== app =="
curl -fsSL "https://raw.githubusercontent.com/koenferdi/Matchdask-final/main/fix-hero.sh" | bash

echo ALL_DONE
