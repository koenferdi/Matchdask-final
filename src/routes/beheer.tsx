import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { PortalGate } from "@/components/portal-gate";
import { CONTACT, PRODUCTS, STAGES, STRIPE, findPartnerFor, type Lead, type Product } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";
import { isOwner } from "@/lib/owner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  FINANCIAL_DELETE_BLOCKED,
  hasFinancialRegistration,
  visibleLeads,
} from "@/lib/finance";

const TABS = [
  "overzicht",
  "aanvragen",
  "keuring",
  "installateurs",
  "mail",
  "afspraken",
  "nieuwsbrief",
  "website",
  "notities",
] as const;

type Tab = (typeof TABS)[number];

const LABELS: Record<Tab, string> = {
  overzicht: "Overzicht",
  aanvragen: "Aanvragen",
  keuring: "Keuring",
  installateurs: "Bedrijven",
  mail: "Mail",
  afspraken: "Afspraken",
  nieuwsbrief: "Nieuwsbrief",
  website: "Website",
  notities: "Notities",
};

type Search = { tab?: Tab };

type GateRow = {
  id: string;
  sentAt?: string | null;
  activatedAt?: string | null;
  confirmationSentAt?: string | null;
};

type GateApi = {
  rows: GateRow[];
  note: string;
  link: string;
  busy: string;
  send: (partnerId: string, resend?: boolean) => Promise<void>;
  activated: (id: string) => boolean;
  sent: (id: string) => boolean;
};

function usePartnerGate(): GateApi {
  const [rows, setRows] = useState<GateRow[]>([]);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState("");

  function reload() {
    void fetch("/api/partner/gate", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { partners?: GateRow[] } | null) => {
        if (Array.isArray(data?.partners)) setRows(data.partners);
      })
      .catch(() => {});
  }

  useEffect(() => {
    reload();
  }, []);

  async function send(partnerId: string, resend = false) {
    setBusy(partnerId);
    setNote("");
    setLink("");
    try {
      const res = await fetch("/api/partner/gate", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ partnerId, resend }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setNote(typeof data.message === "string" ? data.message : "Activatiemail lukte niet.");
      } else if (data.alreadySent) {
        setNote(typeof data.message === "string" ? data.message : "Er is al een activatielink.");
      } else if (data.mailed) {
        setNote("Activatiemail verstuurd. Het bedrijf wordt Actief pas na de link.");
      } else {
        setNote(typeof data.message === "string" ? data.message : "Link aangemaakt, mail niet verzonden.");
        if (typeof data.activationUrl === "string") setLink(data.activationUrl);
      }
      reload();
    } catch {
      setNote("Activatiemail lukte niet door een verbindingsfout.");
    } finally {
      setBusy("");
    }
  }

  return {
    rows,
    note,
    link,
    busy,
    send,
    activated: (id) => Boolean(rows.find((row) => row.id === id)?.activatedAt),
    sent: (id) => Boolean(rows.find((row) => row.id === id)?.sentAt) && !rows.find((row) => row.id === id)?.activatedAt,
  };
}

export const Route = createFileRoute("/beheer")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: TABS.includes(s.tab as Tab) ? (s.tab as Tab) : undefined,
  }),
  component: BeheerPage,
});

function BeheerPage() {
  return (
    <PortalGate>
      <OwnerOnly>
        <Beheer />
      </OwnerOnly>
    </PortalGate>
  );
}

function OwnerOnly({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="bg-night py-16">
        <Wrap>
          <div className="h-40 animate-pulse rounded-lg bg-white/10" />
        </Wrap>
      </main>
    );
  }
  if (!isOwner(user)) {
    return (
      <main className="bg-night py-16 text-paper">
        <Wrap>
          <PageIntro kicker="Beheer" title="Dit deel is alleen voor de beheerder.">
            Het Matchdesk-beheer is geen klant- of bedrijfportaal.
          </PageIntro>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="mint">
              <Link to="/klant">Naar klantportaal</Link>
            </Button>
            <Button asChild variant="onDark">
              <Link to="/bedrijf">Naar bedrijfsportaal</Link>
            </Button>
          </div>
        </Wrap>
      </main>
    );
  }
  return children;
}

function Beheer() {
  const { tab: tabQ } = Route.useSearch();
  const navigate = useNavigate({ from: "/beheer" });
  const tab: Tab = tabQ ?? "overzicht";
  const data = useMatchdesk();
  const gate = usePartnerGate();
  const openLeads = visibleLeads(data.leads).filter((l) => l.status === "Nieuw").length;
  const pending = data.partners.filter((p) => !p.example && p.status === "Te beoordelen").length;
  const counts: Partial<Record<Tab, number>> = {
    aanvragen: openLeads,
    keuring: pending,
    afspraken: visibleLeads(data.leads).filter((l) => l.appointment && l.appointment.status === "Aangevraagd")
      .length,
    nieuwsbrief: data.subscribers.length,
  };

  function open(next: Tab) {
    void navigate({ search: { tab: next === "overzicht" ? undefined : next } });
  }

  return (
    <main className="cockpit min-h-svh bg-night text-paper">
      <div className="mx-auto flex max-w-[1400px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 lg:w-56 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="px-4 py-4 lg:px-5">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-mint/60">ALLEEN JIJ</p>
            <h1 className="mt-1 font-display text-2xl">Cockpit</h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:px-2 lg:pb-6" aria-label="Beheer">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => open(id)}
                className={`flex shrink-0 items-center justify-between gap-2 rounded-full px-3 py-2 text-sm font-semibold lg:rounded-sm lg:px-3 ${
                  tab === id ? "bg-mint text-night" : "bg-white/5 text-mint/80 hover:bg-white/10 hover:text-paper"
                }`}
              >
                {LABELS[id]}
                {counts[id] ? (
                  <span className={`rounded-full px-1.5 text-[11px] ${tab === id ? "bg-night/20" : "bg-bright/20 text-bright"}`}>
                    {counts[id]}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-8">
          {data.serverOwner === false ? (
            <p className="mb-5 rounded-md border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              Server herkent dit account niet als eigenaar. Wijzigingen blijven dan niet bewaard. Log in met het eigenaarsaccount.
            </p>
          ) : null}
          {tab === "overzicht" ? <Overzicht onOpen={open} /> : null}
          {tab === "aanvragen" ? <Aanvragen /> : null}
          {tab === "installateurs" ? <Installateurs gate={gate} /> : null}
          {tab === "keuring" ? <Keuring gate={gate} /> : null}
          {tab === "mail" ? <MailLog /> : null}
          {tab === "afspraken" ? <Afspraken /> : null}
          {tab === "nieuwsbrief" ? <Nieuwsbrief /> : null}
          {tab === "website" ? <Website /> : null}
          {tab === "notities" ? <Notities /> : null}
        </div>
      </div>
    </main>
  );
}

function Overzicht({ onOpen }: { onOpen: (tab: Tab) => void }) {
  const { leads: rawLeads, partners, subscribers, matchingPaused, setMatchingPaused, siteNotice } = useMatchdesk();
  const leads = visibleLeads(rawLeads);
  const [health, setHealth] = useState<"laden" | "online" | "offline">("laden");
  useEffect(() => {
    fetch("/api/auth/ok", { credentials: "include" })
      .then((r) => setHealth(r.ok ? "online" : "offline"))
      .catch(() => setHealth("offline"));
  }, []);
  const nieuw = leads.filter((l) => l.status === "Nieuw");
  const pending = partners.filter((p) => !p.example && p.status === "Te beoordelen");
  const active = partners.filter((p) => p.status === "Actief" && !p.example).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Website" value={health === "laden" ? "…" : health === "online" ? "Online" : "Offline"} warn={health === "offline"} />
        <Stat label="Matching" value={matchingPaused ? "Pauze" : "Aan"} warn={matchingPaused} />
        <Stat label="Open aanvragen" value={String(nieuw.length)} />
        <Stat label="Live bedrijven" value={String(active)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-deep p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-bright" checked={matchingPaused} onChange={(e) => setMatchingPaused(e.target.checked)} />
          Matching pauzeren
        </label>
        {siteNotice ? <span className="text-sm text-amber">Melding: {siteNotice}</span> : null}
        <button type="button" className="ml-auto text-sm font-semibold text-mint" onClick={() => onOpen("website")}>
          Website sturen →
        </button>
      </div>

      <section className="rounded-lg border border-white/10 bg-deep p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl">Nu doen</h2>
          <span className="text-xs text-mint/60">{nieuw.length + pending.length} open</span>
        </div>
        {nieuw.length === 0 && pending.length === 0 ? (
          <p className="mt-3 text-sm text-mint/70">Niets open. Nieuwe scans en aanmeldingen komen hier.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {nieuw.slice(0, 6).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-3 text-sm">
                <span>
                  <strong>{l.name}</strong> · {l.product}
                  <span className="mt-0.5 block text-xs text-mint/60">
                    {l.postcode} {l.city} · {l.email}
                  </span>
                </span>
                <Button size="sm" variant="mint" onClick={() => onOpen("aanvragen")}>
                  Open
                </Button>
              </li>
            ))}
            {pending.slice(0, 6).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-3 text-sm">
                <span>
                  <strong>{p.name}</strong> · te beoordelen
                  <span className="mt-0.5 block text-xs text-mint/60">KvK {p.kvk} · {p.email}</span>
                </span>
                <Button size="sm" variant="mint" onClick={() => onOpen("keuring")}>
                  Keuring
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-white/10 bg-deep p-5">
        <h2 className="font-display text-xl">Funnel</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STAGES.map((s) => (
            <li key={s} className="rounded-md border border-white/10 px-3 py-3">
              <small className="block text-[11px] uppercase tracking-wider text-mint/50">{s}</small>
              <strong className="font-display text-2xl tabular-nums">{leads.filter((l) => l.status === s).length}</strong>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-mint/50">{subscribers.length} nieuwsbrief · {partners.length} bedrijven in bestand</p>
      </section>
    </div>
  );
}

function Aanvragen() {
  const { leads: rawLeads, partners, requestMatch, setLeadStatus, deleteLead, hydrate } = useMatchdesk();
  const leads = visibleLeads(rawLeads);
  const [blockNote, setBlockNote] = useState("");
  const [forceId, setForceId] = useState<string | null>(null);

  function onDelete(lead: Lead) {
    setBlockNote("");
    const result = deleteLead(lead.id);
    if (result.blocked) {
      setBlockNote(result.message || FINANCIAL_DELETE_BLOCKED);
      setForceId(lead.id);
      return;
    }
    if (!result.ok) setBlockNote(result.message || "Verwijderen lukte niet.");
    setForceId(null);
  }

  function onForceDelete(lead: Lead) {
    const ok = window.confirm(
      `Force-verwijderen van “${lead.name}”? Dit dossier heeft een financiële registratie. Soft-delete: het verdwijnt uit de cockpit, de registratie blijft in de data bewaard.`,
    );
    if (!ok) return;
    const result = deleteLead(lead.id, { force: true });
    if (!result.ok) {
      setBlockNote(result.message || FINANCIAL_DELETE_BLOCKED);
      return;
    }
    setBlockNote("");
    setForceId(null);
  }

  return (
    <section>
      <h2 className="font-display text-2xl">{leads.length} aanvragen</h2>
      <p className="text-sm text-mint/70">Status, match of verwijderen. Eén bedrijf per aanvraag.</p>
      {blockNote ? (
        <p role="alert" className="mt-3 text-sm text-red-200">
          {blockNote}{" "}
          <button type="button" className="underline" onClick={() => void hydrate()}>
            Gegevens vernieuwen
          </button>
        </p>
      ) : null}
      {leads.length === 0 ? (
        <p className="mt-4 text-sm text-mint/70">Nog geen aanvragen.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {leads.map((l) => {
            const p = l.partnerId ? partners.find((x) => x.id === l.partnerId) : findPartnerFor(l, partners);
            const financial = hasFinancialRegistration(l);
            return (
              <li key={l.id} className="rounded-lg border border-white/10 bg-deep p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong className="font-display text-lg">{l.name}</strong>
                    <p className="text-xs text-mint/60">
                      {l.id} · {l.product} · {l.postcode} {l.city}
                    </p>
                    <p className="mt-1 text-xs">
                      <a className="underline" href={`mailto:${l.email}`}>{l.email}</a>
                      {l.phone ? (
                        <>
                          {" · "}
                          <a className="underline" href={`tel:${l.phone}`}>{l.phone}</a>
                        </>
                      ) : null}
                    </p>
                    {l.address ? <p className="text-xs text-mint/60">{l.address}</p> : null}
                    {financial ? (
                      <p className="mt-1 text-xs text-amber">
                        Financiële registratie · {l.deal?.outcome ?? "offerte/commissie"}
                      </p>
                    ) : null}
                  </div>
                  <select
                    className="field-input max-w-[11rem] py-1 text-xs"
                    value={l.status}
                    onChange={(e) => setLeadStatus(l.id, e.target.value as Lead["status"])}
                  >
                    {STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {l.status === "Nieuw" ? (
                    <Button size="sm" variant="mint" onClick={() => requestMatch(l.id)}>
                      Match {p?.name ?? "partner"}
                    </Button>
                  ) : (
                    <span className="text-xs text-mint/70">{p?.name ?? "geen partner"}</span>
                  )}
                  <button
                    type="button"
                    className="ml-auto text-xs text-red-300"
                    onClick={() => onDelete(l)}
                  >
                    Verwijder
                  </button>
                  {financial && forceId === l.id ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-amber"
                      onClick={() => onForceDelete(l)}
                    >
                      Forceer (admin)
                    </button>
                  ) : null}
                </div>
                {l.partnerId && p?.status === "Actief" ? <PartnerBericht leadId={l.id} partnerId={p.id} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PartnerBericht({ leadId, partnerId }: { leadId: string; partnerId: string }) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setNote("");
        void fetch("/api/mail/bericht", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ partnerId, leadId, preview: text }),
        })
          .then(async (res) => ({ res, data: await res.json().catch(() => ({})) }))
          .then(({ res, data }) => {
            if (!res.ok || data.ok === false) {
              setNote(typeof data.message === "string" ? data.message : "Berichtmail niet verzonden.");
              return;
            }
            setNote(typeof data.message === "string" ? data.message : "Berichtmail verstuurd.");
            if (data.mailed) setText("");
          })
          .catch(() => setNote("Berichtmail niet verzonden."))
          .finally(() => setBusy(false));
      }}
    >
      <input
        className="field-input min-w-0 flex-1 py-1 text-xs"
        value={text}
        placeholder="Bericht voor de installateur"
        onChange={(e) => setText(e.target.value)}
      />
      <Button size="sm" variant="onDark" type="submit" disabled={busy}>
        {busy ? "Bezig…" : "Bericht klaar"}
      </Button>
      {note ? <span className="text-xs text-mint/70">{note}</span> : null}
    </form>
  );
}

function GateNote({ gate }: { gate: GateApi }) {
  if (!gate.note && !gate.link) return null;
  return (
    <div className="mt-4 rounded-md border border-white/10 bg-night px-4 py-3 text-sm">
      {gate.note ? <p>{gate.note}</p> : null}
      {gate.link ? (
        <p className="mt-2 break-all text-xs text-mint">
          Activatielink (mail niet verzonden): {gate.link}
        </p>
      ) : null}
    </div>
  );
}

function Keuring({ gate }: { gate: GateApi }) {
  const { partners, setPartnerStatus, setPartnerExclusive } = useMatchdesk();
  const queue = partners.filter((p) => !p.example && (p.status === "Te beoordelen" || p.exclusivePaid));
  return (
    <section>
      <h2 className="font-display text-2xl">Keuring</h2>
      <p className="mt-1 text-sm text-mint/70">
        KvK en werkgebied akkoord? Stuur de activatiemail. Het bedrijf wordt Actief pas als zij de link bevestigen. Daarna gaat de bevestigingsmail eruit. Badge alleen bij Actief + keuring betaald.
      </p>
      <GateNote gate={gate} />
      {queue.length === 0 ? (
        <p className="mt-4 text-sm text-mint/70">Geen open keuringen.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {queue.map((p) => (
            <li key={p.id} className="rounded-lg border border-white/10 bg-deep p-4">
              <strong className="font-display text-lg">{p.name}</strong>
              <p className="text-xs text-mint/60">
                {p.email} · KvK {p.kvk} · {p.prefixes.map((x) => `${x}xx`).join(", ")}
              </p>
              <p className="mt-1 text-xs">
                {p.status} · keuring {p.exclusivePaid ? "betaald" : "niet betaald"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.status !== "Actief" && !gate.activated(p.id) ? (
                  <Button
                    size="sm"
                    variant="mint"
                    disabled={gate.busy === p.id}
                    onClick={() => void gate.send(p.id, gate.sent(p.id))}
                  >
                    {gate.sent(p.id) ? "Activatiemail opnieuw" : "KvK + werkgebied akkoord"}
                  </Button>
                ) : null}
                {p.status !== "Actief" && gate.activated(p.id) ? (
                  <Button size="sm" variant="mint" onClick={() => setPartnerStatus(p.id, "Actief")}>
                    Weer live
                  </Button>
                ) : null}
                <Button size="sm" variant="onDark" onClick={() => setPartnerStatus(p.id, "Gepauzeerd")}>
                  Pauzeren
                </Button>
                <Button size="sm" variant="onDark" onClick={() => setPartnerExclusive(p.id, !p.exclusivePaid)}>
                  {p.exclusivePaid ? "Badge uit" : "Badge aan"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Installateurs({ gate }: { gate: GateApi }) {
  const { partners, setPartnerStatus, deletePartner, submitPartner, setPartnerExclusive } = useMatchdesk();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kvk, setKvk] = useState("");
  const [prefixes, setPrefixes] = useState("");
  const [product, setProduct] = useState<Product>("Zonnepanelen");
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Bedrijven</h2>
          <p className="text-sm text-mint/70">Activatiemail na KvK en werkgebied. Pauzeren, archiveren of verwijderen blijft hier.</p>
        </div>
        <Button size="sm" variant="mint" onClick={() => setOpen((v) => !v)}>
          {open ? "Sluit" : "Toevoegen"}
        </Button>
      </div>
      <GateNote gate={gate} />
      {open ? (
        <form
          className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-deep p-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitPartner({
              name,
              email,
              kvk,
              products: [product],
              prefixes: prefixes.split(/[,\s]+/).map((x) => x.replace(/\D/g, "").slice(0, 2)).filter(Boolean),
              capacity: 4,
            });
            setName("");
            setEmail("");
            setKvk("");
            setPrefixes("");
            setOpen(false);
          }}
        >
          <input className="field-input" required placeholder="Bedrijfsnaam" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field-input" required type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field-input" required placeholder="KvK" value={kvk} onChange={(e) => setKvk(e.target.value)} />
          <input className="field-input" required placeholder="Postcode-prefixen, bijv. 35, 34" value={prefixes} onChange={(e) => setPrefixes(e.target.value)} />
          <select className="field-input" value={product} onChange={(e) => setProduct(e.target.value as Product)}>
            {PRODUCTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <Button type="submit" variant="mint">Opslaan</Button>
        </form>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {partners.map((p) => (
          <article key={p.id} className="rounded-lg border border-white/10 bg-deep p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg">{p.name}</h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-mint">{p.status}</span>
            </div>
            <p className="mt-1 text-sm text-mint/70">{p.products.join(" · ")}</p>
            <p className="mt-1 text-xs text-mint/50">
              {p.email} · KvK {p.kvk} · {p.prefixes.map((x) => `${x}xx`).join(", ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.status === "Actief" ? (
                <Button size="sm" variant="onDark" onClick={() => setPartnerStatus(p.id, "Gepauzeerd")}>Pauzeren</Button>
              ) : gate.activated(p.id) ? (
                <Button size="sm" variant="mint" onClick={() => setPartnerStatus(p.id, "Actief")}>Weer live</Button>
              ) : (
                <Button size="sm" variant="mint" disabled={gate.busy === p.id} onClick={() => void gate.send(p.id, gate.sent(p.id))}>
                  {gate.sent(p.id) ? "Activatiemail opnieuw" : "Stuur activatielink"}
                </Button>
              )}
              <Button size="sm" variant="onDark" onClick={() => setPartnerStatus(p.id, "Gearchiveerd")}>Archiveren</Button>
              <button type="button" className="text-xs text-red-300" onClick={() => deletePartner(p.id)}>Verwijder</button>
            </div>
            {p.example ? <p className="mt-2 text-xs text-mint/50">Voorbeeld — niet publiek</p> : null}
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" className="accent-bright" checked={Boolean(p.exclusivePaid)} onChange={(e) => setPartnerExclusive(p.id, e.target.checked)} />
              Badge / keuring betaald
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}

function Afspraken() {
  const { leads: rawLeads, partners, confirmAppointment, cancelAppointment } = useMatchdesk();
  const rows = visibleLeads(rawLeads).filter((l) => l.appointment);
  return (
    <section>
      <h2 className="font-display text-2xl">Afspraken</h2>
      <p className="text-sm text-mint/70">Bevestigen of annuleren.</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-mint/70">Nog geen afspraken.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((l) => {
            const p = partners.find((x) => x.id === l.partnerId);
            return (
              <li key={l.id} className="rounded-lg border border-white/10 bg-deep p-4">
                <strong>{l.name}</strong>
                <p className="text-xs text-mint/60">
                  {l.appointment?.date} {l.appointment?.time} · {l.appointment?.status} · {p?.name ?? "geen match"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.appointment?.status !== "Bevestigd" ? (
                    <Button size="sm" variant="mint" onClick={() => confirmAppointment(l.id)}>Bevestig</Button>
                  ) : null}
                  <Button size="sm" variant="onDark" onClick={() => cancelAppointment(l.id)}>Annuleer</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type MailRow = {
  id: string;
  at: string | null;
  to: string;
  subject: string;
  type: string;
  status: string;
  reason?: string | null;
  company?: string | null;
  leadName?: string | null;
};

function mailTypeLabel(type: string) {
  switch (type) {
    case "activatie":
      return "Activatie";
    case "bevestiging":
      return "Bevestiging";
    case "klus":
      return "Klus";
    case "bericht":
      return "Bericht";
    case "cold":
      return "Cold";
    case "fu":
      return "Follow-up";
    case "overig":
      return "Overig";
    default:
      return type;
  }
}

function MailLog() {
  const [rows, setRows] = useState<MailRow[]>([]);
  const [gaps, setGaps] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    setError("");
    void fetch("/api/mail/log?limit=100", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Mail-log niet beschikbaar.");
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setGaps(Array.isArray(data.gaps) ? data.gaps : []);
      })
      .catch((err: Error) => setError(err.message || "Mail-log niet beschikbaar."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  const statusLabel: Record<string, string> = {
    sent: "Verzonden",
    failed: "Mislukt",
    queued: "In wachtrij",
    unknown: "Onbekend",
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Verzendlog</h2>
          <p className="text-sm text-mint/70">
            Automatische Resend-mails (activatie, bevestiging, klus, bericht) en gelogde cold- en follow-up outreach vanaf info@. Bron: mail-ledger.
          </p>
        </div>
        <Button size="sm" variant="onDark" onClick={() => reload()} disabled={loading}>
          {loading ? "Laden…" : "Vernieuwen"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {gaps.length ? (
        <ul className="mt-3 space-y-1 text-xs text-mint/55">
          {gaps.map((gap) => (
            <li key={gap}>· {gap}</li>
          ))}
        </ul>
      ) : null}
      {!loading && rows.length === 0 && !error ? (
        <p className="mt-4 text-sm text-mint/70">Nog geen mailactiviteit in de ledger.</p>
      ) : null}
      {rows.length ? (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-white/10 bg-deep p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong className="font-display text-base">{row.subject || row.type}</strong>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-mint/60">
                    <span>{row.at ? new Date(row.at).toLocaleString("nl-NL") : "Nog geen tijdstip"}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        row.type === "cold" || row.type === "fu"
                          ? "bg-bright/20 text-bright"
                          : "bg-white/10 text-mint/80"
                      }`}
                    >
                      {mailTypeLabel(row.type)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs">
                    Naar <a className="underline" href={`mailto:${row.to}`}>{row.to || "—"}</a>
                  </p>
                  {row.company || row.leadName ? (
                    <p className="mt-1 text-xs text-mint/60">
                      {[row.company, row.leadName].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {row.reason ? <p className="mt-1 text-xs text-amber">{row.reason}</p> : null}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    row.status === "sent"
                      ? "bg-mint/20 text-mint"
                      : row.status === "failed"
                        ? "bg-red-400/20 text-red-200"
                        : "bg-white/10 text-mint/80"
                  }`}
                >
                  {statusLabel[row.status] || row.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Nieuwsbrief() {
  const { subscribers, deleteSubscriber } = useMatchdesk();
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Nieuwsbrief</h2>
          <p className="text-sm text-mint/70">{subscribers.length} aanmeldingen</p>
        </div>
        {subscribers.length ? <CopyList emails={subscribers.map((s) => s.email)} /> : null}
      </div>
      {subscribers.length === 0 ? (
        <p className="mt-4 text-sm text-mint/70">Nog niemand ingeschreven.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {subscribers.map((s) => (
            <li key={s.email} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/10 bg-deep px-4 py-3 text-sm">
              <span>
                <strong>{s.name || "—"}</strong> · {s.email}
              </span>
              <span className="flex items-center gap-3 text-xs text-mint/50">
                {new Date(s.createdAt).toLocaleDateString("nl-NL")}
                <button type="button" className="text-red-300" onClick={() => deleteSubscriber(s.email)}>Verwijder</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Website() {
  const { matchingPaused, setMatchingPaused, siteNotice, setSiteNotice } = useMatchdesk();
  const [notice, setNotice] = useState(siteNotice);
  const [health, setHealth] = useState("laden…");
  useEffect(() => {
    fetch("/api/auth/ok", { credentials: "include" })
      .then((r) => setHealth(r.ok ? "Auth online" : "Auth fout"))
      .catch(() => setHealth("Auth niet bereikbaar"));
  }, []);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-white/10 bg-deep p-5">
        <h2 className="font-display text-xl">Status</h2>
        <ul className="mt-4 space-y-2 text-sm text-mint/80">
          <li>www.getmatchdesk.nl</li>
          <li>{health}</li>
          <li>Google + e-mail login</li>
          <li>Stripe woningscan + badge gekoppeld</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="onDark"><a href={STRIPE.woningscan} target="_blank" rel="noreferrer">Stripe scan</a></Button>
          <Button asChild size="sm" variant="onDark"><a href={STRIPE.exclusief} target="_blank" rel="noreferrer">Stripe badge</a></Button>
        </div>
      </section>
      <section className="rounded-lg border border-white/10 bg-deep p-5">
        <h2 className="font-display text-xl">Sturing</h2>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input type="checkbox" className="accent-bright" checked={matchingPaused} onChange={(e) => setMatchingPaused(e.target.checked)} />
          Matching pauzeren
        </label>
        <textarea
          className="field-input mt-3 min-h-24"
          value={notice}
          onChange={(e) => setNotice(e.target.value)}
          placeholder="Melding op de site, bijv. geen matches in Friesland."
        />
        <Button className="mt-3" size="sm" variant="mint" onClick={() => setSiteNotice(notice)}>
          Melding opslaan
        </Button>
        <p className="mt-4 text-xs text-mint/50">{CONTACT.email} · KvK {CONTACT.kvk}</p>
      </section>
      <section className="rounded-lg border border-white/10 bg-deep p-5 lg:col-span-2">
        <h2 className="font-display text-xl">Pagina’s</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["Home", "/"],
            ["Woning", "/woning"],
            ["Bedrijven", "/voor-bedrijven"],
            ["Aanvragen", "/aanvragen"],
            ["Aanmelden", "/aanmelden"],
            ["Rapport", "/voorbeeld-rapport"],
            ["Badge", "/voorbeeld-badge"],
            ["Lijst", "/installateurs"],
            ["Blog", "/blog"],
          ].map(([label, href]) => (
            <Button key={href} asChild size="sm" variant="onDark">
              <a href={href}>{label}</a>
            </Button>
          ))}
        </div>
        <Button className="mt-4" size="sm" variant="onDark" onClick={() => exportWorkspace()}>
          Exporteer data (JSON)
        </Button>
      </section>
    </div>
  );
}

function exportWorkspace() {
  const raw = localStorage.getItem("matchdesk-workspace-v1") || "{}";
  const blob = new Blob([raw], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `matchdesk-beheer-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function Notities() {
  const { notes, addNote, deleteNote } = useMatchdesk();
  const [text, setText] = useState("");
  return (
    <section>
      <h2 className="font-display text-2xl">Notities</h2>
      <p className="text-sm text-mint/70">Alleen in dit beheer. Opvolging, belafspraken, open punten.</p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          addNote(text);
          setText("");
        }}
      >
        <input className="field-input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nieuwe notitie" />
        <Button type="submit" variant="mint">Toevoegen</Button>
      </form>
      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-mint/70">Nog geen notities.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-deep px-4 py-3 text-sm">
              <span>
                {n.text}
                <small className="mt-1 block text-xs text-mint/50">{new Date(n.createdAt).toLocaleString("nl-NL")}</small>
              </span>
              <button type="button" className="text-xs text-red-300" onClick={() => deleteNote(n.id)}>Weg</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-deep p-4">
      <small className="text-[11px] uppercase tracking-wider text-mint/50">{label}</small>
      <strong className={`mt-1 block font-display text-2xl tabular-nums md:text-3xl ${warn ? "text-amber" : ""}`}>{value}</strong>
    </div>
  );
}

function CopyList({ emails }: { emails: string[] }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="onDark"
      onClick={async () => {
        await navigator.clipboard.writeText(emails.join("\n"));
        setDone(true);
      }}
    >
      {done ? "Gekopieerd" : "Kopieer e-mails"}
    </Button>
  );
}
