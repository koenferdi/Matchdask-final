import { Link } from "@tanstack/react-router";

/** Partner-facing commercial locks. Same facts as /voorwaarden-installateurs, shorter. */
export function PartnerCommercialFacts() {
  return (
    <div>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>Na een matchmelding heb je 48 uur om te accepteren of te weigeren. Zonder reactie mag Matchdesk één andere partner zoeken. Per aanvraag blijft het 1:1.</li>
        <li>Eerste gewonnen klus: €0. Daarna 10% van de afgesproken grondslag, standaard exclusief btw (max. €400 panelen, €600 batterij of combinatie). Geen abonnement.</li>
        <li>Commissie alleen als de opdracht als gewonnen is bevestigd. Annuleert de klant daarna, dan blijft die commissie niet automatisch verschuldigd. Afwijking alleen schriftelijk.</li>
        <li>Soft launch West-Brabant: maximaal 8 partnerplekken. Dat is startcapaciteit, geen alleenrecht op Breda.</li>
        <li>Aanmelden en je profiel zijn gratis, zonder lock-in. Na toelating (de Gate) zet of bevestigt Matchdesk Actief samen met jou. Status en capaciteit worden in het bedrijfsportaal beheerbaar zodra dat scherm live is.</li>
      </ul>
      <Link to="/voorwaarden-installateurs" className="mt-4 inline-block font-semibold text-teal">
        Voorwaarden voor installateurs
      </Link>
    </div>
  );
}
