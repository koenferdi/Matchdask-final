#!/usr/bin/env bash
# Download homepage media and let nginx serve /higgsfield/ as static files.
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
BASE=https://raw.githubusercontent.com/koenferdi/Matchdask-final/main
APP=/opt/matchdesk
PUB="$APP/.output/public"
mkdir -p "$APP/public/higgsfield" "$PUB/higgsfield"
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
  mkdir -p "$APP/public/$(dirname "$f")" "$PUB/$(dirname "$f")"
  curl -fL --retry 3 --retry-delay 2 -o "$APP/public/$f" "$BASE/public/$f"
  cp -f "$APP/public/$f" "$PUB/$f"
done
chmod -R a+rX "$APP/public" "$PUB"
ls -lh "$PUB/higgsfield"

CERT=/etc/letsencrypt/live/getmatchdesk.nl
if [[ ! -f "$CERT/fullchain.pem" ]]; then
  CERT=$(ls -d /etc/letsencrypt/live/*/ 2>/dev/null | head -1)
  CERT=${CERT%/}
fi
cp -a /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak.$(date +%s)" || true
cat >/etc/nginx/nginx.conf <<NGX
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
events { worker_connections 1024; }
http {
  sendfile on;
  tcp_nopush on;
  types_hash_max_size 2048;
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  gzip on;
  gzip_types text/plain text/css application/json application/javascript image/svg+xml;
  server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name getmatchdesk.nl www.getmatchdesk.nl _;
    return 301 https://www.getmatchdesk.nl\$request_uri;
  }
  server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name getmatchdesk.nl www.getmatchdesk.nl _;
    ssl_certificate ${CERT}/fullchain.pem;
    ssl_certificate_key ${CERT}/privkey.pem;
    client_max_body_size 20m;
    location /higgsfield/ {
      alias ${PUB}/higgsfield/;
      types { video/mp4 mp4; image/webp webp; image/png png; image/jpeg jpg; }
      add_header Cache-Control "public, max-age=86400";
      add_header Accept-Ranges bytes;
    }
    location = /home.webp { alias ${PUB}/home.webp; }
    location = /og.jpg { alias ${PUB}/og.jpg; }
    location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header Upgrade \$http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
NGX
nginx -t
systemctl restart nginx
echo "solar=$(curl -sI -o /dev/null -w '%{http_code}' http://127.0.0.1/higgsfield/solar.webp || true)"
echo "mp4=$(curl -skI -o /dev/null -w '%{http_code}' https://127.0.0.1/higgsfield/home-desktop.mp4 || true)"
echo ASSETS_DONE
