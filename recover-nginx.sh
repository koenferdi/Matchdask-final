#!/usr/bin/env bash
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "Run als root."; exit 1; }

CERT=/etc/letsencrypt/live/getmatchdesk.nl
[[ -f "$CERT/fullchain.pem" ]] || CERT=/etc/letsencrypt/live/www.getmatchdesk.nl
if [[ ! -f "$CERT/fullchain.pem" ]]; then
  CERT=$(find /etc/letsencrypt/live -name fullchain.pem 2>/dev/null | head -1)
  CERT=${CERT%/*}
fi
if [[ ! -f "${CERT:-/dev/null}/fullchain.pem" ]]; then
  echo "Geen certificaat."
  ls -la /etc/letsencrypt/live || true
  exit 1
fi
echo "CERT=$CERT"

mkdir -p /root/nginx-old
cp -a /etc/nginx/nginx.conf "/root/nginx-old/nginx.conf.$(date +%s)" || true

# Alleen IPv4. Geen http2-parameter. Geen modules-enabled glob.
cat >/etc/nginx/nginx.conf <<EOF
worker_processes auto;
pid /run/nginx.pid;
events { worker_connections 1024; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  keepalive_timeout 65;
  access_log /var/log/nginx/access.log;
  error_log /var/log/nginx/error.log;
  server {
    listen 80 default_server;
    server_name _;
    return 301 https://www.getmatchdesk.nl\$request_uri;
  }
  server {
    listen 443 ssl default_server;
    server_name _;
    ssl_certificate $CERT/fullchain.pem;
    ssl_certificate_key $CERT/privkey.pem;
    client_max_body_size 20m;
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
systemctl stop nginx || true
sleep 1
fuser -k 80/tcp 443/tcp 2>/dev/null || true
pkill -9 nginx 2>/dev/null || true
sleep 1
rm -f /run/nginx.pid
if ! systemctl start nginx; then
  echo "START FAALDE"
  journalctl -u nginx -n 50 --no-pager || true
  nginx -t || true
  ss -lptn | grep -E ':80|:443|:3000' || true
  exit 1
fi
systemctl restart matchdesk || true
systemctl is-active nginx
echo NGINX_OK
