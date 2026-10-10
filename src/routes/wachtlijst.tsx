import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { PAUSED_OFFERS_TEXT } from "@/lib/commercial.mjs";

export const Route = createFileRoute("/wachtlijst")({ component: Wachtlijst });
function Wachtlijst() {
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-4xl">
        <PageIntro kicker="Gratis intake · gerichte start" title="De volgende stap die bij je past.">
          De woningintake en matchaanvraag zijn gratis. Een aanvraag geeft geen garantie op een beschikbare installateur; we starten gericht in Breda en omgeving.
        </PageIntro>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-lg border border-line bg-white p-7"><h2 className="font-display text-2xl">Voor jouw woning</h2><p className="mt-3 text-sm text-muted">Vertel je wensen, product en postcode. Gegevens gaan pas met jouw toestemming naar één passende partner tegelijk.</p><Button asChild variant="mint" className="mt-6"><Link to="/aanvragen">Start gratis intake</Link></Button></article>
          <article className="rounded-lg border border-line bg-white p-7"><h2 className="font-display text-2xl">Voor installateurs</h2><p className="mt-3 text-sm text-muted">Gratis aanmelden voor matching. Of bespreek de begrensde Opvolgdesk-pilot voor geschikte aanvragen uit je eigen bestand.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to="/aanmelden">Gratis aanmelden</Link></Button><Button asChild variant="ghost"><Link to="/opvolgdesk">Opvolgdesk-pilot</Link></Button></div></article>
        </div>
        <section className="mt-8 rounded-lg border border-line bg-white p-7"><h2 className="font-display text-2xl">Bestaande rapport- en badgeafspraken</h2><p className="mt-3 text-sm text-muted">{PAUSED_OFFERS_TEXT}</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild variant="ghost"><Link to="/rapport">Hulp bij mijn woningrapport</Link></Button><Button asChild variant="ghost"><Link to="/exclusief">Hulp bij mijn badgekeuring</Link></Button></div></section>
      </Wrap>
    </main>
  );
}
