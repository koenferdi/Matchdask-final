import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wrap } from "@/components/site-shell";
import { PathChoice } from "@/components/path-choice";

export const Route = createFileRoute("/woning")({ component: WoningPage });

function WoningPage() {
  return (
    <main className="bg-night text-paper">
      <PathChoice current="/woning" />
      <section className="py-20">
        <Wrap className="max-w-3xl">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-mint">VOOR JOUW WONING</p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.05]">
            Eén aanvraag.
            <br />
            Eén installateur.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-mint/80">
            Vertel wat je wilt: panelen, batterij of beide. Wij koppelen je aan één bedrijf in jouw regio — geen
            veiling, geen vijf offertes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="mint">
              <Link to="/aanvragen">
                Start je aanvraag <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/voorbeeld-rapport">Voorbeeldrapport</Link>
            </Button>
          </div>
        </Wrap>
      </section>
      <section className="border-t border-white/8 py-16">
        <Wrap className="grid gap-6 md:grid-cols-3">
          <Card n="1" t="Aanvraag" d="Woning, product, postcode. Gratis. Nog geen account nodig." />
          <Card n="2" t="Match" d="Eén installateur. Jij ziet de status pas in je eigen portaal — als je een account maakt." />
          <Card n="3" t="Gesprek" d="Schouwing en offerte met dat bedrijf. Matchdesk installeert niet." />
        </Wrap>
      </section>
      <section className="py-16">
        <Wrap className="max-w-2xl">
          <h2 className="font-display text-3xl">Wat je verder kunt doen</h2>
          <ul className="mt-6 space-y-3 text-sm text-mint/80">
            <Li to="/rapport">Fit-rapport €39 — dossier voor de schouwing</Li>
            <Li to="/tools">Rekenhulp opwek en batterij</Li>
            <Li to="/wachtlijst">Gratis woningscan / wachtlijst</Li>
            <Li to="/login">Account maken om je project te volgen</Li>
          </ul>
        </Wrap>
      </section>
    </main>
  );
}

function Card({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <article className="rounded-lg border border-white/10 p-6">
      <span className="text-mint/50">0{n}</span>
      <h2 className="mt-2 font-display text-2xl">{t}</h2>
      <p className="mt-2 text-sm text-mint/70">{d}</p>
    </article>
  );
}

function Li({ to, children }: { to: "/rapport" | "/tools" | "/wachtlijst" | "/login"; children: string }) {
  return (
    <li>
      <Link to={to} className="inline-flex items-center gap-2 hover:text-mint">
        <Check className="size-4 text-bright" /> {children}
      </Link>
    </li>
  );
}
