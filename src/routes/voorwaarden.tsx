import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, Wrap } from "@/components/site-shell";
import { CONTACT } from "@/lib/matchdesk";

export const Route = createFileRoute("/voorwaarden")({
  head: () => ({
    meta: [
      { title: "Voorwaarden voor huiseigenaren · Matchdesk" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: Voorwaarden,
});

function Voorwaarden() {
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Voorwaarden · 20 september 2026" title="Voorwaarden voor huiseigenaren">
          Wat je van Matchdesk mag verwachten als bemiddelingsplatform.
        </PageIntro>
        <article className="space-y-6 text-sm leading-7 text-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
          <h2>1. Wie we zijn</h2>
          <p>
            Matchdesk is een bemiddelingsplatform, KvK {CONTACT.kvk}. Wij voeren zelf geen installaties uit en leveren geen producten.
          </p>
          <h2>2. Wat Matchdesk doet</h2>
          <p>
            Je dient een aanvraag in. Wij koppelen die aan precies één aangesloten installateur in jouw regio. Is er niemand beschikbaar, dan laten we je dat weten.
          </p>
          <h2>3. Geen overeenkomst tot installatie</h2>
          <p>
            De overeenkomst voor product en installatie sluit je uitsluitend met de installateur. Matchdesk is daar geen partij in.
          </p>
          <h2>4. Kosten</h2>
          <p>
            De basisscan en matchaanvraag zijn gratis. Het uitgebreide woningrapport kost optioneel €39 eenmalig. Je kiest dit apart en ziet het totaal vóór betaling. Wij ontvangen volgens de samenwerking commissie van de installateur als een opdracht tot stand komt.
          </p>
          <h2>5. Het uitgebreide woningrapport</h2>
          <p>
            Na bevestigde betaling open je het rapport bij jouw dossier. Het bevat persoonlijke aandachtspunten, scenario's met zichtbare aannames, een checklist en offertevragen. Het is geen schouwing, technisch ontwerp, financieel advies of opbrengstgarantie. Met hetzelfde geverifieerde e-mailadres kun je jouw dossier op een ander apparaat openen.
          </p>
          <p>
            Werkt de toegang of levering niet? Neem contact op via{" "}
            <a className="text-teal" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> en vermeld je dossiernummer. Betaal niet opnieuw. We zoeken de betaling en levering na.
          </p>
          <p>
            Voor consumenten geldt bij een online aankoop in beginsel 14 dagen bedenktijd. Het openen van dit rapport vraagt hier geen afstand van die bedenktijd. Neem voor herroeping contact met ons op en vermeld je bestelling. Je wettelijke rechten blijven gelden.{" "}
            <a className="text-teal" href="https://consument.acm.nl/aankoop-dienst-annuleren/bedenktijd">
              Meer over bedenktijd bij ACM ConsuWijzer
            </a>
            .
          </p>
          <h2>6. Geen resultaatgarantie</h2>
          <p>Wij garanderen geen offerte, prijs, beschikbaarheid of planning.</p>
          <p>
            Partnervoorwaarden voor installateurs:{" "}
            <Link to="/voorwaarden-installateurs" className="text-teal">
              lees de installateursvoorwaarden
            </Link>
            .
          </p>
        </article>
      </Wrap>
    </main>
  );
}
