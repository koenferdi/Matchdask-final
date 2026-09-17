import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import {
  CONTACT,
  METERS,
  ROOF_DIRS,
  ROOF_TYPES,
  SHADES,
  STRIPE,
  buildFitReport,
  kwh,
  type Meter,
  type RoofDir,
  type RoofType,
  type Shade,
} from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";
import { useCurrentUser } from "@/lib/auth/use-current-user";

type Search = { paid?: string };

export const Route = createFileRoute("/rapport")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    paid: typeof s.paid === "string" ? s.paid : undefined,
  }),
  component: RapportPage,
});

function RapportPage() {
  const { paid } = Route.useSearch();
  const { leads, reportPaid, markReportPaid, patchLead } = useMatchdesk();
  const user = useCurrentUser();
  useEffect(() => {
    if (paid === "1") markReportPaid();
  }, [paid, markReportPaid]);

  const unlocked = paid === "1" || reportPaid;
  const email = user?.primaryEmail?.toLowerCase();
  const lead =
    (email ? leads.find((l) => l.email.toLowerCase() === email) : undefined) ?? leads[0];
  const [usage, setUsage] = useState(lead?.usageKwh ? String(lead.usageKwh) : "");
  const [roofType, setRoofType] = useState<RoofType | "">(lead?.roofType ?? "");
  const [roofDir, setRoofDir] = useState<RoofDir | "">(lead?.roofDir ?? "");
  const [shade, setShade] = useState<Shade | "">(lead?.shade ?? "");
  const [meter, setMeter] = useState<Meter | "">(lead?.meter ?? "");
  const [hasSolar, setHasSolar] = useState(Boolean(lead?.hasSolar));
  const [note, setNote] = useState(lead?.note ?? "");

  if (!unlocked) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap className="max-w-2xl">
          <PageIntro kicker="Fit-rapport · €39" title="Een dossier voor jouw installateur.">
            Geen glossy brochure. Wel adres, dak, meter, verbruik en de vragen die een vakbedrijf nodig heeft voor de eerste schouwing.
          </PageIntro>
          <Button asChild>
            <a href={STRIPE.woningscan}>Betaal €39 en open het rapport</a>
          </Button>
        </Wrap>
      </main>
    );
  }

  if (!lead) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap className="max-w-2xl">
          <PageIntro kicker="Betaling ontvangen" title="Koppel dit aan je woningscan.">
            Zonder aanvraag kunnen we geen dakrapport maken. Start of open je scan in ditzelfde apparaat.
          </PageIntro>
          <Button asChild>
            <Link to="/aanvragen">Open je woningscan</Link>
          </Button>
        </Wrap>
      </main>
    );
  }

  const fit = buildFitReport(lead);

  function saveExtra(e: React.FormEvent) {
    e.preventDefault();
    patchLead(lead.id, {
      usageKwh: usage ? Number(usage) : undefined,
      roofType: roofType || undefined,
      roofDir: roofDir || undefined,
      shade: shade || undefined,
      meter: meter || undefined,
      hasSolar,
      note: note.trim() || undefined,
    });
  }

  return (
    <main className="bg-paper py-16 text-ink print:py-0">
      <Wrap className="max-w-3xl">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">
          Fit-rapport · {lead.id}
        </p>
        <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)]">Dossier voor de installateur</h1>
        <p className="mt-3 max-w-xl text-muted">
          Gegenereerd uit jouw antwoorden. Geen schouwing, geen offerte, geen opbrengstgarantie. Wél wat het vakbedrijf nodig heeft voor het eerste gesprek.
        </p>

        <section className="mt-8 rounded-lg border border-line bg-white p-6">
          <h2 className="font-display text-2xl">Projectbrief</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {fit.brief.map((l) => (
              <li key={l} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                {l}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat k="Regio / net" v={`${fit.scan.region} · ${fit.operator}`} />
          <Stat k="Geschiktheid" v={fit.scan.suitability} />
          <Stat
            k={lead.product === "Thuisbatterij" ? "Batterij (richt)" : "Veld (richt)"}
            v={lead.product === "Thuisbatterij" ? `${fit.scan.batteryKwh} kWh` : `${fit.scan.panels} panelen · ${kwh(fit.scan.yieldKwh)}`}
          />
        </section>

        <section className="mt-6 rounded-lg border border-line bg-white p-6">
          <h2 className="font-display text-2xl">Vragen voor de schouwing</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            {fit.installerAsk.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-lg border border-line bg-white p-6">
          <h2 className="font-display text-2xl">Aandachtspunten</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {fit.risks.map((r) => (
              <li key={r} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                {r}
              </li>
            ))}
          </ul>
        </section>

        <form onSubmit={saveExtra} className="mt-6 rounded-lg border border-line bg-white p-6 print:hidden">
          <h2 className="font-display text-2xl">Scherp het rapport</h2>
          <p className="mt-2 text-sm text-muted">
            {fit.missing.length
              ? `Nog open: ${fit.missing.join(", ")}. Vul aan — het rapport herberekent meteen.`
              : "Dak- en metergegevens staan erin. Pas ze aan als iets niet klopt."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="field-input" inputMode="numeric" placeholder="Jaarverbruik kWh" value={usage} onChange={(e) => setUsage(e.target.value.replace(/\D/g, ""))} />
            <select className="field-input" value={meter} onChange={(e) => setMeter(e.target.value as Meter)}>
              <option value="">Meterkast</option>
              {METERS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="field-input" value={roofType} onChange={(e) => setRoofType(e.target.value as RoofType)}>
              <option value="">Daktype</option>
              {ROOF_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="field-input" value={roofDir} onChange={(e) => setRoofDir(e.target.value as RoofDir)}>
              <option value="">Dakrichting</option>
              {ROOF_DIRS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="field-input" value={shade} onChange={(e) => setShade(e.target.value as Shade)}>
              <option value="">Schaduw</option>
              {SHADES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-teal" checked={hasSolar} onChange={(e) => setHasSolar(e.target.checked)} />
              Bestaande panelen
            </label>
          </div>
          <textarea className="field-input mt-3 min-h-24" placeholder="Toelichting voor de installateur (optioneel)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" className="mt-4">Rapport bijwerken</Button>
        </form>

        <p className="mt-8 text-xs text-muted">
          Matchdesk bemiddelt, installeert niet. Dit is geen installatieadvies. KvK {CONTACT.kvk}.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <Button type="button" onClick={() => window.print()}>Print / PDF</Button>
          <Button asChild variant="ghost"><Link to="/klant">Klantportaal</Link></Button>
          <Button asChild variant="ghost">
            <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
          </Button>
        </div>
      </Wrap>
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <small className="text-[11px] uppercase tracking-wider text-muted">{k}</small>
      <strong className="mt-1 block font-display text-xl capitalize">{v}</strong>
    </div>
  );
}
