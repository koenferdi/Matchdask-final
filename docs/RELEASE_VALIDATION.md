# Matchdesk: gecontroleerde productie-update

Deze repository bevat wijzigingen op de bron die bij PR #8 beschikbaar was. De
repository is geen volledige bouwbare productie-export: onder andere het
projectmanifest, de lockfile en delen van auth/database ontbreken. De publieke
VPS kan een andere of nieuwere indeling hebben. Publiceer deze checkout daarom
niet over `/opt/matchdesk` en gebruik de oude ingepakte installatiebestanden niet
als vervangende productiebron.

`fix-hero.sh` is ingetrokken. `deploy/vps.sh` is uitsluitend een read-only
broncontrole. Een geslaagde controle certificeert geen build, veiligheid of live
werking. Er zijn geen installatie-, restart-, kopieer- of DNS-acties in deze
scripts. Andere historische installatie- en reparatiescripts zijn niet door
deze wijziging beoordeeld en vallen buiten deze releaseprocedure.

## 1. Haal de werkelijke productiebron en indeling op

Laat de beheerder op de bestaande VPS vaststellen welke systemd-unit de app
start, welke `WorkingDirectory`/`ExecStart` actief zijn, waar Nginx naar doorstuurt
en welke commit of bronversie daar draait. Controleer ook of er ongecommitteerde
wijzigingen zijn. Bewaar die als een afzonderlijke patch en bronbackup: geen
`reset --hard`, automatische stash, branch-overschrijving of verwijdering.

Leg de volledige bron vast in een besloten repository of beveiligde snapshot.
Neem manifests, lockfile, configuratie, auth/database-modules, migraties,
startcode, statische assets en de passende dienstdefinitie mee. Geheimen en
klantdossiers blijven buiten Git, PR, chat en buildlogs. Noteer wel welke
configuratiesleutels en datalocaties nodig zijn, zonder hun waarden te delen.

Vergelijk deze wijzigingen met die productiebron. Pas alleen de bedoelde
wijzigingen toe op de actuele bron; gebruik geen losse downloads van `main`.
Pin de definitieve release op een volledige commit-SHA en leg de te beoordelen
diff vast. Bij een afwijkende productie-indeling moet de broncontrole worden
aangepast aan aantoonbaar bestaande imports, niet door ontbrekende modules met
lege bestanden te vervangen.

## 2. Maak en controleer backups vóór een live wijziging

Maak een gedateerde backup van de actieve app/release, de eigen systemd-unit,
alle bijbehorende Nginx-configuratie, `/etc/matchdesk.env` en de werkelijke
persistente opslag. Controleer onder meer `MATCHDESK_DATA`, `PGLITE_DATA_DIR`,
`DATABASE_URL`, JSON-workspace, mailregistratie, uploads en betalingen/facturen.
Ga niet uit van standaardpaden als de actieve configuratie anders is.

Een kopie van een actief databasebestand is niet automatisch herstelbaar.
Gebruik de backupmethode van de werkelijke database; bij bestandopslag moeten
schrijvers tijdens de consistente kopie stilgezet worden of een passende
snapshotmethode beschikbaar zijn. Maak een hersteltest in een afzonderlijke
omgeving. Beveilig de backup zoals de productiegegevens, en controleer dat
ruimte, eigenaar, rechten en restore-instructies kloppen.

Houd de vorige werkende release én haar startconfiguratie beschikbaar. Leg vast
hoe de app teruggaat zonder nieuwe klantgegevens te verliezen. Database- of
prijswijzigingen kunnen een afzonderlijke datamigratie en terugvalplan vragen;
het terugzetten van oude data mag geen nieuwe registraties wissen.

## 3. Bouw en test buiten de actieve directory

Gebruik een nieuwe, schone checkout van de vastgelegde commit, buiten de actieve
app- en datadirectories. Deze minimale check heeft geen productie-effect:

```bash
bash deploy/vps.sh --check /pad/naar/volledige-releasebron VOLLEDIGE_COMMIT_SHA
```

Voer een installatie uit met de bij die volledige bron horende, gecontroleerde
Node/npm-versie en lockfile (`npm ci` voor de hier verwachte npm-layout). Doe dit
en het buildscript uitsluitend in de afzonderlijke buildomgeving; npm-scripts
kunnen code uitvoeren. Geen automatische `npm install`-fallback, pakketupgrade
of shellscript van internet om een mislukte build te omzeilen. Een ontbrekende
buildconfiguratie of import is een blokkade, geen reden om de live app te
overschrijven. Voer de unit-, type- en buildcontroles uit die de volledige bron
voorschrijft; noteer resultaat en commit.

Start de kandidaat apart met testaccounts, kopie-/testdata, een andere lokale
poort en testconfiguratie. Schakel echte uitgaande e-mail, betaalinning en
automatische acties uit of gebruik aantoonbaar sandboxdiensten. De kandidaat
mag geen productiedatabase of live Stripe-geheimen delen. Test de onderstaande
gevallen via de daadwerkelijke serverroutes en het scherm, ook na herladen en
een procesrestart. Een losse unit-test bewijst geen volledige productieflow.

## 4. Acceptatie voor deze bedrijfswijziging

| Onderdeel | Te controleren resultaat |
| --- | --- |
| Login en rollen | Anoniem, consument, partner en beheerder hebben alleen hun eigen rechten. Naam, bedrijfsdomein en browserflags geven geen beheerrechten. De server verifieert sessie en beheerdersidentiteit. |
| E-mailregistratie | Nieuwe e-mail/wachtwoordregistratie is in deze bron gesloten totdat de volledige bron een werkende en geteste verificatiemail biedt. Bestaande login blijft beschikbaar, maar workspace en beheer vereisen een servergeverifieerd e-mailadres. Test ook providerregistratie en herstel van bestaande niet-geverifieerde accounts vóór release. |
| Partnerisolatie | Partner A kan dossiers, status, activering, pauze en capaciteit van partner B niet lezen of aanpassen, ook niet met andere ids of een directe API-call. |
| Intake | Een geldige aanvraag blijft na serverrestart bestaan; ongeldige invoer krijgt een fout. Een mislukte opslag toont geen verzonden of geslaagde intake. Klanttoestemming en doel zijn geregistreerd. |
| Matching | Pauze, activering, product, werkgebied en werkelijke capaciteit bepalen geschiktheid. Geen geschikte partner geeft een wachtstatus. Er wordt niet automatisch een actieve of exclusieve dekking verzonnen. Eén dossier gaat naar één partner tegelijk; herplaatsing vraagt vrijgave en passende klanttoestemming. |
| Contract en prijs | Nieuwe overeenkomsten noemen €175 exclusief btw voor zonnepanelen en €225 voor batterij of oorspronkelijke combinatie. Eén oorspronkelijke opdracht heeft één fee. Vastgelegde oudere en gratis afspraken worden niet stilzwijgend aangepast. Bewaar de geaccepteerde contractversie bij de partner en het dossier. |
| Fee-eligibiliteit | Een nieuwe vaste fee ontstaat pas na voltooide installatie én klantbetaling aan de installateur. Offerte, geaccepteerde lead of alleen status 'gewonnen' zijn onvoldoende. De voorgestelde factuurtermijn is zeven dagen. Alleen bevoegd beheer kan financiële registratie aanpassen; lege browserwaarden wissen geen bestaande financiële historie. |
| Betaalde rapporten/badges | `paid=1`, localStorage, een terugkeer-URL of een lead-id van 0 geven geen betaald recht. Betaling hoort serverzijdig bij de juiste order, koper en product. Afgebroken betaling geeft geen recht. Een geverifieerd server-event of servercontrole bevestigt betaling idempotent. Als dat nog ontbreekt, blijven nieuwe verkoop en checkout gesloten. |
| Woningrapport | Alleen aantoonbaar beschikbare brongegevens worden als gegevens gepresenteerd. Geen panelenaantal, batterijadvies of financiële uitkomst wordt uit een postcode-restwaarde of onbekende invoer verzonnen. Onbekende waarden blijven onbekend. |
| Opvolgdesk | Alleen de eerste drie introductiepilots van Matchdesk in totaal kosten €149 exclusief btw; daarna kost een standaardopdracht €349 exclusief btw. Geen automatische beschikbaarheidsclaim: tarief en opdracht worden vooraf schriftelijk bevestigd, bestaande afspraken blijven gelden. Beide tarieven: 14 dagen, maximaal tien recente geschikte eigen aanvragen, maximaal twee pogingen per dossier en maximaal vier uur totaal inclusief voorbereiding, opvolging en eindrapport. Geen gegarandeerde verkoop, technisch advies of extra matchingfee op dezelfde eigen aanvragen. Start pas met getekende afspraken, geschikte dossiers, werkelijke capaciteit en passende privacy/toestemming. Eén btw-factuurtotaal, twee deelbetalingen: pilot €180,29 inclusief (€90,15 vooraf + €90,14 bij eindrapport); standaard €422,29 inclusief (€211,15 + €211,14). Exclusief btw zijn de helften €74,50 respectievelijk €174,50. Geen automatische verlenging of abonnement. |
| Privacy en foutafhandeling | Alleen nodige gegevens gaan naar de juiste partner. Logout wist de lokale werkcache. Concurrente opslag kan geen stille overschrijving veroorzaken. API- en mailfouten tonen geen vals succes en worden zonder geheimen geregistreerd. |
| Publieke inhoud | Home, partners, voorwaarden, voorbeeldrapport, metadata en portalen spreken elkaar niet tegen. Oude contracthistorie mag blijven bestaan maar wordt niet als nieuwe 10%-prijs verkocht. CTA's bereiken de werkelijke route; mobiel, toetsenbord en formuliervalidatie werken. |

## 5. Publiceer pas de gevalideerde kandidaat

De vaste-feehelpers zijn bouwstenen. Deze gedeeltelijke bron heeft nog geen
volledige flow die schriftelijke contractacceptatie vastlegt, bewijs van
oplevering en klantbetaling controleert en daaruit een factuur aanmaakt. Behandel
de nieuwe prijzen dus niet als automatisch factureerbare afspraken. Ook
gelijktijdige schrijvers en verouderde beheer-snapshots vragen nog een
transactie- of revisiecontrole op de volledige productieopslag; atomair schrijven
voorkomt een half JSON-bestand, maar bewijst geen bescherming tegen verloren updates.

Gebruik de bestaande, vastgestelde deploymentmethode van de VPS. Bereid een
nieuwe release voor; overschrijf de actieve directory niet tijdens de build.
Persistent data en geheimen blijven buiten releasebestanden. Geen
`rsync --delete` over de live tree, geen recursieve chmod/chown op onbekende
app/data en geen `chmod 777`. Rechten volgen de werkelijk ingestelde serviceuser.

Wijzig alleen de Matchdesk-unit of het Matchdesk-vhost als dat nodig is. Bewaar
andere Nginx-sites, `conf.d`, TLS-certificaten en mail/DNS-configuratie. Test een
configuratiewijziging vóór reload; een geslaagde syntaxcheck bewijst nog geen
juiste routing. Een herroepingsknop of betaalflow voor consumenten vraagt een
afzonderlijke inhoudelijke controle van de toepasselijke voorwaarden.

Leg vóór het omschakelen vast welke vorige release start en hoe de switch wordt
teruggedraaid. Voer eventuele migraties als afzonderlijk beoordeelde stappen
uit. Herstart daarna alleen de juiste dienst, controleer health/logs en test de
publieke URL. Geef pas 'live bijgewerkt' door als de publieke inhoud en de
belangrijkste flows daadwerkelijk de vastgelegde release tonen.

## 6. Controleer live en leg de uitkomst vast

Controleer HTTPS, beide relevante hostnamen, redirects, actuele fee/voorwaarden,
Opvolgdesk, login/logout en een beheerde testintake. Controleer geïsoleerde
rechten met de juiste testaccounts, zonder echte klantgegevens te delen of
ongewenste berichten te sturen. Test een betaalflow alleen in de passende
testomgeving voordat productie wordt geopend. Leg screenshots, HTTP-resultaten,
testuitslagen, releasecommit, backup-id en resterende blokkades vast.

Bij uitval, onjuiste rollen, ontbrekende opslag of foutieve fee-/betaalrechten:
sluit de betreffende nieuwe flow, schakel terug naar de vorige werkende release
volgens het vastgelegde plan en controleer behoud van gegevens. Een versie die
bouwt maar deze controles mist, is nog niet volledig geverifieerd.
