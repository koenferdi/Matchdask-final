#!/usr/bin/env bash
# Zet HTTPS naar Matchdesk :3000. Forceert nginx-herstart als reload faalt.
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

systemctl restart matchdesk || true
sleep 1
curl -sf --max-time 3 http://127.0.0.1:3000/ >/dev/null
echo "App :3000 ok  cert=$CERT"

mkdir -p /root/nginx-old
cp -a /etc/nginx/nginx.conf /root/nginx-old/nginx.conf.$(date +%s) || true

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
  access_log /var/log/nginx/access.log;
  error_log /var/log/nginx/error.log;
  server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://www.getmatchdesk.nl\$request_uri;
  }
  server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
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
echo "==> stop oude nginx"
systemctl stop nginx || true
sleep 1
# poorten vrijmaken als een oud proces blijft hangen
fuser -k 80/tcp 443/tcp 2>/dev/null || true
pkill -9 nginx 2>/dev/null || true
sleep 1
rm -f /run/nginx.pid
echo "==> start nginx"
if ! systemctl start nginx; then
  echo "systemctl start faalde. Logs:"
  journalctl -u nginx -n 40 --no-pager || true
  nginx -t || true
  ss -lptn | grep -E ':80|:443|:3000' || true
  exit 1
fi
sleep 1
systemctl is-active nginx
echo "==> poorten"
ss -lptn | grep -E ':80|:443|:3000' || true
echo "==> localhost:3000"
curl -sI --max-time 3 http://127.0.0.1:3000/login | head -6
echo "==> https via nginx"
curl -sk --max-time 5 -o /tmp/login.html -w "https_http:%{http_code}\n" --resolve www.getmatchdesk.nl:443:127.0.0.1 https://www.getmatchdesk.nl/login
if grep -q 'identity.js' /tmp/login.html 2>/dev/null; then
  echo "FOUT: nginx serveert nog identity.js"
  exit 1
fi
echo "markers:"
grep -oiE 'identity.js|style.css|/assets/|Doorgaan met Google|Ik zoek een installateur' /tmp/login.html 2>/dev/null | sort | uniq || true
echo DONE
