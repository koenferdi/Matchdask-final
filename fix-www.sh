#!/usr/bin/env bash
# Stuur getmatchdesk.nl (zonder www) naar www, anders werkt de inlogcookie niet.
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }
CERT=/etc/letsencrypt/live/getmatchdesk.nl
if [[ ! -f "$CERT/fullchain.pem" ]]; then
  CERT=$(ls -d /etc/letsencrypt/live/*/ 2>/dev/null | head -1)
  CERT=${CERT%/}
fi
if [[ ! -f "${CERT}/fullchain.pem" ]]; then
  echo "Geen Let's Encrypt cert gevonden. Nginx ongemoeid."
  exit 0
fi
PUB=/opt/matchdesk/.output/public
BAK="/etc/nginx/nginx.conf.bak.$(date +%s)"
cp -a /etc/nginx/nginx.conf "$BAK" || true
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
    server_name _;
    return 301 https://www.getmatchdesk.nl\$request_uri;
  }
  server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name getmatchdesk.nl;
    ssl_certificate ${CERT}/fullchain.pem;
    ssl_certificate_key ${CERT}/privkey.pem;
    return 301 https://www.getmatchdesk.nl\$request_uri;
  }
  server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name www.getmatchdesk.nl _;
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
if ! nginx -t; then
  echo "Nieuwe nginx-config faalt. Backup terug."
  cp -a "$BAK" /etc/nginx/nginx.conf
  nginx -t
  systemctl start nginx || systemctl restart nginx || true
  exit 1
fi
systemctl restart nginx
echo WWW_DONE
