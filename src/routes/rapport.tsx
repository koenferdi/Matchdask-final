import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { CONTACT, STRIPE, kwh, runScan } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";

type Search = { paid?: string };

export const Route = createFileRoute("/rapport")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    paid: typeof s.paid === "string" ? s.paid : undefined,
  }),
  component: RapportPage,
});

function RapportPage() {
  const { paid } = Route.useSearch();
  const { leads, reportPaid, markReportPaid } = useMatchdesk();
  useEffect(() => {
    if (paid === "1") markReportPaid();
  }, [paid, markReportPaid]);

  const unlocked = paid === "1" || reportPaid;
  const lead = leads[0];

  if (!unlocked) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap className="max-w-2xl">
          <PageIntro kicker="Woningrapport · €39" title="Dit rapport ontstaat na betaling.">
            Na de betaling kom je automatisch hier terug. Het rapport is oriëntatie voor jouw gesprek met één installateur — geen offerte en geen installatieadvies.
          </PageIntro>
          <Button asChild>
            <a href={STRIPE.woningscan}>Betaal €39 en open het rapport</a>
          </Button>
        </Wrap>
      </main>
    );
  }

  const scan = lead ? runScan(lead) : null;

  return (
    <main className="bg-paper py-16 text-ink print:py-0">
      <Wrap className="max-w-3xl">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">Fit-rapport · betaald</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)]">Jouw uitgebreide woningrapport</h1>
        <p className="mt-3 max-w-xl text-muted">
          Dit is het rapport van €39. Neem het mee naar jouw ene installateur. Cijfers zijn een eerste inschatting op basis van postcode en gekozen product — geen belofte.
        </p>

        {lead && scan ? (
          <>
            <section className="mt-8 rounded-lg border border-line bg-white p-6">
              <h2 className="font-display text-2xl">Woning</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Item k="Naam" v={lead.name} />
                <Item k="E-mail" v={lead.email} />
                <Item k="Adres" v={`${lead.address}, ${lead.postcode} ${lead.city}`} />
                <Item k="Product" v={lead.product} />
                <Item k="Termijn" v={lead.term} />
                <Item k="Dossier" v={lead.id} />
              </dl>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat k="Regio" v={scan.region} />
              <Stat k="Geschiktheid" v={scan.suitability} />
              <Stat k={lead.product === "Thuisbatterij" ? "Batterij" : "Opwek (indicatie)"} v={lead.product === "Thuisbatterij" ? `${scan.batteryKwh} kWh` : kwh(scan.yieldKwh)} />
            </section>

            {lead.product !== "Thuisbatterij" ? (
              <section className="mt-6 rounded-lg border border-line bg-white p-6">
                <h2 className="font-display text-2xl">Dak en opwek</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  <Line>Indicatie {scan.panels} panelen op basis van postcode — de installateur telt jouw dakvlakken na.</Line>
                  <Line>Richtopbrengst {kwh(scan.yieldKwh)} per jaar. Oriëntatie, schaduw en helling bepalen het echte getal.</Line>
                  <Line>{scan.matchHint}</Line>
                  <Line>Netcongestie in {scan.region} kan terugleveren beperken. Vraag de installateur naar de netaansluiting.</Line>
                </ul>
              </section>
            ) : null}

            {lead.product !== "Zonnepanelen" ? (
              <section className="mt-6 rounded-lg border border-line bg-white p-6">
                <h2 className="font-display text-2xl">Batterij</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  <Line>Richtgrootte {scan.batteryKwh} kWh. Past bij eigen verbruik in de avond, niet als noodstroomgarantie.</Line>
                  <Line>Laat de installateur rekenen met jouw meterdata voordat je een formaat kiest.</Line>
                </ul>
              </section>
            ) : null}

            <section className="mt-6 rounded-lg border border-line bg-white p-6">
              <h2 className="font-display text-2xl">Meenemen naar de installateur</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
                <li>Dit rapport en je aanvraag {lead.id}.</li>
                <li>Jaarverbruik (kWh) van je laatste energierekening.</li>
                <li>Foto’s van dakvlakken, meterkast en eventuele bestaande omvormer.</li>
                <li>Vraag: wat is de offerte ná schouwing, inclusief netwerkkosten?</li>
              </ol>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-lg border border-line bg-white p-6">
            <h2 className="font-display text-2xl">Betaling ontvangen</h2>
            <p className="mt-3 text-sm text-muted">
              We koppelen het rapport aan je woningscan. Start of open je aanvraag, dan verschijnen hier adres, opwek en voorbereiding.
            </p>
            <Button asChild className="mt-4">
              <Link to="/aanvragen">Open je woningscan</Link>
            </Button>
          </section>
        )}

        <p className="mt-8 text-xs text-muted">
          Matchdesk bemiddelt en installeert niet. Dit rapport is geen installatieadvies, geen offerte en geen garantie op opbrengst of beschikbaarheid van een installateur. KvK {CONTACT.kvk}.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <Button type="button" onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button asChild variant="ghost">
            <Link to="/klant">Naar klantportaal</Link>
          </Button>
          <Button asChild variant="ghost">
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Button>
        </div>
      </Wrap>
    </main>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <small className="text-[11px] uppercase tracking-wider text-muted">{k}</small>
      <strong className="mt-1 block font-display text-2xl capitalize">{v}</strong>
    </div>
  );
}

function Line({ children }: { children: string }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-teal" />
      <span>{children}</span>
    </li>
  );
}
