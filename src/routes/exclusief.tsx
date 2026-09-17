import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { ProofBadge } from "@/components/proof-badge";
import { CONTACT, STRIPE } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";

type Search = { paid?: string };

export const Route = createFileRoute("/exclusief")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    paid: typeof s.paid === "string" ? s.paid : undefined,
  }),
  component: ExclusiefPage,
});

function ExclusiefPage() {
  const { paid } = Route.useSearch();
  const { exclusivePaid, markExclusivePaid } = useMatchdesk();
  useEffect(() => {
    if (paid === "1") markExclusivePaid();
  }, [paid, markExclusivePaid]);
  const unlocked = paid === "1" || exclusivePaid;

  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Exclusief-proof · €149" title="Keuring. Daarna pas een badge.">
          Betalen zet je niet automatisch op de site. Koen laat toe — of niet. Alleen Actieve bedrijven staan op de publieke lijst.
        </PageIntro>

        <div className="mb-10 flex flex-wrap items-center gap-6 rounded-lg border border-line bg-night p-6 text-paper">
          <ProofBadge className="h-28 w-28" />
          <div>
            <p className="text-xs tracking-[0.16em] text-mint">DE BADGE</p>
            <h2 className="mt-1 font-display text-2xl">Exclusief partner · gecontroleerd door Matchdesk</h2>
            <Link to="/exclusief/voorbeeld" className="mt-2 inline-block text-sm text-mint underline-offset-4 hover:underline">
              Bekijk het pakket
            </Link>
          </div>
        </div>

        {unlocked ? (
          <p className="mb-8 rounded-md border border-line bg-mint/20 px-4 py-3 text-sm">
            Betaling ontvangen. Je staat nog niet live. Wacht op keuring in Beheer.
          </p>
        ) : null}

        <ol className="space-y-5">
          <li><strong>1. Aanmelden.</strong> KvK, prefixen, vak. Status Te beoordelen — onzichtbaar.</li>
          <li><strong>2. Keuring betalen (€149).</strong> Check, geen leadpakket.</li>
          <li><strong>3. Koen beoordeelt.</strong> Actief, pauze of afwijzen. Nooit automatisch.</li>
          <li><strong>4. Bij Actief:</strong> naam op de lijst. Met keuring: badge. 1:1-aanvragen in jouw gebied. Geen volume-garantie.</li>
        </ol>

        <ul className="mt-8 space-y-2 text-sm">
          <Line>Geen automatische plaatsing na Stripe</Line>
          <Line>Geen veiling, geen cc naar concurrenten</Line>
          <Line>Badge alleen ná toelating</Line>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          {!unlocked ? (
            <Button asChild>
              <a href={STRIPE.exclusief}>Claim early-bird €149</a>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/bedrijf">Naar bedrijfsportaal</Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link to="/exclusief/voorbeeld">Voorbeeld van het pakket</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/aanmelden">Bedrijf aanmelden</Link>
          </Button>
          <Button asChild variant="ghost">
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
          </Button>
        </div>
      </Wrap>
    </main>
  );
}

function Line({ children }: { children: string }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-teal" />
      {children}
    </li>
  );
}
