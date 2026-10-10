import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { CONTACT } from "@/lib/matchdesk";
import { COMMERCIAL, euroExVat, opvolgdeskPaymentSchedule } from "@/lib/commercial.mjs";

export const Route = createFileRoute("/opvolgdesk")({
  head: () => ({ meta: [{ title: "Opvolgdesk voor installateurs · Matchdesk" }, { name: "description", content: "Begrensde opvolging van bestaande aanvragen: eerste drie introductiepilots €149, daarna €349 exclusief btw. Heldere scope, persoonlijk afgesproken." }] }),
  component: Opvolgdesk,
});

function Opvolgdesk() {
  const pilot = COMMERCIAL.opvolgdesk;
  const payment = opvolgdeskPaymentSchedule();
  const standardPayment = opvolgdeskPaymentSchedule("standard");
  const subject = encodeURIComponent("Kennismaking Opvolgdesk");
  const body = encodeURIComponent("Hoi Matchdesk,\n\nIk wil bespreken of Opvolgdesk past bij mijn installatiebedrijf en welk tarief van toepassing is.\nBedrijfsnaam:\nContactpersoon:\nZakelijk telefoonnummer:\nAantal recente aanvragen dat opvolging nodig heeft:\n\nIk stuur nu nog geen klantgegevens.\n");
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-4xl">
        <PageIntro kicker="Voor installateurs · Opvolgdesk" title="Laat goede aanvragen niet stilvallen.">
          Matchdesk helpt je bestaande, geschikte aanvragen opvolgen en brengt de volgende stap in beeld. Jij blijft verantwoordelijk voor advies, offerte en uitvoering.
        </PageIntro>
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <section className="rounded-lg border border-line bg-white p-7">
            <h2 className="font-display text-3xl">Veertien dagen, een duidelijke scope.</h2>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              {[
                `Maximaal ${pilot.maxCases} recente, geschikte aanvragen uit jouw eigen klantenbestand.`,
                `Maximaal ${pilot.maxAttemptsPerCase} contactpogingen per dossier en ${pilot.maxDeliveryHours} uur totaal, inclusief voorbereiding, opvolging en eindrapport.`,
                "Opvolging via afgesproken kanalen, met een rechtmatige grondslag voor deze concrete aanvraag.",
                "Een eindrapport per dossier: contactstatus, open vragen en afgesproken vervolgstap.",
                "Geen nieuwe leads, technisch advies of garantie op gesprekken, afspraken of omzet.",
                "Geen aanvullende matchingfee op dezelfde eigen aanvragen.",
              ].map((line) => <li className="flex gap-2" key={line}><Check className="mt-0.5 size-4 shrink-0 text-teal" />{line}</li>)}
            </ul>
          </section>
          <aside className="rounded-lg border border-line bg-night p-7 text-paper">
            <p className="text-xs uppercase tracking-wider text-mint">Introductiepilot · eerste {pilot.introductoryPilots}</p>
            <p className="mt-3 font-display text-4xl">{euroExVat(pilot.priceCents)}</p>
            <p className="mt-1 text-sm text-mint/80">exclusief btw · geen abonnement</p>
            <p className="mt-3 text-sm text-mint/80">Voor de eerste {pilot.introductoryPilots} introductiepilots van Matchdesk in totaal, niet per installateur. We bevestigen vooraf schriftelijk of dit tarief beschikbaar is.</p>
            <p className="mt-5 text-sm text-mint/80">{euroExVat(pilot.depositCents)} exclusief btw vooraf, {euroExVat(pilot.balanceCents)} exclusief btw bij het eindrapport. Factuurtermijn 7 dagen.</p>
            <p className="mt-3 text-xs text-mint/70">Eén factuur met 21% btw: totaal {euroExVat(payment.totalGrossCents)}; {euroExVat(payment.depositGrossCents)} vooraf en {euroExVat(payment.balanceGrossCents)} bij levering.</p>
            <div className="mt-6 border-t border-mint/20 pt-5">
              <p className="text-xs uppercase tracking-wider text-mint">Standaardopdracht na de introductiepilots</p>
              <p className="mt-3 font-display text-4xl">{euroExVat(pilot.standardPriceCents)}</p>
              <p className="mt-1 text-sm text-mint/80">exclusief btw · dezelfde begrensde scope</p>
              <p className="mt-3 text-sm text-mint/80">{euroExVat(standardPayment.depositExVatCents)} exclusief btw vooraf en {euroExVat(standardPayment.balanceExVatCents)} exclusief btw bij het eindrapport. Factuurtermijn 7 dagen.</p>
              <p className="mt-3 text-xs text-mint/70">Eén factuur met 21% btw: totaal {euroExVat(standardPayment.totalGrossCents)}; {euroExVat(standardPayment.depositGrossCents)} vooraf en {euroExVat(standardPayment.balanceGrossCents)} bij levering.</p>
            </div>
            <Button asChild variant="mint" className="mt-6 w-full"><a href={`mailto:${CONTACT.email}?subject=${subject}&body=${body}`}>Bespreek Opvolgdesk <ArrowRight className="size-4" /></a></Button>
            <p className="mt-3 text-xs text-mint/70">Dit opent een concept in je mailprogramma. Een bericht is geen bestelling; er vindt geen automatische betaling plaats.</p>
          </aside>
        </div>
        <section className="mt-8 rounded-lg border border-line bg-white p-7">
          <h2 className="font-display text-2xl">Eerst bepalen of het past.</h2>
          <p className="mt-3 text-sm leading-7 text-muted">We controleren eerst of de aanvragen recent en geschikt zijn, of de gevraagde opvolging is toegestaan en of Matchdesk capaciteit heeft. Start pas na een schriftelijke opdracht met het toepasselijke tarief en passende privacyafspraken. Stuur bij de kennismaking geen klantdossiers mee. Meer dossiers of uren spreken we vooraf apart af; beide tarieven gelden voor een begrensde opdracht.</p>
          <p className="mt-3 text-sm text-muted">Na levering bespreken we resultaat en bestede tijd. Iedere vervolgopdracht wordt apart overeengekomen voor de standaardprijs van {euroExVat(pilot.standardPriceCents)} exclusief btw. Er is geen automatische verlenging of abonnement. Bestaande schriftelijke afspraken blijven gelden.</p>
          <Link to="/voorwaarden-installateurs" className="mt-4 inline-block font-semibold text-teal">Lees scope en betalingsafspraken</Link>
        </section>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild variant="ghost"><Link to="/installateurs">Matching en vaste succesfees</Link></Button><Button asChild variant="ghost"><a href={`mailto:${CONTACT.email}`}>Vragen aan Matchdesk</a></Button></div>
      </Wrap>
    </main>
  );
}
