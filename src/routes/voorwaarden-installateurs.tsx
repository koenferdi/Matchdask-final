import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, Wrap } from "@/components/site-shell";
import { CONTACT } from "@/lib/matchdesk";
import { COMMISSION_TEXT, MATCH_SLA_TEXT, PAUSED_OFFERS_TEXT, COMMERCIAL, euroExVat, opvolgdeskPaymentSchedule } from "@/lib/commercial.mjs";

export const Route = createFileRoute("/voorwaarden-installateurs")({
  head: () => ({
    meta: [
      { title: "Voorwaarden voor installateurs · Matchdesk" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: VoorwaardenInstallateurs,
});

function VoorwaardenInstallateurs() {
  const pilotPayment = opvolgdeskPaymentSchedule();
  const standardPayment = opvolgdeskPaymentSchedule("standard");
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap className="max-w-3xl">
        <PageIntro kicker="Installateurs · nieuwe afspraken vanaf 8 oktober 2026" title="Voorwaarden voor installateurs">
          Matchdesk bemiddelt, installeert niet. Deze nieuwe tarieven en serviceafspraken gelden pas na schriftelijke overeenstemming. Bestaande afspraken worden niet automatisch vervangen.
        </PageIntro>
        <article className="space-y-6 text-sm leading-7 text-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_strong]:text-ink">
          <h2>Exclusiviteit</h2>
          <p>
            {MATCH_SLA_TEXT}
          </p>
          <h2>Soft launch West-Brabant</h2>
          <p>
            Tijdens de soft launch in West-Brabant zijn er maximaal <strong>8 partnerplekken</strong>. Dat is startcapaciteit voor matching van één aanvraag aan één partner. Het is geen geografisch alleenrecht en geen monopolie op Breda of een andere gemeente.
          </p>
          <h2>Vaste succesfee</h2>
          <p>{COMMISSION_TEXT}</p>
          <p>
            Leg de productcategorie, fee, overeenkomstreferentie en acceptatiedatum vóór de opdracht vast. Matchdesk controleert oplevering en ontvangen klantbetaling voordat de fee wordt gefactureerd. Een gewonnen offerte, voorschot of factuur van de installateur is op zichzelf onvoldoende. Het tarief wordt niet achteraf op historische dossiers toegepast.
          </p>
          <h2>Annulering</h2>
          <p>
            Bij annulering vóór oplevering en ontvangen klantbetaling is voor een nieuwe afspraak geen succesfee verschuldigd. Een historische commissie of factuur beoordelen we volgens de vastgelegde overeenkomst. Correcties en eventuele terugbetaling worden schriftelijk vastgelegd.
          </p>
          <h2>Gratis aanmelden en portaal</h2>
          <p>
            Aanmelden en je profiel zijn gratis. Er is geen abonnement en geen lock-in. Na toelating (de Gate) beheer je in het bedrijfsportaal zelf of je Actief of gepauzeerd bent, en je capaciteit.
          </p>
          <p>
            Matchdesk registreert commissie, uitgereikte facturen en gecontroleerde ontvangsten afzonderlijk. Een factuur is geen bewijs van ontvangen geld.
          </p>
          <h2>Opvolgdesk: introductiepilot en standaardopdracht</h2>
          <p>
            {euroExVat(COMMERCIAL.opvolgdesk.priceCents)} exclusief btw is de introductieprijs voor uitsluitend de eerste {COMMERCIAL.opvolgdesk.introductoryPilots} pilots van Matchdesk in totaal, niet per installateur. Beschikbaarheid en het toepasselijke tarief worden vooraf schriftelijk bevestigd. Daarna kost een standaardopdracht {euroExVat(COMMERCIAL.opvolgdesk.standardPriceCents)} exclusief btw. Beide tarieven gelden voor {COMMERCIAL.opvolgdesk.days} dagen, maximaal {COMMERCIAL.opvolgdesk.maxCases} recente, geschikte aanvragen uit het eigen bestand van de installateur, maximaal {COMMERCIAL.opvolgdesk.maxAttemptsPerCase} contactpogingen per dossier en maximaal {COMMERCIAL.opvolgdesk.maxDeliveryHours} uur totaal inclusief voorbereiding, opvolging en eindrapport. Matchdesk volgt op en levert een statusrapport. Geen nieuwe leads, technische advisering of garantie op afspraken of omzet. Op deze eigen aanvragen rekenen we geen aanvullende matchingfee.
          </p>
          <p>
            De pilot heeft één factuurtotaal van {euroExVat(pilotPayment.totalGrossCents)} inclusief 21% btw: {euroExVat(pilotPayment.depositExVatCents)} exclusief btw vooraf ({euroExVat(pilotPayment.depositGrossCents)} inclusief) en {euroExVat(pilotPayment.balanceExVatCents)} exclusief btw bij het eindrapport ({euroExVat(pilotPayment.balanceGrossCents)} inclusief). De standaardopdracht heeft één factuurtotaal van {euroExVat(standardPayment.totalGrossCents)} inclusief 21% btw: {euroExVat(standardPayment.depositExVatCents)} exclusief btw vooraf ({euroExVat(standardPayment.depositGrossCents)} inclusief) en {euroExVat(standardPayment.balanceExVatCents)} exclusief btw bij het eindrapport ({euroExVat(standardPayment.balanceGrossCents)} inclusief). Betaling binnen 7 dagen; het afrondingsverschil wordt in de laatste deelbetaling verrekend.
          </p>
          <p>
            Start pas na schriftelijke opdracht, geschiktheidscontrole, beschikbare capaciteit en passende privacyafspraken. Alleen contacten met een rechtmatige grondslag voor deze concrete opvolging; dit is geen ongevraagde reclamecampagne. Meer dossiers of uren vereisen vooraf een aparte schriftelijke afspraak. Iedere vervolgopdracht wordt apart overeengekomen; geen automatische verlenging, abonnement of incasso. Bestaande schriftelijke afspraken blijven gelden.
          </p>
          <h2>Bestaande badge- en rapportafspraken</h2>
          <p>{PAUSED_OFFERS_TEXT}</p>
          <p>
            Een eerder gekochte keuring blijft een beoordeling, geen goedkeuring of garantie op opdrachten. De afgesproken levering en geldigheid blijven gelden. Er is geen automatische verlenging of incasso. De badge geeft geen voorrang bij matching; aanmelden en deelnemen vragen geen badgeaankoop.
          </p>
          <h2>Contact met huiseigenaren</h2>
          <p>
            Gebruik gegevens alleen voor de concrete aanvraag en afgesproken opvolging, via de kanalen waarvoor de klant contact heeft gevraagd of toegestaan. Geen hergebruik voor algemene reclame. Deel niet opnieuw met een andere partner zonder vrijgave en toestemming van de klant.
          </p>
          <p>
            Vragen: <a className="text-teal" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
          </p>
        </article>
      </Wrap>
    </main>
  );
}
