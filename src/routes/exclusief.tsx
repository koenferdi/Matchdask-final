import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
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
  const { exclusivePaid, markExclusivePaid, partners } = useMatchdesk();
  useEffect(() => {
    if (paid === "1") markExclusivePaid();
  }, [paid, markExclusivePaid]);

  const unlocked = paid === "1" || exclusivePaid;
  const verified = partners.filter((p) => p.status === "Actief" && !p.example && p.exclusivePaid);

  if (!unlocked) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap className="max-w-2xl">
          <PageIntro kicker="Exclusief-proof · €149" title="Keuring voor het netwerk. Geen rapport.">
            Je koopt geen leads en geen brochure. Je koopt een jaarlijkse check: KvK, reviews, werkgebied en of je reageert. Daarna een publieke badge — of niet.
          </PageIntro>
          <ul className="mb-6 space-y-2 text-sm">
            <Line>KvK en bedrijfsgegevens nagelopen</Line>
            <Line>Badge “Exclusief partner · gecontroleerd door Matchdesk”</Line>
            <Line>1:1-aanvragen in jouw prefixen, geen veiling</Line>
            <Line>Geen volume-garantie</Line>
          </ul>
          <Button asChild>
            <a href={STRIPE.exclusief}>Claim early-bird €149</a>
          </Button>
        </Wrap>
      </main>
    );
  }

  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">
          <Shield className="size-4" /> Early-bird ontvangen
        </p>
        <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)]">Je keuring staat klaar.</h1>
        <p className="mt-3 max-w-xl text-muted">
          Betaling is binnen. Matchdesk beoordeelt je bedrijf voordat de badge live gaat. Zolang de status niet Actief is, blijf je uit de publieke lijst.
        </p>
        <section className="mt-8 rounded-lg border border-line bg-white p-6">
          <h2 className="font-display text-2xl">Wat er nu gebeurt</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            <li>Wij checken KvK, reviews en of je werkgebied klopt.</li>
            <li>Jij krijgt Actief of een toelichting wat er nog mist.</li>
            <li>Pas bij Actief verschijn je op de pagina geverifieerde installateurs.</li>
            <li>Aanvragen blijven 1:1. Geen cc naar concurrenten.</li>
          </ol>
        </section>
        {verified.length ? (
          <section className="mt-6 rounded-lg border border-line bg-white p-6">
            <h2 className="font-display text-2xl">Nu in het netwerk</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {verified.map((p) => (
                <li key={p.id}>{p.name} · {p.prefixes.map((x) => `${x}xx`).join(", ")}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/installateurs">Geverifieerde installateurs</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/bedrijf">Bedrijfsportaal</Link>
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
