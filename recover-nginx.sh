#!/usr/bin/env bash
# Zet nginx weer aan zonder http2-parameter (die crasht op nieuwe nginx).
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }

CERT=""
for d in /etc/letsencrypt/live/www.getmatchdesk.nl /etc/letsencrypt/live/getmatchdesk.nl; do
  if [[ -f "$d/fullchain.pem" ]]; then CERT=$d; break; fi
done
if [[ -z "$CERT" ]]; then
  CERT=$(find /etc/letsencrypt/live -name fullchain.pem 2>/dev/null | head -1 | xargs -r dirname)
fi
if [[ -z "${CERT}" || ! -f "${CERT}/fullchain.pem" ]]; then
  echo "Geen cert. Live dirs:"
  ls -la /etc/letsencrypt/live || true
  exit 1
fi
echo "CERT=$CERT"
PUB=/opt/matchdesk/.output/public
mkdir -p "$PUB"

cat >/etc/nginx/nginx.conf <<NGX
user www-data;
worker_processes auto;
pid /run/nginx.pid;
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
systemctl restart matchdesk || true
systemctl is-active nginx
systemctl is-active matchdesk || true
echo NGINX_OK
