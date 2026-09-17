import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, Wrap } from "@/components/site-shell";

export const Route = createFileRoute("/cookies")({ component: Cookies });

function Cookies() {
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Cookiebeleid · versie 1.3 · 13 september 2026" title="Cookies en opslag">
          Functionele opslag in je browser. Geen Google Analytics. Geen doorverkoop van gegevens.
        </PageIntro>
        <article className="space-y-6 text-sm leading-7 text-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink">
          <h2>Functionele opslag</h2>
          <p>
            We bewaren een deels ingevuld aanvraagformulier in deze browser. Als je inlogt, bewaart de VPS je aanvraag, partners en nieuwsbrief in Nederland — zodat verwijderen in beheer blijft staan. Inloggen zet een beveiligde sessiecookie. Stripe en Google zetten eigen cookies als jij daar betaalt of inlogt.
          </p>
          <h2>Wat we niet gebruiken</h2>
          <p>Geen Google Analytics. Geen eigen profielbouw buiten wat nodig is voor de bemiddeling.</p>
          <p>
            Meer: zie ons{" "}
            <Link to="/privacy" className="text-teal">
              privacybeleid
            </Link>
            .
          </p>
        </article>
      </Wrap>
    </main>
  );
}
