import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, Wrap } from "@/components/site-shell";
import { CONTACT } from "@/lib/matchdesk";

export const Route = createFileRoute("/voorwaarden-installateurs")({
  head: () => ({
    meta: [
      { title: "Voorwaarden voor installateurs · Matchdesk" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: VoorwaardenInstallateurs,
});

function VoorwaardenInstallateurs() {
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Installateurs · 25 september 2026" title="Voorwaarden voor installateurs">
          Samenwerking tussen Matchdesk en partners. Matchdesk bemiddelt, installeert niet.
        </PageIntro>
        <article className="space-y-6 text-sm leading-7 text-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_strong]:text-ink">
          <h2>Exclusiviteit</h2>
          <p>
            Een aanvraag gaat naar precies één partner. Na de matchmelding heb je <strong>48 uur</strong> om die aanvraag te accepteren of te weigeren. Reageer je niet binnen die 48 uur, dan mag Matchdesk de aanvraag aan één andere partner toewijzen. Ook dan blijft het één partner per aanvraag.
          </p>
          <h2>Soft launch West-Brabant</h2>
          <p>
            Tijdens de soft launch in West-Brabant zijn er maximaal <strong>8 partnerplekken</strong>. Dat is startcapaciteit voor matching van één aanvraag aan één partner. Het is geen geografisch alleenrecht en geen monopolie op Breda of een andere gemeente.
          </p>
          <h2>Commissie</h2>
          <p>
            Eerste gewonnen klus via Matchdesk: <strong>€0</strong>. Daarna <strong>10%</strong> van de afgesproken grondslag, tot max. <strong>€400</strong> bij panelen en <strong>€600</strong> bij batterij of combinatie. Geen abonnement.
          </p>
          <p>
            Commissie rekenen we over de grondslag (standaard exclusief btw). Leg de offertewaarde vast voordat een opdracht als gewonnen wordt bevestigd. Een andere btw-afspraak geldt alleen als die schriftelijk is vastgelegd, en eveneens vóór die bevestiging.
          </p>
          <h2>Annulering</h2>
          <p>
            Commissie is alleen verschuldigd wanneer de opdracht als gewonnen is bevestigd. Annuleert de klant daarna, dan blijft die commissie niet automatisch verschuldigd. Afwijkingen leggen we alleen schriftelijk vast.
          </p>
          <h2>Gratis aanmelden en portaal</h2>
          <p>
            Aanmelden en je profiel zijn gratis. Er is geen abonnement en geen lock-in. Na toelating (de Gate) beheer je in het bedrijfsportaal zelf of je Actief of gepauzeerd bent, en je capaciteit.
          </p>
          <p>
            Matchdesk registreert commissie, uitgereikte facturen en gecontroleerde ontvangsten afzonderlijk. Een factuur is geen bewijs van ontvangen geld.
          </p>
          <h2>Optionele badgekeuring</h2>
          <p>
            De gepubliceerde early-birdprijs is €149 voor de keuring. Betaling is geen goedkeuring. Voor de badge volgt een afzonderlijke beoordeling van bedrijfsregistratie, vakbekwaamheid, referenties, responsafspraken en exclusiviteit. Je ontvangt een onderbouwde uitkomst in je bedrijfsomgeving.
          </p>
          <p>
            Na goedkeuring is de badge 12 maanden geldig. Bij afwijzing of intrekking wordt geen geldige badge getoond. Bij verlopen geldigheid is een nieuwe beoordeling nodig. Er is geen automatische verlenging of incasso; eventuele nieuwe keuringskosten spreken we vooraf af. De badge geeft geen voorrang bij matching en geen garantie op opdrachten.
          </p>
          <h2>Contact met huiseigenaren</h2>
          <p>
            Gegevens alleen gebruiken voor die ene aanvraag. Bellen mag uitsluitend met uitdrukkelijke toestemming van de huiseigenaar.
          </p>
          <p>
            Vragen: <a className="text-teal" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </p>
        </article>
      </Wrap>
    </main>
  );
}
