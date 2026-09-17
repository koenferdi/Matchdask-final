import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, Wrap } from "@/components/site-shell";
import { CONTACT } from "@/lib/matchdesk";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Privacy · versie 1.3 · 17 september 2026" title="Privacybeleid">
          Welke persoonsgegevens Matchdesk verwerkt, waarom, op welke grondslag en hoe lang.
        </PageIntro>
        <article className="space-y-6 text-sm leading-7 text-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_strong]:text-ink">
          <p>
            Verwerkingsverantwoordelijke is Matchdesk, KvK {CONTACT.kvk}. Contact:{" "}
            <a className="text-teal" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </p>
          <h2>Wie is verantwoordelijk</h2>
          <p>
            Matchdesk brengt je aanvraag onder bij precies één installateur in jouw regio. Die installateur voert het werk uit en is jouw contractpartij. Matchdesk installeert niet.
          </p>
          <h2>Welke gegevens we verzamelen</h2>
          <p>
            Aanvraag: naam, e-mail, telefoon, adres, postcode, product, termijn, optioneel jaarverbruik, daktype, dakrichting, schaduw, meterkast en of er al panelen liggen. Account: e-mail en naam via Google of e-mail/wachtwoord. Betaling: via Stripe (wij slaan geen kaartnummers op). Nieuwsbrief: e-mail.
          </p>
          <h2>Doelen en grondslagen</h2>
          <p>
            Matching en het Fit-rapport: precontractuele stappen op jouw verzoek (art. 6 lid 1 sub b AVG). Account en beveiliging: gerechtvaardigd belang / overeenkomst. Nieuwsbrief: toestemming. Stripe-betalingen: overeenkomst.
          </p>
          <h2>Wie je gegevens ontvangt</h2>
          <p>
            Eén installateur, nadat jij om een match vraagt. Stripe voor betalingen. Google alleen als jij met Google inlogt. Hosting op onze VPS in de EU. Geen verkoop aan derden, geen leadveiling.
          </p>
          <h2>Bewaartermijn</h2>
          <p>Aanvragen zonder match: na twaalf maanden anonimiseren. Accounts: tot je verwijdert. Betaalgegevens: bij Stripe volgens hun beleid.</p>
          <h2>Je rechten</h2>
          <p>
            Inzage, rectificatie, wissing, beperking, bezwaar, dataportabiliteit en intrekken van toestemming via {CONTACT.email}. Klacht: Autoriteit Persoonsgegevens.
          </p>
        </article>
      </Wrap>
    </main>
  );
}
