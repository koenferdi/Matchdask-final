#!/usr/bin/env bash
# Zet de homepage-video's op de VPS (geen rebuild nodig).
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main/public/higgsfield
APP=/opt/matchdesk
mkdir -p "$APP/public/higgsfield" "$APP/.output/public/higgsfield"
for f in home-desktop.mp4 home-mobile.mp4 home-desktop-poster.png home-mobile-poster.png; do
  echo "download $f"
  curl -fL --retry 3 -o "$APP/public/higgsfield/$f" "$BASE/$f"
  cp -f "$APP/public/higgsfield/$f" "$APP/.output/public/higgsfield/$f"
done
ls -lh "$APP/.output/public/higgsfield"
echo VIDEO_DONE
