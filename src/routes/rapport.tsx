import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { CONTACT } from "@/lib/matchdesk";
import { PAUSED_OFFERS_TEXT } from "@/lib/commercial.mjs";

type Search = { paid?: string };
export const Route = createFileRoute("/rapport")({
  validateSearch: (s: Record<string, unknown>): Search => ({ paid: typeof s.paid === "string" ? s.paid : undefined }),
  component: RapportPage,
});

function RapportPage() {
  const { paid } = Route.useSearch();
  const subject = encodeURIComponent("Toegang tot eerder gekocht woningrapport");
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Woningrapport · bestaande aankopen" title="Hulp bij jouw woningrapport.">
          {PAUSED_OFFERS_TEXT}
        </PageIntro>
        <section className="rounded-lg border border-line bg-white p-7">
          <h2 className="font-display text-2xl">Al gekocht? Betaal niet opnieuw.</h2>
          <p className="mt-3 text-sm leading-7 text-muted">Neem contact op met het e-mailadres van je bestelling en je dossier- of betalingsreferentie. We controleren de betaling en de juiste ontvanger en regelen toegang of levering volgens de gemaakte afspraak. Stuur geen volledige bankafschriften of andere klantdossiers mee.</p>
          {paid ? <p className="mt-4 rounded-md border border-line bg-paper p-4 text-sm">Deze terugkeerlink is geen betalingsbevestiging en opent geen klantdossier. We controleren je aankoop afzonderlijk.</p> : null}
          <p className="mt-3 text-sm text-muted">Het rapport is voorbereiding op een gesprek; geen schouwing, technisch ontwerp, offerte of opbrengstgarantie. Je wettelijke rechten en bestaande leveringsafspraken blijven gelden.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><a href={`mailto:${CONTACT.email}?subject=${subject}`}>Vraag toegang of levering</a></Button>
            <Button asChild variant="ghost"><Link to="/klant">Klantportaal</Link></Button>
            <Button asChild variant="ghost"><Link to="/voorbeeld-rapport">Fictief voorbeeldrapport</Link></Button>
          </div>
        </section>
        <p className="mt-6 text-xs text-muted">Matchdesk bemiddelt, installeert niet. KvK {CONTACT.kvk}.</p>
      </Wrap>
    </main>
  );
}
