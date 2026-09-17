import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wrap } from "@/components/site-shell";
import { PathChoice } from "@/components/path-choice";

export const Route = createFileRoute("/voor-bedrijven")({ component: BedrijvenPage });

function BedrijvenPage() {
  return (
    <main className="path-enter bg-night text-paper">
      <PathChoice current="/voor-bedrijven" />
      <section className="py-20">
        <Wrap className="max-w-3xl">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-mint">VOOR INSTALLATEURS · GRATIS AANMELDEN</p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.05]">
            Aanmelden kost niets.
            <br />
            Betalen hoeft niet.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-mint/80">
            Je meldt je bedrijf aan. Matchdesk beoordeelt. Bij toelating krijg je 1:1-aanvragen in jouw postcodes — geen
            veiling, geen inschrijfgeld.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="mint">
              <Link to="/aanmelden">
                Meld je bedrijf aan — gratis <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/login">Ik heb al een account</Link>
            </Button>
          </div>
        </Wrap>
      </section>
      <section className="border-t border-white/8 py-16">
        <Wrap className="grid gap-6 md:grid-cols-3">
          <Card n="1" t="Aanmelden, gratis" d="KvK, vak, werkgebied. Geen betaalmuur." />
          <Card n="2" t="Beoordeling" d="Matchdesk laat toe — of vraagt iets na. Nooit automatisch live." />
          <Card n="3" t="Aanvragen" d="Bij Actief: 1:1-matches in jouw prefixen. Commissie pas als de klus doorgaat." />
        </Wrap>
      </section>
      <section className="py-16">
        <Wrap className="max-w-2xl">
          <h2 className="font-display text-3xl">Wat je wél en niet krijgt</h2>
          <ul className="mt-6 space-y-3 text-sm text-mint/80">
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> Gratis aanmelden en beoordeeld worden</li>
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> 1:1-aanvragen na toelating</li>
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> Eigen bedrijfsportaal</li>
            <li className="flex gap-2"><Check className="size-4 shrink-0 text-bright" /> Geen cc naar concurrenten</li>
          </ul>
        </Wrap>
      </section>
      <section className="border-t border-white/8 py-16">
        <Wrap className="max-w-2xl">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-mint">OPTIONEEL</p>
          <h2 className="mt-3 font-display text-3xl">Exclusief-proof · €149</h2>
          <p className="mt-3 text-mint/75">
            Geen voorwaarde om lid te worden. Alleen als je de publieke badge wilt: een keuring. Betalen zet je niet
            automatisch op de lijst.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="ghost">
              <Link to="/voorbeeld-badge">Wat de badge is</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/exclusief">Meer over de keuring</Link>
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
