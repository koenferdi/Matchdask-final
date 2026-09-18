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

const TABS = [
  "overzicht",
  "aanvragen",
  "keuring",
  "installateurs",
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
  afspraken: "Afspraken",
  nieuwsbrief: "Nieuwsbrief",
  website: "Website",
  notities: "Notities",
};

type Search = { tab?: Tab };

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
  const openLeads = data.leads.filter((l) => l.status === "Nieuw").length;
  const pending = data.partners.filter((p) => !p.example && p.status === "Te beoordelen").length;
  const counts: Partial<Record<Tab, number>> = {
    aanvragen: openLeads,
    keuring: pending,
    afspraken: data.leads.filter((l) => l.appointment && l.appointment.status === "Aangevraagd").length,
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
          {tab === "installateurs" ? <Installateurs /> : null}
          {tab === "keuring" ? <Keuring /> : null}
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
  const { leads, partners, subscribers, matchingPaused, setMatchingPaused, siteNotice } = useMatchdesk();
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
  const { leads, partners, requestMatch, setLeadStatus, deleteLead } = useMatchdesk();
  return (
    <section>
      <h2 className="font-display text-2xl">{leads.length} aanvragen</h2>
      <p className="text-sm text-mint/70">Status, match of verwijderen. Eén bedrijf per aanvraag.</p>
      {leads.length === 0 ? (
        <p className="mt-4 text-sm text-mint/70">Nog geen aanvragen.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {leads.map((l) => {
            const p = l.partnerId ? partners.find((x) => x.id === l.partnerId) : findPartnerFor(l, partners);
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
                  <button type="button" className="ml-auto text-xs text-red-300" onClick={() => deleteLead(l.id)}>
                    Verwijder
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Keuring() {
  const { partners, setPartnerStatus, setPartnerExclusive } = useMatchdesk();
  const queue = partners.filter((p) => !p.example && (p.status === "Te beoordelen" || p.exclusivePaid));
  return (
    <section>
      <h2 className="font-display text-2xl">Keuring</h2>
      <p className="mt-1 text-sm text-mint/70">Betalen plaatst niemand live. Jij zet op Actief. Badge alleen bij Actief + keuring betaald.</p>
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
                <Button size="sm" variant="mint" onClick={() => setPartnerStatus(p.id, "Actief")}>
                  Toelaten (live)
                </Button>
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

function Installateurs() {
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
          <p className="text-sm text-mint/70">Toelaten, pauzeren, archiveren of verwijderen.</p>
        </div>
        <Button size="sm" variant="mint" onClick={() => setOpen((v) => !v)}>
          {open ? "Sluit" : "Toevoegen"}
        </Button>
      </div>
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
              {p.status !== "Actief" ? (
                <Button size="sm" variant="mint" onClick={() => setPartnerStatus(p.id, "Actief")}>Toelaten</Button>
              ) : (
                <Button size="sm" variant="onDark" onClick={() => setPartnerStatus(p.id, "Gepauzeerd")}>Pauzeren</Button>
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
  const { leads, partners, confirmAppointment, cancelAppointment } = useMatchdesk();
  const rows = leads.filter((l) => l.appointment);
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
