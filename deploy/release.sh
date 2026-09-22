#!/usr/bin/env bash
# Zet een verse build uit /opt/matchdesk live als nieuwe momentopname.
#
# De dienst draait niet uit /opt/matchdesk maar uit /opt/matchdesk-releases/<tijd>,
# vastgezet via release.conf. Zo blijft de site draaien terwijl er gebouwd wordt,
# ook als een build halverwege mislukt. Dit script kopieert dezelfde onderdelen als
# de huidige momentopname, zet release.conf om en controleert of de site antwoordt.
# Antwoordt hij niet, dan gaat hij terug naar de vorige momentopname.
set -euo pipefail

# Alleen MD_*-variabelen overschrijven de standaard. fix-hero.sh laadt /etc/matchdesk.env
# met export in; een algemene naam als SERVICE of CONF daarin mag hier niets veranderen.
APP="${MD_APP:-/opt/matchdesk}"
RELEASES="${MD_RELEASES:-/opt/matchdesk-releases}"
CONF="${MD_RELEASE_CONF:-/etc/systemd/system/matchdesk.service.d/release.conf}"
BACKUPS="${MD_BACKUPS:-/var/backups/matchdesk}"
HEALTH_URL="${MD_HEALTH_URL:-http://127.0.0.1:3000/api/workspace}"
SERVICE="${MD_SERVICE:-matchdesk}"
MIN_FREE_MB="${MD_MIN_FREE_MB:-1500}"

point_to() {
  printf '[Service]\nWorkingDirectory=%s\n' "$1" > "$CONF"
  systemctl daemon-reload
  systemctl restart "$SERVICE"
}

healthy() {
  for _ in $(seq 1 20); do
    if curl -fs -o /dev/null "$HEALTH_URL"; then return 0; fi
    sleep 1
  done
  return 1
}

CURRENT="$(sed -n 's/^WorkingDirectory=//p' "$CONF" 2>/dev/null || true)"
if [[ -z "$CURRENT" || ! -d "$CURRENT" ]]; then
  # Geen releasesysteem op deze server: gewoon herstarten zoals vroeger.
  systemctl restart "$SERVICE"
  echo "RELEASE geen (release.conf ontbreekt; dienst herstart vanuit $APP)"
  exit 0
fi

FREE="$(df -m --output=avail "$RELEASES" | tail -1 | tr -d ' ')"
if (( FREE < MIN_FREE_MB )); then
  echo "Te weinig schijfruimte voor een nieuwe momentopname: ${FREE} MB vrij, ${MIN_FREE_MB} nodig." >&2
  echo "Ruim oude momentopnames in $RELEASES op. De site draait ongewijzigd door." >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NEW="$RELEASES/$STAMP"

# Data staat buiten de momentopnames, maar nieuwe code kan anders wegschrijven.
if [[ -d "$APP/data" ]]; then
  mkdir -p "$BACKUPS"
  cp -a "$APP/data" "$BACKUPS/data-$STAMP"
fi

# Precies dezelfde onderdelen als de huidige momentopname, niet meer en niet minder.
mkdir "$NEW"
for entry in $(ls -A "$CURRENT"); do
  if [[ ! -e "$APP/$entry" ]]; then
    rm -rf "$NEW"
    echo "Ontbreekt in $APP: $entry. Niets omgezet; de site draait ongewijzigd door." >&2
    exit 1
  fi
  cp -a "$APP/$entry" "$NEW/"
done
chown -R www-data:www-data "$NEW"

point_to "$NEW"
if healthy; then
  echo "RELEASE $NEW (vorige: $CURRENT)"
  exit 0
fi

echo "De nieuwe momentopname antwoordt niet. Terug naar $CURRENT." >&2
point_to "$CURRENT"
if healthy; then
  echo "Teruggezet. De site draait weer op $CURRENT." >&2
else
  echo "Ook de vorige momentopname antwoordt niet. Kijk met: journalctl -u $SERVICE -n 40" >&2
fi
exit 1
