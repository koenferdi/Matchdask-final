#!/usr/bin/env bash
set -euo pipefail

# Read-only preflight. The former installer could erase an existing app, data,
# environment and unrelated Nginx sites before discovering incomplete source.
# A production deploy needs the actual VPS layout and the validation below.
usage() {
  cat >&2 <<'MESSAGE'
STOP: dit script installeert of publiceert niet. Er is niets aangepast.
Gebruik: bash deploy/vps.sh --check /pad/naar/volledige-releasebron COMMIT_SHA
COMMIT_SHA moet de volledige, vastgelegde Git-commit zijn (40 hextekens).
Zie docs/RELEASE_VALIDATION.md voor backup, staging, controles en rollback.
MESSAGE
}

if [[ "$#" -ne 3 || "$1" != '--check' ]]; then
  usage
  exit 2
fi

SOURCE_DIR="$2"
EXPECTED_COMMIT="$3"
if [[ ! "$EXPECTED_COMMIT" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo 'STOP: geef een volledige Git-commit op, geen main of branchnaam.' >&2
  exit 1
fi
if [[ ! -d "$SOURCE_DIR" || -L "$SOURCE_DIR" ]]; then
  echo 'STOP: de releasebron moet een bestaande, afzonderlijke directory zijn.' >&2
  exit 1
fi

# Minimum source set for the layout imported by this repository. Passing this
# check is not proof that every import, migration or production flow is valid.
required_files=(
  package.json
  package-lock.json
  vite.config.ts
  deploy/matchdesk.service
  src/lib/auth/server.ts
  src/lib/auth/email-password.ts
  src/lib/auth/gate-session.server.ts
  src/lib/auth/pglite-dialect.ts
  src/lib/auth/preview.ts
  scripts/sign-out-plan.mjs
  migrations/auth/0001_auth.sql
)
missing=0
for file in "${required_files[@]}"; do
  if [[ ! -f "$SOURCE_DIR/$file" || -L "$SOURCE_DIR/$file" ]]; then
    printf 'Ontbrekende of gekoppelde bron: %s\n' "$file" >&2
    missing=1
  fi
done
if [[ ! -f "$SOURCE_DIR/src/lib/db.ts" && ! -f "$SOURCE_DIR/src/lib/db/index.ts" ]]; then
  echo 'Ontbrekende bron: src/lib/db.ts of src/lib/db/index.ts' >&2
  missing=1
fi
if [[ ! -f "$SOURCE_DIR/src/lib/auth/use-current-user.ts" && ! -f "$SOURCE_DIR/src/lib/auth/use-current-user.tsx" ]]; then
  echo 'Ontbrekende bron: src/lib/auth/use-current-user.ts(x)' >&2
  missing=1
fi
if [[ "$missing" -ne 0 ]]; then
  echo 'STOP: onvolledige releasebron. De live app, data, env en Nginx zijn niet aangeraakt.' >&2
  exit 1
fi

command -v git >/dev/null 2>&1 || { echo 'STOP: Git ontbreekt; installeer hier niets automatisch.' >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo 'STOP: Node ontbreekt; installeer hier niets automatisch.' >&2; exit 1; }
SOURCE_ROOT="$(cd "$SOURCE_DIR" && pwd -P)"
GIT_ROOT="$(git -C "$SOURCE_ROOT" rev-parse --show-toplevel)" || { echo 'STOP: de releasebron is geen Git-checkout.' >&2; exit 1; }
if [[ "$SOURCE_ROOT" != "$GIT_ROOT" ]]; then
  echo 'STOP: de bron moet de root van de release-checkout zijn.' >&2
  exit 1
fi
ACTUAL_COMMIT="$(git -C "$SOURCE_ROOT" rev-parse HEAD)"
if [[ "${ACTUAL_COMMIT,,}" != "${EXPECTED_COMMIT,,}" ]]; then
  echo 'STOP: HEAD wijkt af van de vastgelegde releasecommit.' >&2
  exit 1
fi
# Optional Git index refresh is disabled: this preflight must remain read-only.
if [[ -n "$(GIT_OPTIONAL_LOCKS=0 git -C "$SOURCE_ROOT" status --porcelain --untracked-files=all)" ]]; then
  echo 'STOP: de release-checkout heeft lokale wijzigingen of ongevolgde bestanden; bewaar en beoordeel die eerst.' >&2
  exit 1
fi
node - "$SOURCE_ROOT/package.json" "$SOURCE_ROOT/package-lock.json" <<'NODE'
const fs = require('node:fs');
try {
  const pkg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const lock = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  if (typeof pkg.scripts?.build !== 'string' || !pkg.scripts.build.trim()) {
    throw new Error('package.json mist een buildscript');
  }
  if (!Number.isInteger(lock.lockfileVersion) || lock.lockfileVersion < 1) {
    throw new Error('package-lock.json heeft geen geldig lockfileVersion');
  }
} catch (error) {
  console.error(`STOP: ongeldig bronmanifest: ${error.message}`);
  process.exit(1);
}
NODE

printf 'Minimale broncontrole geslaagd voor commit %s.\n' "$ACTUAL_COMMIT"
echo 'Er is niet gebouwd of gedeployd. Productiebron, stagingtests en rollback blijven verplicht.'
