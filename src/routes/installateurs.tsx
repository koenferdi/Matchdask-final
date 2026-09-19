import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Check, MapPin, Shield, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wrap } from "@/components/site-shell";
import { SoftLaunchWestBrabant } from "@/components/marketing/soft-launch-west-brabant";
import { useMatchdesk } from "@/lib/store";
import { ProofBadge } from "@/components/proof-badge";

export const Route = createFileRoute("/installateurs")({ component: Installateurs });

function Installateurs() {
  const partners = useMatchdesk((s) => s.partners);
  const verified = partners.filter((p) => p.status === "Actief" && !p.example);
  return (
    <main className="bg-paper text-ink">
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute -right-24 top-0 size-80 rounded-full bg-mint/40 blur-3xl" />
        <Wrap className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-5 flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">
              <span className="h-px w-6 bg-current" />
              Voor ambitieuze installatiebedrijven
            </p>
            <h1 className="text-[clamp(2.4rem,5vw,4.2rem)]">
              Jouw vakwerk.
              <br />
              Onze aandacht.
              <br />
              <span className="text-teal">Meer match.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Exclusieve aanvragen die passen bij je specialisme en werkgebied. Eén overzicht voor je projecten, planning en commissie.
            </p>
            <div className="mt-6">
              <SoftLaunchWestBrabant ctaHref="/aanmelden" taken={0} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="mint">
                <Link to="/aanmelden">Meld je bedrijf aan</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/login" search={{ role: "bedrijf", mode: "inloggen", next: "/bedrijf" }}>
                  Ik heb al een account
                </Link>
              </Button>
            </div>
            <Link to="/bedrijf" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              Bekijk het bedrijfsportaal <ArrowRight className="size-4" />
            </Link>
            <div className="mt-6 flex flex-wrap gap-5 text-sm">
              <span className="inline-flex items-center gap-2"><Check className="size-4 text-teal" />Jij bent de enige</span>
              <span className="inline-flex items-center gap-2"><Check className="size-4 text-teal" />Commissie als de klus doorgaat</span>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <strong>Gemaakt voor jouw bedrijf.</strong>
              <span className="rounded-full bg-mint/50 px-2.5 py-1 text-[11px] font-semibold text-teal">1 : 1</span>
            </div>
            {(
              [
                [MapPin, "Jouw werkgebied", "Ontvang aanvragen uit jouw postcodegebieden."],
                [Shield, "Jouw expertise", "Kwaliteit en specialisme bepalen de aansluiting."],
                [Calendar, "Jouw overzicht", "Aanvragen, afspraken en voortgang op één plek."],
              ] as const satisfies ReadonlyArray<readonly [LucideIcon, string, string]>
            ).map(([Icon, t, d]) => (
              <div key={t} className="mb-4 flex gap-3">
                <div className="flex size-10 items-center justify-center rounded-sm bg-paper text-teal">
                  <Icon className="size-5" />
                </div>
                <div>
                  <strong>{t}</strong>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </div>
            ))}
            <div className="mt-4 border-t border-line pt-4">
              <strong className="text-[15px]">Alleen commissie als de klus doorgaat.</strong>
              <p className="mt-2 text-[13px] text-muted">
                De hoogte en voorwaarden spreken we vooraf samen af. Een match is geen garantie op een opdracht.
              </p>
            </div>
          </div>
        </Wrap>
      </section>
      <section className="pb-20">
        <Wrap>
          <h2 className="mb-8 text-3xl">Een betere basis voor je volgende klus.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01", "Meld je bedrijf aan", "Geef je specialismen, postcodegebieden en beschikbare capaciteit door."],
              ["02", "Laat je kwaliteit zien", "Matchdesk beoordeelt je aansluiting. Een aanmelding is nog geen automatische toelating."],
              ["03", "Werk vanuit je portaal", "Bekijk je matches en planning. Houd je projecten en commissie overzichtelijk bij."],
            ].map(([n, t, d]) => (
              <article key={n} className="rounded-lg border border-line bg-white p-6">
                <div className="mb-4 font-display text-2xl text-teal">{n}</div>
                <h3 className="text-[25px]">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </article>
            ))}
          </div>
          <section className="mt-16">
            <h2 className="text-3xl">Geverifieerde installateurs</h2>
            <p className="mt-2 max-w-xl text-muted">
              Alleen bedrijven die Matchdesk heeft toegelaten. Geen voorbeelden, geen veiling. Exclusief-proof betekent: keuring betaald én Actief.
            </p>
            {verified.length === 0 ? (
              <p className="mt-6 rounded-lg border border-line bg-white p-6 text-sm text-muted">
                Het publieke netwerk is nog leeg. Bedrijven kunnen zich aanmelden; na beoordeling verschijnen ze hier.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {verified.map((p) => (
                  <article key={p.id} className="rounded-lg border border-line bg-white p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-2xl">{p.name}</h3>
                      {p.exclusivePaid ? <ProofBadge className="h-14 w-14" /> : (
                        <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-teal">Actief</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted">{p.products.join(" · ")}</p>
                    <p className="mt-1 text-sm text-muted">Werkgebied {p.prefixes.map((x) => `${x}xx`).join(", ")}</p>
                  </article>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/aanmelden">Meld je bedrijf aan</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/exclusief">Exclusief-proof · €149</Link>
              </Button>
            </div>
          </section>
          <div className="mt-12 rounded-lg bg-night p-8 text-paper md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl">Klaar voor de juiste aanvragen?</h2>
              <p className="mt-2 text-mint/70">Geen leadveiling. Geen race om terug te bellen.</p>
            </div>
            <Button asChild variant="mint" className="mt-4 md:mt-0">
              <Link to="/aanmelden">Meld je bedrijf aan</Link>
            </Button>
          </div>
        </Wrap>
      </section>
    </main>
  );
}
