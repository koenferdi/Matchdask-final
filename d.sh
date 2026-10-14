#!/usr/bin/env bash
# Matchdesk safe deploy: curl -sL https://raw.githubusercontent.com/koenferdi/Matchdask-final/main/d.sh | sudo bash
# New release = copy of current release + targeted pricing-text replacement in its own src/ (no repo overlay: live src diverges).
set -euo pipefail
fail(){ echo "ERROR: $*"; echo FAILED; exit 1; }
[[ "$(id -u)" -eq 0 ]] || fail "run as root"
REL=/opt/matchdesk-releases
CONF=/etc/systemd/system/matchdesk.service.d/release.conf
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
NEW="$REL/$STAMP"
CUR=$(systemctl show -p WorkingDirectory --value matchdesk)
[[ -n "$CUR" && -f "$CUR/package.json" ]] || fail "current release not found ($CUR)"
echo "current: $CUR"; echo "new: $NEW"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
echo "== copy current release (incl. node_modules, untracked runtime files)"
cp -a "$CUR" "$NEW"
rm -rf "$NEW/.output"
echo "== targeted pricing-text patch of the live release's own src (no file overlay)"
cd "$NEW"
cat > "$TMP/pairs.json" <<'PRICEJSON'
[
[
"a: \"Als huiseigenaar betaal je Matchdesk niets. Matchdesk ontvangt commissie van de installateur als de klus doorgaat — vaak (deels) vooraf: eerste gewonnen klus €0, daarna 10% van de dealwaarde (max. €400 bij panelen, €600 bij batterij/combi). Jouw prijs en voorwaarden spreek je rechtstreeks met de installateur af.\",",
"a: \"Als huiseigenaar betaal je Matchdesk niets. Matchdesk ontvangt alleen een vast bedrag van de installateur als de opdracht als gewonnen is bevestigd. Founding-tarief: eerste gewonnen klus €0, daarna €225 per batterijklus en €175 per zonnepanelenklus, exclusief btw, voor partners die voor 31 december 2026 tekenen, geldig tot en met 30 juni 2027. Jouw prijs en voorwaarden spreek je rechtstreeks met de installateur af.\","
],
[
"Er gaat nu nog geen activatiemail uit. Die volgt nadat KvK en werkgebied kloppen. Eén lead, één installateur. Na een matchmelding heb je 48 uur om te accepteren of te weigeren. Eerste gewonnen klus €0, daarna 10% van de grondslag, standaard exclusief btw (max. €400 panelen, €600 batterij of combinatie).",
"Er gaat nu nog geen activatiemail uit. Die volgt nadat KvK en werkgebied kloppen. Eén lead, één installateur. Na een matchmelding heb je 48 uur om te accepteren of te weigeren. Founding-tarief: eerste gewonnen klus €0, daarna €225 per batterijklus en €175 per zonnepanelenklus, exclusief btw, voor partners die voor 31 december 2026 tekenen, geldig tot en met 30 juni 2027."
],
[
"\"De commissie blijft los: eerste gewonnen klus €0, daarna 10% van de afgesproken grondslag, standaard exclusief btw (max. €400 bij panelen, €600 bij batterij of combi). Commissie alleen als de opdracht als gewonnen is bevestigd. De huiseigenaar betaalt Matchdesk niets.\",",
"\"De commissie blijft los: eerste gewonnen klus €0, daarna een vast bedrag per gewonnen klus (founding-tarief: €225 per batterijklus, €175 per zonnepanelenklus, exclusief btw, voor partners die voor 31 december 2026 tekenen, geldig tot en met 30 juni 2027). Commissie alleen als de opdracht als gewonnen is bevestigd. De huiseigenaar betaalt Matchdesk niets.\","
],
[
"Commissie rekenen we over de grondslag (standaard exclusief btw). Leg de offertewaarde vast voordat een opdracht als gewonnen wordt bevestigd. Een andere btw-afspraak geldt alleen als die schriftelijk is vastgelegd, en eveneens vóór die bevestiging.",
"Alle bedragen zijn exclusief btw. Een andere afspraak geldt alleen als die schriftelijk is vastgelegd, vóór de bevestiging van de opdracht."
],
[
"Eerste gewonnen klus via Matchdesk: <strong>€0</strong>. Daarna <strong>10%</strong> van de afgesproken grondslag, tot max. <strong>€400</strong> bij panelen en <strong>€600</strong> bij batterij of combinatie. Geen abonnement.",
"Founding-tarief: eerste gewonnen klus via Matchdesk <strong>€0</strong>. Daarna een vast bedrag per gewonnen klus: <strong>€225</strong> per batterijklus en <strong>€175</strong> per zonnepanelenklus, exclusief btw. Dit tarief geldt voor partners die voor 31 december 2026 tekenen en is geldig tot en met 30 juni 2027. Geen abonnement."
],
[
"<li>Eerste gewonnen klus: €0. Daarna 10% van de afgesproken grondslag, standaard exclusief btw (max. €400 panelen, €600 batterij of combinatie). Geen abonnement.</li>",
"<li>Founding-tarief: eerste gewonnen klus €0, daarna €225 per batterijklus en €175 per zonnepanelenklus, exclusief btw. Geldt voor partners die voor 31 december 2026 tekenen, geldig tot en met 30 juni 2027. Geen abonnement.</li>"
],
[
"Eerste gewonnen klus €0, daarna 10% van de grondslag, standaard exclusief btw. Een match is geen garantie op een opdracht.",
"Founding-tarief: eerste gewonnen klus €0, daarna €225 per batterijklus en €175 per zonnepanelenklus, exclusief btw, voor partners die voor 31 december 2026 tekenen, geldig tot en met 30 juni 2027. Een match is geen garantie op een opdracht."
],
[
"\"Eerste gewonnen klus <strong>€0</strong> commissie, daarna <strong>10%</strong> (max €400 panelen / €600 batterij).\";",
"\"Eerste gewonnen klus <strong>€0</strong> commissie, daarna vast <strong>€225</strong> per thuisbatterij-klus en <strong>€175</strong> per zonnepanelen-klus (founding-tarief, excl. btw).\";"
],
[
"\"Eerste gewonnen klus €0 commissie, daarna 10% (max €400 panelen / €600 batterij).\";",
"\"Eerste gewonnen klus €0 commissie, daarna vast €225 per thuisbatterij-klus en €175 per zonnepanelen-klus (founding-tarief, excl. btw).\";"
],
[
"Eerste gewonnen klus €0 commissie, daarna 10% (max €400 panelen / €600 batterij).",
"Founding-tarief: eerste gewonnen klus €0, daarna €225 per batterijklus en €175 per zonnepanelenklus, exclusief btw, voor partners die voor 31 december 2026 tekenen, geldig tot en met 30 juni 2027."
]
]
PRICEJSON
cat > "$TMP/patch.mjs" <<'PATCHJS'
import fs from "node:fs"; import path from "node:path";
const pairs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const root = process.argv[3]; const bakRoot = process.argv[4];
const exts = /\.(tsx?|mjs|js|jsx|md|html|txt)$/;
const leftovers = [/10% van de (afgesproken )?(grondslag|dealwaarde)/, /maximaal\s+€400/, /max\.? ?(<strong>)?€400/, /€600 (bij )?batterij/, /daarna (<strong>)?10%/];
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => { const p = path.join(d, e.name); return e.isDirectory() ? (e.name === "node_modules" ? [] : walk(p)) : exts.test(e.name) ? [p] : []; });
const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
for (const [a, b] of [
  ["Eerste gewonnen klus via Matchdesk: €0. Daarna 10% van de dealwaarde, tot max. €400 bij panelen en €600 bij batterij of combinatie. Geen abonnement.",
   "Eerste gewonnen klus via Matchdesk: €0. Daarna een vast bedrag per gewonnen klus: €225 bij een thuisbatterij en €175 bij zonnepanelen, exclusief btw (founding-tarief voor partners die vóór 31-12-2026 tekenen, geldig tot 30-06-2027). Geen abonnement."],
  ["De commissie blijft los: eerste gewonnen klus €0, daarna 10% van de dealwaarde (max. €400 bij panelen, €600 bij batterij of combi). Dat spreek je vooraf af. De huiseigenaar betaalt Matchdesk niets.",
   "De commissie blijft los: eerste gewonnen klus €0, daarna een vast bedrag per gewonnen klus (€225 bij een thuisbatterij, €175 bij zonnepanelen, excl. btw). Dat spreek je vooraf af. De huiseigenaar betaalt Matchdesk niets."],
  ["daarna geldt 10% van de afgesproken grondslag, maximaal €400 voor panelen en €600 voor batterij/combinatie",
   "daarna geldt een vast bedrag per gewonnen klus: €225 voor een thuisbatterij en €175 voor zonnepanelen, exclusief btw"],
]) pairs.push([new RegExp(esc(a), "g"), b]);
let changed = 0;
for (const f of walk(root)) {
  const orig = fs.readFileSync(f, "utf8"); let s = orig; const hits = [];
  for (const [a, b] of pairs) { if (a instanceof RegExp) { if (a.test(s)) { a.lastIndex = 0; s = s.replace(a, () => b); hits.push(a.source.replace(/\\s\+/g, " ").slice(0, 70)); } } else if (s.includes(a)) { s = s.split(a).join(b); hits.push(a.slice(0, 70)); } }
  const REPL = "een vast bedrag per gewonnen klus (€225 thuisbatterij, €175 zonnepanelen, excl. btw)";
  const CAP = String.raw`(?:tot\s+)?(?:max\.?|maximaal)\s*€\s*400[^.<"'${"`"}{}()]*`;
  const generic = [
    [new RegExp(String.raw`10%\s+(?:van\s+de\s+)?(?:afgesproken\s+)?(?:grondslag|dealwaarde)(?:,?\s*standaard\s+exclusief\s+btw)?(?:\s*\(\s*${CAP}\)|[,;]?\s*${CAP})?`, "gi"), REPL],
    [new RegExp(String.raw`\s*\(\s*${CAP}\)|[,;]?\s*${CAP}`, "gi"), ""],
    [/(daarna)\s+10%(?!\s*<)/gi, (m, d) => d + " " + REPL],
  ];
  for (const [re, rep] of generic) s = s.replace(re, (m, ...rest) => {
    const at = rest[rest.length - 2], src = rest[rest.length - 1];
    console.log("GENERIC " + path.relative(root, f) + "\n   before: " + JSON.stringify(src.slice(Math.max(0, at - 50), at + m.length + 30)) + "\n   after:  " + JSON.stringify(src.slice(Math.max(0, at - 50), at) + (typeof rep === "function" ? rep(m, ...rest) : rep) + src.slice(at + m.length, at + m.length + 30)));
    return typeof rep === "function" ? rep(m, ...rest) : rep;
  });
  if (s !== orig) {
    const bak = path.join(bakRoot, path.relative(root, f)); fs.mkdirSync(path.dirname(bak), { recursive: true }); fs.copyFileSync(f, bak);
    fs.writeFileSync(f, s); changed++;
    console.log("CHANGED " + path.relative(root, f)); for (const h of hits) console.log("   - " + h + "...");
  }
  for (const r of leftovers) { const m = s.match(r); if (m) console.log("WARN old pricing text left in " + path.relative(root, f) + ": " + JSON.stringify(s.slice(Math.max(0, m.index - 60), m.index + 80))); }
}
console.log("files changed: " + changed);
PATCHJS
BAK="$NEW/.pricing-backup-$STAMP"
node "$TMP/patch.mjs" "$TMP/pairs.json" "$NEW/src" "$BAK" || fail "pricing patch"
echo "(originals backed up in $BAK)"
echo "== leftover old pricing in src (if any)"
grep -rnE --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.js' --include='*.jsx' '10% van de (afgesproken )?(dealwaarde|grondslag)|maximaal[[:space:]]+€400' "$NEW/src" || echo "none"
echo "== reuse node_modules"
[[ -d node_modules ]] || fail "no node_modules in copied release"
echo "== repair broken node_modules/.bin symlinks"
for l in node_modules/.bin/*; do
  [[ -L "$l" && ! -e "$l" ]] || continue
  t=$(readlink "$l"); rel=${t##*/node_modules/}
  if [[ "$t" == */node_modules/* && -e "node_modules/$rel" ]]; then ln -sfn "../$rel" "$l"; echo "fixed $l -> ../$rel"; else echo "WARN: broken $l -> $t"; fi
done
[[ -f node_modules/vite/bin/vite.js ]] && ln -sfn ../vite/bin/vite.js node_modules/.bin/vite
echo "== build"
set -a; . /etc/matchdesk.env; set +a
export MATCHDESK_VPS=1 VITE_AUTH_ENABLED=true VITE_NATIVE_GOOGLE=true
export BETTER_AUTH_URL=https://www.getmatchdesk.nl
NODE_OPTIONS=--max-old-space-size=1536 npm run build || fail "build"
mkdir -p .output/public/higgsfield
cp -f public/higgsfield/* .output/public/higgsfield/ 2>/dev/null || true
cp -f public/home.webp .output/public/home.webp 2>/dev/null || true
echo "== sanity"
[[ -f .output/server/index.mjs || -f .output/server/index.js ]] || fail "no .output/server/index"
grep -rqs '225' .output/public || fail "'225' not in build"
if grep -rqs '10% van de dealwaarde' .output/public .output/server; then fail "old '10% van de dealwaarde' still in build"; fi
for pat in 'max. €400' '€600 batterij' '€600 bij batterij' '10% van de afgesproken grondslag' 'maximaal €400'; do
  if grep -rqsF "$pat" .output/public .output/server; then fail "old cap text '$pat' still in build"; fi
done
chown -R root:root "$NEW"; chmod -R a+rX "$NEW"
[[ -d /var/lib/matchdesk ]] && chown -R www-data:www-data /var/lib/matchdesk || true
[[ -d /opt/matchdesk/data ]] && chown -R www-data:www-data /opt/matchdesk/data || true
setrel(){ printf '[Service]\nWorkingDirectory=%s\n' "$1" > "$CONF"; systemctl daemon-reload; systemctl restart matchdesk || true; }
check(){ for i in $(seq 1 30); do c=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:3000/ || true); [[ "$c" == 200 ]] && return 0; sleep 1; done; return 1; }
echo "== switch"
cp -a "$CONF" "$CONF.bak.$STAMP"
setrel "$NEW"
if check; then echo "OK $STAMP"; exit 0; fi
echo "new release not healthy, rolling back to $CUR"
journalctl -u matchdesk -n 30 --no-pager || true
setrel "$CUR"
check && echo "rollback healthy" || echo "rollback ALSO unhealthy"
echo FAILED; exit 1
