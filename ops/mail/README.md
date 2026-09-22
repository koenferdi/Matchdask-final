# Partnermail — activatie, klus, bericht

Outbound partnermail gebruikt de branded HTML-standaard (teal M-mark, wordmark, teal knop, plain-text alt). Afzender: `Matchdesk <info@getmatchdesk.nl>`, tenzij `FROM_EMAIL` anders staat.

De oude Netlify-functie `installer-signup` (set-password naar `/portaal`) hoort niet bij de live site. Aanmelden gaat via `/aanmelden` → `submitPartner` → `POST /api/workspace` met status **Te beoordelen**.

## Flow

1. Installateur meldt zich aan. Status blijft `Te beoordelen`. Er gaat nog geen activatiemail uit.
2. In beheer (Keuring of Bedrijven) kies je **KvK + werkgebied akkoord** / **Stuur activatielink**. Dat is de Gate: acht cijfers KvK én minstens één postcode-prefix.
3. De server mint een eenmalige link (`/activeren?token=…`, 7 dagen) en mailt **Activeer je Matchdesk-account**.
4. Op `/activeren` bevestigt het bedrijf. Pas dan wordt de status `Actief`.
5. Direct daarna gaat de **bevestigingsmail** (*Je Matchdesk-account is actief*). Niet eerder.
6. Een nieuwe match in de cockpit (`POST /api/workspace` door de eigenaar) mailt **Nieuwe klus** naar dat actieve bedrijf. Eén lead, één installateur.
7. **Bericht klaar** bij een gematchte aanvraag mailt **Nieuw bericht**.

Zonder geslaagde activatie zet de server een bedrijf niet op `Actief`, ook niet als de cockpit dat probeert.

## Omgevingsvariabelen

Zet ze in `/etc/matchdesk.env` op de VPS. Niet in git.

| Variabele | Doel |
|---|---|
| `RESEND_API_KEY` | Resend API-sleutel. Zonder sleutel wordt de link wel aangemaakt, maar niet gemaild. De cockpit toont de link dan één keer. |
| `FROM_EMAIL` | Afzender. Standaard `info@getmatchdesk.nl`. Het domein moet bij Resend geverifieerd zijn. |
| `MATCHDESK_PUBLIC_URL` | Basis voor links. Standaard `https://www.getmatchdesk.nl`. |
| `MATCHDESK_DATA` | Map voor `workspace.json` en `mail-ledger.json`. Standaard `/opt/matchdesk/data`. |

`fix-hero.sh` en `deploy/vps.sh` vullen ontbrekende sleutels aan zonder een bestaande `RESEND_API_KEY` te overschrijven.

## Testen

1. Zet `RESEND_API_KEY` en herstart de dienst zodat de env geladen is.
2. Meld een testbedrijf aan op `/aanmelden` (KvK van 8 cijfers, postcode-prefix, contactpersoon).
3. Log in als eigenaar → `/beheer?tab=keuring` → **KvK + werkgebied akkoord**.
4. Open de link uit de mail: `/activeren?token=…`. Controleer de bedrijfsnaam en klik **Activeer account**.
5. Status in beheer wordt `Actief`. De bevestigingsmail komt apart.
6. Match een aanvraag op dat bedrijf. Er volgt een klusmail. Dezelfde toewijzing nog eens opslaan mailt niet opnieuw.
7. Bij die aanvraag: **Bericht klaar**. Een actief bedrijf krijgt de berichtmail; een bedrijf op `Te beoordelen` niet.

Unit tests, zonder netwerk:

```bash
node --test src/lib/mail/core.test.mjs
```

## Cockpit — tab Mail

Alleen eigenaar (`isOwnerEmail`). Tab **Mail** in `/beheer` haalt `GET /api/mail/log` op.

Bronnen in `mail-ledger.json`:

| Bron | Inhoud |
|---|---|
| `outbox[]` | Elke `sendMail`-poging (to, subject, type, status sent/failed/queued) |
| `byPartner` | Activatielink + bevestigingsmail-tijdstempels |
| `sentKeys` | Verzonden klus-/berichtmails |
| `pendingJobs` | Klusmails in wachtrij |

Bekende gaten: geen Resend delivery/open/bounce; activatieregel in de ledger betekent “link aangemaakt”, niet per se “Resend OK”. Nieuwe pogingen vullen `outbox` wel.

Voorbeeld van de registratie/activatie-mail (Pieter, RD Solar Group, demotoken):

- `ops/mail/activatie-registratie.html`
- `ops/mail/activatie-registratie.txt`

Afspraken in elke partnermail: 1 lead · 1 installateur, eerste gewonnen klus €0, daarna 10% (max €400 panelen / €600 batterij). Geen kennismaking-CTA.
