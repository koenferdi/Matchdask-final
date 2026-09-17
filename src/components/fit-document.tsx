import type { ReactNode } from "react";
import { CONTACT, buildFitReport, kwh, type Lead } from "@/lib/matchdesk";

export function FitDocument({ lead, sample = false }: { lead: Lead; sample?: boolean }) {
  const fit = buildFitReport(lead);
  const issued = new Date(lead.createdAt).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <article className="relative overflow-hidden rounded-lg border border-line bg-white text-ink shadow-[var(--shadow-card)]">
      {sample ? (
        <p className="pointer-events-none absolute right-6 top-24 rotate-[-18deg] text-6xl font-display font-semibold text-teal/10">
          VOORBEELD
        </p>
      ) : null}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-night px-6 py-5 text-paper md:px-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-mint">MATCHDESK · FIT-RAPPORT</p>
          <h1 className="mt-1 font-display text-3xl">Dossier {lead.id}</h1>
          <p className="mt-1 text-sm text-mint/70">Voor de installateur · geen offerte</p>
        </div>
        <div className="text-right text-xs text-mint/70">
          <p>Matchdesk · KvK {CONTACT.kvk}</p>
          <p>{CONTACT.email}</p>
          <p>Uitgegeven {issued}</p>
        </div>
      </header>

      <div className="grid gap-0 md:grid-cols-2">
        <Block title="Opdrachtgever">
          <Row k="Naam" v={lead.name} />
          <Row k="E-mail" v={lead.email} />
          <Row k="Telefoon" v={lead.phone} />
          <Row k="Adres" v={`${lead.address}, ${lead.postcode} ${lead.city}`} />
        </Block>
        <Block title="Opdracht">
          <Row k="Product" v={lead.product} />
          <Row k="Termijn" v={lead.term} />
          <Row k="Jaarverbruik" v={lead.usageKwh ? kwh(lead.usageKwh) : "niet opgegeven"} />
          <Row k="Status" v={lead.status} />
        </Block>
        <Block title="Woning">
          <Row k="Dak" v={lead.roofType ?? "niet opgegeven"} />
          <Row k="Richting" v={lead.roofDir ?? "niet opgegeven"} />
          <Row k="Schaduw" v={lead.shade ?? "niet opgegeven"} />
          <Row k="Meterkast" v={lead.meter ?? "niet opgegeven"} />
          <Row k="Bestaande panelen" v={lead.hasSolar ? "Ja" : "Nee / niet opgegeven"} />
        </Block>
        <Block title="Eerste inschatting">
          <Row k="Regio" v={fit.scan.region} />
          <Row k="Netbeheerder" v={fit.operator} />
          <Row k="Geschiktheid" v={fit.scan.suitability} />
          <Row
            k={lead.product === "Thuisbatterij" ? "Batterij (richt)" : "Veld (richt)"}
            v={
              lead.product === "Thuisbatterij"
                ? `${fit.scan.batteryKwh} kWh`
                : `${fit.scan.panels} panelen · ${kwh(fit.scan.yieldKwh)}`
            }
          />
        </Block>
      </div>

      <section className="border-t border-line px-6 py-6 md:px-8">
        <h2 className="font-display text-xl">Briefing voor de schouwing</h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-6 text-muted">
          {fit.brief.map((l) => (
            <li key={l}>— {l}</li>
          ))}
        </ul>
      </section>
      <section className="border-t border-line px-6 py-6 md:px-8">
        <h2 className="font-display text-xl">Checklist ter plaatse</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-muted">
          {fit.installerAsk.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </section>
      <section className="border-t border-line px-6 py-6 md:px-8">
        <h2 className="font-display text-xl">Aandachtspunten</h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-6 text-muted">
          {fit.risks.map((r) => (
            <li key={r}>— {r}</li>
          ))}
        </ul>
      </section>
      <footer className="border-t border-line bg-paper px-6 py-4 text-[11px] leading-5 text-muted md:px-8">
        Matchdesk bemiddelt en installeert niet. Dit document is oriëntatie voor één gesprek met één installateur.
        Geen opbrengstgarantie, geen prijs, geen overeenkomst. De installateur is de contractpartij. KvK {CONTACT.kvk}.
        {sample ? " Dit is een voorbeeld met fictieve persoonsgegevens." : null}
      </footer>
    </article>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-6 py-5 md:px-8">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">{title}</h2>
      <dl className="mt-3 space-y-1.5">{children}</dl>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <dt className="text-muted">{k}</dt>
      <dd className="font-semibold capitalize">{v}</dd>
    </div>
  );
}
