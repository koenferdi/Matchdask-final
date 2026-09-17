import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { PortalGate } from "@/components/portal-gate";
import { findPartnerFor, runScan, kwh } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/klant")({ component: KlantPage });

function KlantPage() {
  return (
    <PortalGate>
      <Klant />
    </PortalGate>
  );
}

function Klant() {
  const user = useCurrentUser();
  const { leads, partners, requestMatch } = useMatchdesk();
  const email = user?.primaryEmail?.toLowerCase();
  const mine = email ? leads.filter((l) => l.email.toLowerCase() === email) : [];
  const lead = mine[0] ?? (user?.isDevFallback ? leads[0] : undefined);

  if (!lead) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap>
          <PageIntro kicker="Klantportaal" title="Nog geen project.">
            Start met een gratis woningscan. Daarna volg je hier status, volgende stap en afspraken.
          </PageIntro>
          <Button asChild>
            <Link to="/aanvragen">Start woningscan</Link>
          </Button>
        </Wrap>
      </main>
    );
  }

  const scan = runScan(lead);
  const partner = lead.partnerId ? partners.find((p) => p.id === lead.partnerId) : undefined;
  const candidate = findPartnerFor(lead, partners);

  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap>
        <PageIntro kicker="Klantportaal" title={`Welkom, ${lead.name.split(" ")[0]}.`}>
          Jouw energieproject op één plek. Status, volgende stap en afspraakverzoeken.
        </PageIntro>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border border-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl">{lead.product}</h2>
              <span className="rounded-full bg-mint/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal">
                {lead.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {lead.address}, {lead.postcode} {lead.city} · {lead.id}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-paper p-3">
                <small className="text-[11px] uppercase tracking-wider text-muted">Regio</small>
                <strong className="mt-1 block">{scan.region}</strong>
              </div>
              <div className="rounded-md bg-paper p-3">
                <small className="text-[11px] uppercase tracking-wider text-muted">Geschiktheid</small>
                <strong className="mt-1 block capitalize">{scan.suitability}</strong>
              </div>
              <div className="rounded-md bg-paper p-3">
                <small className="text-[11px] uppercase tracking-wider text-muted">Inschatting</small>
                <strong className="mt-1 block">{lead.product === "Thuisbatterij" ? `${scan.batteryKwh} kWh` : kwh(scan.yieldKwh)}</strong>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">{scan.matchHint}</p>
            <ol className="mt-6 space-y-2 text-sm">
              {scan.nextSteps.map((s) => (
                <li key={s} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal" />
                  {s}
                </li>
              ))}
            </ol>
            {lead.status === "Nieuw" ? (
              <Button className="mt-6" onClick={() => requestMatch(lead.id)}>
                Vraag één installateur aan <ArrowRight className="size-4" />
              </Button>
            ) : (
              <div className="mt-6 rounded-md border border-line bg-paper p-4">
                <small className="text-[11px] uppercase tracking-wider text-muted">Jouw installateur</small>
                <strong className="mt-1 block text-lg">{partner?.name ?? candidate?.name ?? "In behandeling"}</strong>
                <p className="text-sm text-muted">Eén bedrijf. Geen offerte-circus.</p>
              </div>
            )}
          </section>
          <aside className="space-y-4">
            <div className="rounded-lg border border-line bg-white p-6">
              <h3 className="font-display text-xl">Fit-rapport</h3>
              <p className="mt-2 text-sm text-muted">Na betaling van €39 staat hier je dossier voor de installateur.</p>
              <Button asChild variant="ghost" className="mt-4 w-full">
                <Link to="/rapport">Open woningrapport</Link>
              </Button>
            </div>
            <div className="rounded-lg border border-line bg-white p-6">
              <h3 className="font-display text-xl">Volgende stap</h3>
              <p className="mt-2 text-sm text-muted">Plan een telefonisch gesprek of bekijk je voorbereiding.</p>
              <Button asChild variant="ghost" className="mt-4 w-full">
                <Link to="/klant/afspraken">Afspraak maken</Link>
              </Button>
            </div>
            {lead.appointment ? (
              <div className="rounded-lg border border-line bg-white p-6">
                <h3 className="font-display text-xl">Afspraak</h3>
                <p className="mt-2 text-sm">
                  {lead.appointment.date} · {lead.appointment.time}
                  <br />
                  <span className="text-muted">{lead.appointment.status}</span>
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </Wrap>
    </main>
  );
}
