import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { ProofBadge } from "@/components/proof-badge";
import { CONTACT } from "@/lib/matchdesk";
import { PAUSED_OFFERS_TEXT } from "@/lib/commercial.mjs";

type Search = { paid?: string };
export const Route = createFileRoute("/exclusief")({
  validateSearch: (s: Record<string, unknown>): Search => ({ paid: typeof s.paid === "string" ? s.paid : undefined }),
  component: ExclusiefPage,
});

function ExclusiefPage() {
  const { paid } = Route.useSearch();
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Badgekeuring · bestaande afspraken" title="Een beoordeling volgens afspraak.">
          {PAUSED_OFFERS_TEXT} Gratis aanmelden voor matching blijft mogelijk zonder een badge te kopen.
        </PageIntro>
        <div className="mb-8 flex flex-wrap items-center gap-6 rounded-lg border border-line bg-night p-6 text-paper">
          <ProofBadge className="h-28 w-28" />
          <div><p className="text-xs tracking-wider text-mint">VOORBEELD VAN DE BADGE</p><h2 className="mt-2 font-display text-2xl">Geen bewijs van toelating of betaling.</h2><Link to="/voorbeeld-badge" className="mt-2 inline-block text-sm text-mint">Lees over het bestaande pakket</Link></div>
        </div>
        {paid ? <p className="mb-6 rounded-md border border-line bg-paper p-4 text-sm">Deze terugkeerlink bewijst geen betaling of goedkeuring. Matchdesk controleert je aankoop en keuring afzonderlijk.</p> : null}
        <section className="rounded-lg border border-line bg-white p-7">
          <h2 className="font-display text-2xl">Een keuring gekocht of afgesproken?</h2>
          <p className="mt-3 text-sm leading-7 text-muted">We blijven de overeengekomen beoordeling en levering uitvoeren. Neem contact op met je bedrijfsnaam, bestelling of overeenkomstreferentie. Betaal niet opnieuw. Een betaalde keuring is geen automatisch keurmerk, toegang tot aanvragen of omzetgarantie.</p>
          <p className="mt-3 text-sm text-muted">Alleen een afzonderlijk positief keuringsbesluit geeft recht op de badge voor de afgesproken geldigheid. Matching vraagt gratis aanmelding, toelating en beschikbare capaciteit; de badge geeft daarbij geen voorrang.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button asChild><a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("Bestaande badgekeuring")}`}>Hulp bij mijn keuring</a></Button><Button asChild variant="ghost"><Link to="/aanmelden">Gratis aanmelden</Link></Button><Button asChild variant="ghost"><Link to="/bedrijf">Bedrijfsportaal</Link></Button></div>
        </section>
      </Wrap>
    </main>
  );
}
