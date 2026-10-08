import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { PortalGate } from "@/components/portal-gate";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { Partner } from "@/lib/matchdesk";
import { findOwnPartner, isMatchablePartner, selfServeView } from "@/lib/partner-portal.mjs";
import { useMatchdesk } from "@/lib/store";

export const Route = createFileRoute("/bedrijf")({
  head: () => ({
    meta: [
      { title: "Bedrijfsportaal · Matchdesk" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BedrijfPage,
});

function BedrijfPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="bg-paper py-16">
        <Wrap>
          <div className="h-40 animate-pulse rounded-lg bg-line/60" />
        </Wrap>
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login" search={{ role: "bedrijf", mode: "inloggen", next: "/bedrijf" }} />;
  }
  return (
    <PortalGate>
      <Bedrijf email={user.primaryEmail?.toLowerCase() ?? ""} name={user.displayName ?? ""} />
    </PortalGate>
  );
}

function Bedrijf({ email, name }: { email: string; name: string }) {
  const partners = useMatchdesk((s) => s.partners);
  const ready = useMatchdesk((s) => s.ready);
  const remoteReady = useMatchdesk((s) => s.remoteReady);
  const partner = email ? findOwnPartner(partners, email) : null;

  if (!ready || !remoteReady) {
    return (
      <main className="bg-paper py-16">
        <Wrap>
          <div className="h-40 animate-pulse rounded-lg bg-line/60" />
        </Wrap>
      </main>
    );
  }

  if (!partner) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap>
          <PageIntro kicker="Bedrijfsportaal" title="Geen bedrijf op dit account.">
            {email
              ? `Er is geen aanmelding gekoppeld aan ${email}. Meld je aan met het zakelijke e-mailadres, of log in op dat account.`
              : "Log in met het zakelijke e-mailadres van je aanmelding."}
          </PageIntro>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/aanmelden">Bedrijf aanmelden</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/login" search={{ role: "bedrijf", mode: "inloggen", next: "/bedrijf" }}>
                Ander account
              </Link>
            </Button>
          </div>
        </Wrap>
      </main>
    );
  }

  const view = selfServeView(partner);
  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap>
        <PageIntro kicker="Bedrijfsportaal" title={partner.name}>
          {name ? `${name}. ` : null}
          Je profiel, status en capaciteit. Matchdesk laat toe; daarna beheer je Actief, pauze en capaciteit hier zelf.
        </PageIntro>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Profile partner={partner} />
          <Availability partner={partner} mode={view.mode} canActivate={view.canActivate} />
        </div>
      </Wrap>
    </main>
  );
}

function Profile({ partner }: { partner: Partner }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Bedrijfsprofiel</h2>
        <span className="rounded-full bg-mint/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal">
          {partner.status}
        </span>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Fact label="KvK" value={partner.kvk || "—"} />
        <Fact label="E-mail" value={partner.email} />
        <Fact label="Specialismen" value={partner.products?.length ? partner.products.join(" · ") : "—"} />
        <Fact
          label="Postcodegebieden"
          value={partner.prefixes?.length ? partner.prefixes.map((prefix) => `${prefix}xx`).join(", ") : "—"}
        />
        <Fact label="Status" value={partner.status} />
        <Fact label="Capaciteit" value={String(partner.capacity ?? 0)} />
      </dl>
      <p className="mt-6 text-sm text-muted">
        {isMatchablePartner(partner)
          ? "Je staat open voor nieuwe matches in je werkgebied."
          : "Matching staat uit voor dit bedrijf."}
      </p>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-3">
      <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function Availability({
  partner,
  mode,
  canActivate,
}: {
  partner: Partner;
  mode: "none" | "review" | "archived" | "manage";
  canActivate: boolean;
}) {
  const saveOwnAvailability = useMatchdesk((s) => s.saveOwnAvailability);
  const [capacity, setCapacity] = useState(String(partner.capacity ?? 0));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCapacity(String(partner.capacity ?? 0));
  }, [partner.id, partner.capacity]);

  async function save(patch: { status?: "Actief" | "Gepauzeerd"; capacity?: number }) {
    setBusy(true);
    setNote("");
    const result = await saveOwnAvailability({ id: partner.id, ...patch });
    setNote(result.message || (result.ok ? "Opgeslagen." : "Opslaan lukte niet."));
    setBusy(false);
  }

  if (mode !== "manage") {
    return (
      <aside className="rounded-lg border border-line bg-white p-6">
        <h2 className="font-display text-2xl">Status en capaciteit</h2>
        <p className="mt-3 text-sm text-muted">
          {mode === "archived"
            ? "Dit bedrijf is gearchiveerd. Alleen Matchdesk kan dat terugzetten. Status en capaciteit kun je hier niet wijzigen."
            : "Je staat op Te beoordelen. Matchdesk moet je eerst toelaten. Tot die tijd is dit overzicht alleen-lezen: je kunt jezelf niet op Actief zetten en je capaciteit niet wijzigen."}
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-line bg-white p-6">
      <h2 className="font-display text-2xl">Zelf beheren</h2>
      <p className="mt-2 text-sm text-muted">
        Na toelating kies je zelf Actief of Gepauzeerd, en je capaciteit. Te beoordelen en Gearchiveerd blijven bij Matchdesk.
      </p>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Status">
        <Button
          type="button"
          size="sm"
          variant={partner.status === "Actief" ? "default" : "ghost"}
          disabled={busy || partner.status === "Actief" || !canActivate}
          onClick={() => void save({ status: "Actief" })}
        >
          Actief
        </Button>
        <Button
          type="button"
          size="sm"
          variant={partner.status === "Gepauzeerd" ? "default" : "ghost"}
          disabled={busy || partner.status === "Gepauzeerd"}
          onClick={() => void save({ status: "Gepauzeerd" })}
        >
          Gepauzeerd
        </Button>
      </div>
      {!canActivate ? (
        <p className="mt-3 text-sm text-muted">Opnieuw Actief kan pas nadat Matchdesk je heeft toegelaten.</p>
      ) : null}
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!/^\d+$/.test(capacity.trim())) {
            setNote("Capaciteit is een geheel getal van 0 tot en met 999.");
            return;
          }
          const next = Number(capacity);
          if (next > 999) {
            setNote("Capaciteit is een geheel getal van 0 tot en met 999.");
            return;
          }
          void save({ capacity: next });
        }}
      >
        <label className="block text-sm font-semibold">
          Capaciteit
          <input
            className="field-input mt-1.5"
            type="number"
            min={0}
            max={999}
            step={1}
            inputMode="numeric"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />
        </label>
        <p className="mt-2 text-xs text-muted">
          Capaciteit 0 betekent: geen nieuwe matches, ook als je Actief bent.
        </p>
        <Button type="submit" size="sm" className="mt-4" disabled={busy}>
          {busy ? "Bezig…" : "Capaciteit opslaan"}
        </Button>
      </form>
      {note ? <p className="mt-4 text-sm">{note}</p> : null}
    </aside>
  );
}
