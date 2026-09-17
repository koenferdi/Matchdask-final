import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wrap } from "@/components/site-shell";
import { ProofBadge } from "@/components/proof-badge";
import { STRIPE } from "@/lib/matchdesk";

export const Route = createFileRoute("/exclusief/voorbeeld")({ component: BadgePakket });

function BadgePakket() {
  return (
    <main className="bg-paper py-12 text-ink">
      <Wrap className="max-w-3xl">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">Voorbeeld · Exclusief-proof</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)]">Het badge-pakket</h1>
        <p className="mt-3 max-w-xl text-muted">
          Geen automatisch vinkje. Je betaalt de keuring. Matchdesk laat toe — of niet. Pas daarna badge én plek op de publieke lijst.
        </p>

        <div className="mt-10 grid items-center gap-8 rounded-lg border border-line bg-night p-8 text-paper md:grid-cols-[auto_1fr]">
          <ProofBadge className="h-36 w-36" />
          <div>
            <p className="text-xs tracking-[0.16em] text-mint">BADGE</p>
            <h2 className="mt-2 font-display text-3xl">Exclusief partner</h2>
            <p className="mt-2 text-sm text-mint/75">Gecontroleerd door Matchdesk · geldig 12 maanden na toelating</p>
          </div>
        </div>

        <ol className="mt-10 space-y-5">
          <Step n="1" t="Aanmelden">
            Bedrijf vult KvK, vakgebied en postcode-prefixen in. Status: Te beoordelen. Niet zichtbaar op de site.
          </Step>
          <Step n="2" t="Betalen (optioneel, €149)">
            Early-bird voor de keuring. Geen leads, geen plaats in een veiling. Alleen de check.
          </Step>
          <Step n="3" t="Koen keurt in Beheer">
            KvK, reviews, werkgebied, of jullie reageren. Uitkomst: Actief, pauzeren of afwijzen. Nooit automatisch.
          </Step>
          <Step n="4" t="Pas bij Actief">
            Naam op /installateurs. Met betaalde keuring: deze badge. 1:1-aanvragen in jullie prefixen. Geen volume-garantie.
          </Step>
        </ol>

        <section className="mt-10 rounded-lg border border-line bg-white p-6">
          <h2 className="font-display text-2xl">Wat de badge wél en niet is</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <Li>Wel: zichtbaar op de publieke lijst en in het portaal</Li>
            <Li>Wel: 1:1-aanvragen, geen cc naar concurrenten</Li>
            <Li>Niet: automatische plaatsing na betaling</Li>
            <Li>Niet: garantie op aantal klussen of omzet</Li>
            <Li>Niet: Matchdesk installeert of verkoopt namens jullie</Li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <a href={STRIPE.exclusief}>Claim early-bird €149</a>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/exclusief">Uitleg keuring</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/installateurs">Publieke lijst</Link>
          </Button>
        </div>
      </Wrap>
    </main>
  );
}

function Step({ n, t, children }: { n: string; t: string; children: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-mint font-display text-lg text-night">{n}</span>
      <div>
        <strong className="block font-display text-xl">{t}</strong>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
    </li>
  );
}

function Li({ children }: { children: string }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-teal" />
      {children}
    </li>
  );
}
