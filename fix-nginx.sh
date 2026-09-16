#!/usr/bin/env bash
# Zet HTTPS naar de nieuwe Matchdesk-app (poort 3000) en zet oude Netlify-login uit.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run als root."
  exit 1
fi

echo "==> Dienst"
systemctl restart matchdesk || true
sleep 2
systemctl is-active matchdesk
curl -sf --max-time 3 http://127.0.0.1:3000/ >/dev/null
echo "App op :3000 ok"

CERT_DIR=""
for d in /etc/letsencrypt/live/www.getmatchdesk.nl /etc/letsencrypt/live/getmatchdesk.nl; do
  if [[ -f "$d/fullchain.pem" ]]; then CERT_DIR="$d"; break; fi
done
if [[ -z "$CERT_DIR" ]]; then
  CERT_DIR="$(ls -d /etc/letsencrypt/live/*/ 2>/dev/null | head -1 | tr -d '\n')"
  CERT_DIR="${CERT_DIR%/}"
fi
if [[ -z "$CERT_DIR" || ! -f "$CERT_DIR/fullchain.pem" ]]; then
  echo "Geen Let's Encrypt certificaat gevonden."
  ls -la /etc/letsencrypt/live || true
  exit 1
fi
echo "Cert: $CERT_DIR"

mkdir -p /root/nginx-old
ts="$(date +%s)"
cp -a /etc/nginx/sites-enabled "/root/nginx-old/enabled-$ts" 2>/dev/null || true
cp -a /etc/nginx/conf.d "/root/nginx-old/confd-$ts" 2>/dev/null || true

rm -f /etc/nginx/sites-enabled/*
if [[ -d /etc/nginx/conf.d ]]; then
  find /etc/nginx/conf.d -maxdepth 1 -type f -name '*.conf' -exec mv {} /root/nginx-old/ \;
fi

cat >/etc/nginx/sites-available/matchdesk <<EOF
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
  ssl_certificate $CERT_DIR/fullchain.pem;
  ssl_certificate_key $CERT_DIR/privkey.pem;
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
EOF

ln -sfn /etc/nginx/sites-available/matchdesk /etc/nginx/sites-enabled/matchdesk
nginx -t
systemctl reload nginx

echo "==> Check"
curl -sk --max-time 5 -o /tmp/login.html -w "login_http:%{http_code}\n" https://127.0.0.1/login
if grep -q 'identity.js' /tmp/login.html; then
  echo "FOUT: nog oude identity.js"
  exit 1
fi
if grep -qi 'netlify' /tmp/login.html; then
  echo "FOUT: nog Netlify in HTML"
  exit 1
fi
echo "Nieuwe login HTML:"
grep -oE '/assets/[^"]+|Doorgaan met Google|auth' /tmp/login.html | head
echo DONE
