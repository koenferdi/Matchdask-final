import { Link } from "@tanstack/react-router";
import { COMMISSION_TEXT, MATCH_SLA_TEXT } from "@/lib/commercial.mjs";

/** Partner-facing commercial locks. Same facts as /voorwaarden-installateurs, shorter. */
export function PartnerCommercialFacts() {
  return (
    <div>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>{MATCH_SLA_TEXT}</li>
        <li>{COMMISSION_TEXT}</li>
        <li>Een gewonnen offerte is nog geen verschuldigde fee. Bij annulering vóór oplevering en ontvangen klantbetaling ontstaat geen nieuwe succesfee. Historische contractafspraken worden afzonderlijk gecontroleerd.</li>
        <li>Soft launch West-Brabant: maximaal 8 partnerplekken. Dat is startcapaciteit, geen alleenrecht op Breda.</li>
        <li>Aanmelden en je profiel zijn gratis, zonder lock-in. Na toelating (de Gate) beheer je in het bedrijfsportaal zelf Actief of pauze, en je capaciteit.</li>
      </ul>
      <Link to="/voorwaarden-installateurs" className="mt-4 inline-block font-semibold text-teal">
        Voorwaarden voor installateurs
      </Link>
      <Link to="/opvolgdesk" className="ml-4 mt-4 inline-block font-semibold text-teal">Opvolgdesk-pilot voor bestaande aanvragen</Link>
    </div>
  );
}
