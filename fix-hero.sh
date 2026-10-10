#!/usr/bin/env bash
set -euo pipefail

# The old script downloaded files from a moving main branch directly over the
# running app. This checkout is incomplete; that cannot be a safe release.
cat >&2 <<'MESSAGE'
STOP: fix-hero.sh is ingetrokken. Er zijn geen bestanden of diensten aangepast.
Losse downloads van main mogen /opt/matchdesk niet overschrijven.
Gebruik eerst de volledige actuele productiebron, een vastgelegde commit en
de releasecontrole in docs/RELEASE_VALIDATION.md.
deploy/vps.sh voert uitsluitend een broncontrole uit; het publiceert niets.
MESSAGE
exit 1
