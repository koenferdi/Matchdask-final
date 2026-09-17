import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { STRIPE } from "@/lib/matchdesk";

export const Route = createFileRoute("/wachtlijst")({ component: Wachtlijst });

function Wachtlijst() {
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap>
        <PageIntro kicker="Tijdelijk · early-bird + Woningscan" title="Kies: Woningscan of Exclusief-proof.">
          <p>
            De basis-woningscan is gratis; het uitgebreide rapport kost optioneel <strong>€39</strong>.
            Exclusief-proof: claim nu tijdelijk de early-bird van <strong>€149</strong> i.p.v. €199/jr.
            Afrekenen kan direct online via Stripe.
          </p>
          <p className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#f4e6d0] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber">
              Tijdelijk · early-bird €149
            </span>
            <span className="rounded-full bg-mint/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal">
              Woningrapport €39
            </span>
          </p>
        </PageIntro>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-lg border border-line bg-white p-7 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-sm bg-mint text-teal">
                <Home className="size-5" />
              </div>
              <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold text-teal">B2C · €39</span>
            </div>
            <h2 className="text-2xl">Gratis woningscan</h2>
            <p className="mt-2 font-display text-3xl">
              <strong>€0</strong> <span className="text-base font-normal text-muted">basisresultaat</span>
            </p>
            <p className="mt-3 text-sm text-muted">
              Ontdek je eerste aandachtspunten. Wil je meer verdieping? Kies daarna het uitgebreide woningrapport voor €39 eenmalig.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="size-4 text-teal" />Gratis intake + basisanalyse</li>
              <li className="flex gap-2"><Check className="size-4 text-teal" />Optioneel rapport voor elke installateur</li>
              <li className="flex gap-2"><Check className="size-4 text-teal" />Oriëntatie — geen besparingsgarantie</li>
            </ul>
            <Button asChild variant="mint" className="mt-6 w-full">
              <Link to="/aanvragen">Start gratis woningscan</Link>
            </Button>
            <p className="mt-3 text-xs text-muted">Je start gratis en kiest na het basisresultaat eventueel voor het rapport.</p>
          </article>
          <article className="rounded-lg border border-teal bg-white p-7 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-sm bg-mint text-teal">
                <Shield className="size-5" />
              </div>
              <span className="rounded-full bg-[#f4e6d0] px-2.5 py-1 text-[11px] font-semibold text-amber">B2B · early-bird</span>
            </div>
            <h2 className="text-2xl">Exclusief-proof</h2>
            <p className="mt-2 text-sm text-muted">
              <span className="line-through">normaal €199/jr</span>{" "}
              <strong className="font-display text-3xl text-ink"> nu €149</strong> early-bird
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-md border border-line bg-paper p-3">
              <Shield className="size-8 text-teal" />
              <div>
                <strong>Exclusief partner</strong>
                <small className="block text-muted">gecontroleerd door Matchdesk</small>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">Jaarlijkse kwaliteits- en exclusiviteitskeuring. Badge na geslaagde keuring.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="size-4 text-teal" />Keuring: KvK, reviews, respons-SLA</li>
              <li className="flex gap-2"><Check className="size-4 text-teal" />Publieke badge (site + portaal)</li>
              <li className="flex gap-2"><Check className="size-4 text-teal" />Jaarlijkse herbevestiging exclusiviteit</li>
              <li className="flex gap-2"><Check className="size-4 text-teal" />Sneller richting Vertrouwd (niet automatisch)</li>
              <li className="flex gap-2"><Check className="size-4 text-teal" />Onderscheid vs portal-installateurs</li>
            </ul>
            <p className="mt-4 text-xs text-muted">
              Nodig: status <b>Actief</b> (Gate + KvK + commissie-afspraak). Daarna keuring aanvragen.
            </p>
            <Button asChild className="mt-6 w-full">
              <a href={STRIPE.exclusief}>Claim early-bird · €149</a>
            </Button>
            <p className="mt-3 text-xs text-muted">
              Na betaling: keuringspagina. Al betaald?{" "}
              <Link to="/exclusief" search={{ paid: "1" }} className="font-semibold text-teal">
                Open Exclusief-proof
              </Link>
              . Geen leadvolume-garantie.
            </p>
          </article>
        </div>
        <p className="mt-8 text-sm text-muted">
          Je rekent veilig af op de Stripe-betaalpagina van Matchdesk. Daar zie je de regels en het totaalbedrag voordat je betaalt.
        </p>
      </Wrap>
    </main>
  );
}
