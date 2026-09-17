#!/usr/bin/env bash
# Zet homepage-beelden + video's op de VPS (geen rebuild).
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main
APP=/opt/matchdesk
mkdir -p "$APP/public/higgsfield" "$APP/.output/public/higgsfield"
files=(
  higgsfield/home-desktop.mp4
  higgsfield/home-mobile.mp4
  higgsfield/home-desktop-poster.png
  higgsfield/home-mobile-poster.png
  higgsfield/solar.webp
  higgsfield/battery.webp
  higgsfield/installer.webp
  higgsfield/icon-match.png
  higgsfield/icon-quality.png
  higgsfield/icon-region.png
  higgsfield/icon-solar.png
  home.webp
  og.jpg
)
for f in "${files[@]}"; do
  echo "download $f"
  dest_dir="$APP/public/$(dirname "$f")"
  mkdir -p "$dest_dir" "$APP/.output/public/$(dirname "$f")"
  curl -fL --retry 3 -o "$APP/public/$f" "$BASE/public/$f"
  cp -f "$APP/public/$f" "$APP/.output/public/$f"
done
ls -lh "$APP/.output/public/higgsfield"
echo ASSETS_DONE
