#!/usr/bin/env bash
# Vervangt nginx.conf volledig zodat HTTPS alleen naar Matchdesk :3000 gaat.
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }

CERT=/etc/letsencrypt/live/getmatchdesk.nl
if [[ ! -f "$CERT/fullchain.pem" ]]; then
  CERT=/etc/letsencrypt/live/www.getmatchdesk.nl
fi
if [[ ! -f "$CERT/fullchain.pem" ]]; then
  echo "Geen certificaat."
  ls /etc/letsencrypt/live || true
  exit 1
fi

systemctl restart matchdesk
sleep 1
curl -sf --max-time 3 http://127.0.0.1:3000/ >/dev/null
echo "App :3000 ok  cert=$CERT"

mkdir -p /root/nginx-old
cp -a /etc/nginx/nginx.conf /root/nginx-old/nginx.conf.$(date +%s)

cat >/etc/nginx/nginx.conf <<EOF
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;
events { worker_connections 1024; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  keepalive_timeout 65;
  server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://www.getmatchdesk.nl\$request_uri;
  }
  server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;
    ssl_certificate $CERT/fullchain.pem;
    ssl_certificate_key $CERT/privkey.pem;
    client_max_body_size 12m;
    location / {
      proxy_pass http://127.0.0.1:3000;
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto https;
      proxy_set_header Upgrade \$http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
EOF

nginx -t
systemctl restart nginx
sleep 1

echo "==> luistert"
ss -lptn | grep -E ':80|:443|:3000' || netstat -lptn | grep -E ':80|:443|:3000' || true

echo "==> localhost:3000"
curl -sI --max-time 3 http://127.0.0.1:3000/login | head -8

echo "==> public"
curl -sI --max-time 5 -H 'Host: www.getmatchdesk.nl' https://127.0.0.1/login -k | head -12
curl -sk --max-time 5 https://127.0.0.1/login | grep -oiE 'identity.js|style.css|/assets/|Doorgaan met Google|Welkom terug' | sort | uniq
echo DONE
