import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wrap } from "@/components/site-shell";
import { PathChoice } from "@/components/path-choice";
import { ProofBadge } from "@/components/proof-badge";

export const Route = createFileRoute("/voor-bedrijven")({ component: BedrijvenPage });

function BedrijvenPage() {
  return (
    <main className="bg-night text-paper">
      <PathChoice current="/voor-bedrijven" />
      <section className="py-20">
        <Wrap className="grid items-center gap-10 lg:grid-cols-[1.2fr_auto]">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.14em] text-mint">VOOR INSTALLATEURS</p>
            <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.05]">
              Jij installeert.
              <br />
              Wij koppelen.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-mint/80">
              Aanvragen in jouw postcodes, één op één. Geen veiling. Je komt pas op de publieke lijst als Matchdesk je
              toelaat — betalen zet je niet automatisch live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="mint">
                <Link to="/aanmelden">
                  Meld je bedrijf aan <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/voorbeeld-badge">Bekijk het badge-pakket</Link>
              </Button>
            </div>
          </div>
          <ProofBadge className="h-40 w-40" />
        </Wrap>
      </section>
      <section className="border-t border-white/8 py-16">
        <Wrap className="grid gap-6 md:grid-cols-4">
          <Card n="1" t="Aanmelden" d="KvK, vak, prefixen. Status: Te beoordelen. Onzichtbaar." />
          <Card n="2" t="Keuring €149" d="Early-bird. Check, geen leadpakket." />
          <Card n="3" t="Toelating" d="Koen zet je op Actief — of niet. Nooit automatisch." />
          <Card n="4" t="Live" d="Lijst + badge. 1:1-aanvragen. Geen volume-garantie." />
        </Wrap>
      </section>
      <section className="py-16">
        <Wrap className="max-w-2xl">
          <h2 className="font-display text-3xl">Wat je wél en niet krijgt</h2>
          <ul className="mt-6 space-y-3 text-sm text-mint/80">
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> 1:1-aanvragen in jouw werkgebied</li>
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> Badge ná toelating</li>
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> Eigen bedrijfsportaal</li>
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> Geen cc naar concurrenten</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="ghost">
              <Link to="/exclusief">Exclusief-proof</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/installateurs">Publieke lijst</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/login">Inloggen</Link>
            </Button>
          </div>
        </Wrap>
      </section>
    </main>
  );
}

function Card({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <article className="rounded-lg border border-white/10 p-5">
      <span className="text-mint/50">0{n}</span>
      <h2 className="mt-2 font-display text-xl">{t}</h2>
      <p className="mt-2 text-sm text-mint/70">{d}</p>
    </article>
  );
}
