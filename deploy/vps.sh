#!/usr/bin/env bash
# Matchdesk — één commando op de VPS:
#   curl -fsSL https://raw.githubusercontent.com/koenferdi/getmatchdesk/main/deploy/vps.sh | sudo bash
set -euo pipefail

REPO="${MATCHDESK_REPO:-https://github.com/koenferdi/getmatchdesk.git}"
BRANCH="${MATCHDESK_BRANCH:-main}"
APP_DIR="${MATCHDESK_DIR:-/opt/matchdesk}"
DOMAIN_WWW="${MATCHDESK_WWW:-www.getmatchdesk.nl}"
DOMAIN_APEX="${MATCHDESK_APEX:-getmatchdesk.nl}"
PORT=3000

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run dit commando als root (sudo)."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
echo "==> Pakketten"
apt-get update -qq
apt-get install -y -qq git nginx ca-certificates curl openssl rsync >/dev/null

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE 'v(2[0-9]|1[8-9])'; then
  echo "==> Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs >/dev/null
fi

SELF_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." 2>/dev/null && pwd || true)"
if [[ -n "${SELF_ROOT}" && -f "${SELF_ROOT}/package.json" && -f "${SELF_ROOT}/deploy/vps.sh" ]]; then
  echo "==> Lokale bron"
  mkdir -p "$APP_DIR"
  if [[ "$(readlink -f "$SELF_ROOT")" != "$(readlink -f "$APP_DIR")" ]]; then
    rsync -a --delete --exclude node_modules --exclude .git --exclude .output "$SELF_ROOT"/ "$APP_DIR"/
  fi
elif [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" checkout -B "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  echo "==> Broncode"
  rm -rf "$APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

echo "==> Geheimen"
install -d -m 700 /var/lib/matchdesk/pglite
if [[ ! -f /etc/matchdesk.env ]]; then
  cat >/etc/matchdesk.env <<EOF
NODE_ENV=production
MATCHDESK_VPS=1
VITE_AUTH_ENABLED=true
VITE_NATIVE_GOOGLE=true
BETTER_AUTH_URL=https://${DOMAIN_WWW}
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
PGLITE_DATA_DIR=/var/lib/matchdesk/pglite
PORT=${PORT}
HOST=127.0.0.1
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FROM_EMAIL=info@getmatchdesk.nl
RESEND_API_KEY=
MATCHDESK_PUBLIC_URL=https://${DOMAIN_WWW}
EOF
  chmod 600 /etc/matchdesk.env
else
  grep -q MATCHDESK_VPS /etc/matchdesk.env || echo "MATCHDESK_VPS=1" >> /etc/matchdesk.env
  grep -q VITE_NATIVE_GOOGLE /etc/matchdesk.env || echo "VITE_NATIVE_GOOGLE=true" >> /etc/matchdesk.env
  grep -q '^FROM_EMAIL=' /etc/matchdesk.env || echo 'FROM_EMAIL=info@getmatchdesk.nl' >> /etc/matchdesk.env
  grep -q '^RESEND_API_KEY=' /etc/matchdesk.env || echo 'RESEND_API_KEY=' >> /etc/matchdesk.env
  grep -q '^MATCHDESK_PUBLIC_URL=' /etc/matchdesk.env || echo "MATCHDESK_PUBLIC_URL=https://${DOMAIN_WWW}" >> /etc/matchdesk.env
fi

echo "==> Bouwen"
cd "$APP_DIR"
export MATCHDESK_VPS=1
export VITE_AUTH_ENABLED=true
export VITE_NATIVE_GOOGLE=true
if [[ -f package-lock.json ]]; then
  npm ci --omit=optional || npm install
else
  npm install
fi
NODE_OPTIONS=--max-old-space-size=1536 MATCHDESK_VPS=1 npm run build

echo "==> Rechten"
id www-data >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin www-data
chown -R www-data:www-data "$APP_DIR" /var/lib/matchdesk
chmod -R u+rwX "$APP_DIR" /var/lib/matchdesk

echo "==> Dienst"
cp "$APP_DIR/deploy/matchdesk.service" /etc/systemd/system/matchdesk.service
systemctl daemon-reload
systemctl enable matchdesk
systemctl restart matchdesk

echo "==> Nginx"
SSL_DIR="/etc/letsencrypt/live/${DOMAIN_WWW}"
[[ -d "$SSL_DIR" ]] || SSL_DIR="/etc/letsencrypt/live/${DOMAIN_APEX}"
if [[ -d /etc/nginx/sites-enabled ]]; then
  mkdir -p /root/matchdesk-nginx-backup
  cp -a /etc/nginx/sites-enabled /root/matchdesk-nginx-backup/"$(date +%s)" || true
fi

if [[ -f "$SSL_DIR/fullchain.pem" ]]; then
  cat >/etc/nginx/sites-available/matchdesk <<NGX
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_APEX} ${DOMAIN_WWW};
  return 301 https://${DOMAIN_WWW}\$request_uri;
}
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_APEX};
  ssl_certificate ${SSL_DIR}/fullchain.pem;
  ssl_certificate_key ${SSL_DIR}/privkey.pem;
  return 301 https://${DOMAIN_WWW}\$request_uri;
}
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_WWW};
  ssl_certificate ${SSL_DIR}/fullchain.pem;
  ssl_certificate_key ${SSL_DIR}/privkey.pem;
  client_max_body_size 12m;
  location / {
    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
NGX
else
  cat >/etc/nginx/sites-available/matchdesk <<NGX
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_APEX};
  return 301 http://${DOMAIN_WWW}\$request_uri;
}
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_WWW};
  client_max_body_size 12m;
  location / {
    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGX
fi

ln -sfn /etc/nginx/sites-available/matchdesk /etc/nginx/sites-enabled/matchdesk
rm -f /etc/nginx/sites-enabled/default
# oude vhosts (conf.d + extra sites) mogen HTTPS niet meer vangen
mkdir -p /root/nginx-old
for f in /etc/nginx/sites-enabled/*; do
  b=$(basename "$f")
  [[ "$b" == matchdesk ]] && continue
  mv "$f" /root/nginx-old/ 2>/dev/null || rm -f "$f"
done
if [[ -d /etc/nginx/conf.d ]]; then
  for f in /etc/nginx/conf.d/*.conf; do
    [[ -e "$f" ]] || continue
    mv "$f" /root/nginx-old/ 2>/dev/null || true
  done
fi
nginx -t
systemctl reload nginx

echo "==> Wachten tot Matchdesk antwoordt"
for i in $(seq 1 45); do
  if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/"; then
    echo ""
    echo "Klaar. Site: https://${DOMAIN_WWW}"
    echo "Klanten en bedrijven: e-mail + wachtwoord of Google."
    exit 0
  fi
  sleep 1
done

echo "Dienst startte niet. Logs:"
journalctl -u matchdesk -n 50 --no-pager || true
exit 1
