import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { PortalGate } from "@/components/portal-gate";
import { CONTACT, PRODUCTS, STAGES, STRIPE, findPartnerFor, type Lead, type Product } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";
import { isOwner } from "@/lib/owner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/beheer")({ component: BeheerPage });

type Tab = "overzicht" | "aanvragen" | "installateurs" | "keuring" | "afspraken" | "nieuwsbrief" | "website" | "notities";

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
      <main className="bg-paper py-16">
        <Wrap>
          <div className="h-40 animate-pulse rounded-lg bg-line/60" />
        </Wrap>
      </main>
    );
  }
  if (!isOwner(user)) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap>
          <PageIntro kicker="Beheer" title="Dit deel is alleen voor Koen.">
            Het Matchdesk-beheer is geen klant- of bedrijfportaal.
          </PageIntro>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/klant">Naar klantportaal</Link>
            </Button>
            <Button asChild variant="ghost">
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
  const [tab, setTab] = useState<Tab>("overzicht");
  const data = useMatchdesk();
  const tabs: { id: Tab; label: string }[] = [
    { id: "overzicht", label: "Overzicht" },
    { id: "aanvragen", label: "Aanvragen" },
    { id: "installateurs", label: "Installateurs" },
    { id: "keuring", label: "Keuring / badge" },
    { id: "afspraken", label: "Afspraken" },
    { id: "nieuwsbrief", label: "Nieuwsbrief" },
    { id: "website", label: "Website" },
    { id: "notities", label: "Notities" },
  ];

  return (
    <main className="bg-paper py-8 text-ink md:py-12">
      <Wrap>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">Beheer · alleen jij</p>
            <h1 className="mt-2 font-display text-[clamp(1.8rem,3vw,2.6rem)]">Cockpit</h1>
          </div>
          <p className="text-sm text-muted">
            {data.leads.length} aanvragen · {data.partners.length} bedrijven · {data.subscribers.length} nieuwsbrief
          </p>
        </div>
        {data.serverOwner === false ? (
          <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Server herkent dit account niet als eigenaar. Wijzigingen blijven dan niet bewaard. Log in met
            koenferdi@gmail.com of info@getmatchdesk.nl.
          </p>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <nav className="lg:sticky lg:top-28 lg:self-start" aria-label="Beheer">
            <select
              className="field-input lg:hidden"
              value={tab}
              onChange={(e) => setTab(e.target.value as Tab)}
            >
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <ul className="hidden lg:block">
              {tabs.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`w-full rounded-sm px-3 py-2.5 text-left text-sm font-semibold ${
                      tab === t.id ? "bg-mint/40 text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            {tab === "overzicht" ? <Overzicht onOpen={setTab} /> : null}
            {tab === "aanvragen" ? <Aanvragen /> : null}
            {tab === "installateurs" ? <Installateurs /> : null}
            {tab === "keuring" ? <Keuring /> : null}
            {tab === "afspraken" ? <Afspraken /> : null}
            {tab === "nieuwsbrief" ? <Nieuwsbrief /> : null}
            {tab === "website" ? <Website /> : null}
            {tab === "notities" ? <Notities /> : null}
          </div>
        </div>
      </Wrap>
    </main>
  );
}

function Overzicht({ onOpen }: { onOpen: (tab: Tab) => void }) {
  const { leads, partners, subscribers, matchingPaused, siteNotice } = useMatchdesk();
  const [health, setHealth] = useState<"laden" | "online" | "offline">("laden");
  useEffect(() => {
    fetch("/api/auth/ok", { credentials: "include" })
      .then((r) => setHealth(r.ok ? "online" : "offline"))
      .catch(() => setHealth("offline"));
  }, []);
  const open = leads.filter((l) => l.status === "Nieuw").length;
  const matched = leads.filter((l) => l.status === "Gematcht").length;
  const done = leads.filter((l) => l.status === "Afgerond").length;
  const pending = partners.filter((p) => p.status === "Te beoordelen").length;
  const active = partners.filter((p) => p.status === "Actief").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Website" value={health === "laden" ? "…" : health === "online" ? "Online" : "Offline"} />
        <Stat label="Matching" value={matchingPaused ? "Gepauzeerd" : "Actief"} />
        <Stat label="Open aanvragen" value={String(open)} />
        <Stat label="Actieve partners" value={String(active)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gematcht" value={String(matched)} />
        <Stat label="Afgerond" value={String(done)} />
        <Stat label="Partners te beoordelen" value={String(pending)} />
        <Stat label="Nieuwsbrief" value={String(subscribers.length)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["aanvragen", "Alle aanvragen"],
            ["installateurs", "Bedrijven"],
            ["afspraken", "Afspraken"],
            ["website", "Website & export"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant="ghost" onClick={() => onOpen(id)}>
            {label}
          </Button>
        ))}
      </div>
      {siteNotice ? (
        <div className="rounded-lg border border-amber/40 bg-white p-4 text-sm">
          Site-melding staat aan: <strong>{siteNotice}</strong>
        </div>
      ) : null}
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-2xl">Inzicht</h2>
        <p className="mt-1 text-sm text-muted">Funnel van woningscan tot afronding. Eén aanvraag, één installateur.</p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
          {STAGES.map((s) => (
            <li key={s} className="rounded-md border border-line px-3 py-3">
              <small className="block text-[11px] uppercase tracking-wider text-muted">{s}</small>
              <strong className="font-display text-2xl">{leads.filter((l) => l.status === s).length}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Aanvragen() {
  const { leads, partners, requestMatch, setLeadStatus, deleteLead } = useMatchdesk();
  return (
    <section className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl">{leads.length} aanvragen</h2>
      <p className="text-sm text-muted">Status wijzigen, matchen of verwijderen.</p>
      {leads.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nog geen aanvragen. Nieuwe woningscans verschijnen hier.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2">ID</th>
                <th>Klant</th>
                <th>Product</th>
                <th>Plaats</th>
                <th>Status</th>
                <th>Match</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => {
                const p = l.partnerId ? partners.find((x) => x.id === l.partnerId) : findPartnerFor(l, partners);
                return (
                  <tr key={l.id} className="border-t border-line align-top">
                    <td className="py-3 font-mono text-xs">{l.id}</td>
                    <td>
                      <strong>{l.name}</strong>
                      <div className="text-xs text-muted">
                        <a className="underline" href={`mailto:${l.email}`}>
                          {l.email}
                        </a>
                        {l.phone ? (
                          <>
                            <br />
                            <a className="underline" href={`tel:${l.phone}`}>
                              {l.phone}
                            </a>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td>{l.product}</td>
                    <td>
                      {l.postcode} {l.city}
                      <div className="text-xs text-muted">{l.address}</div>
                    </td>
                    <td>
                      <select
                        className="field-input max-w-[10rem] py-1 text-xs"
                        value={l.status}
                        onChange={(e) => setLeadStatus(l.id, e.target.value as Lead["status"])}
                      >
                        {STAGES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {l.status === "Nieuw" ? (
                        <Button size="sm" onClick={() => requestMatch(l.id)}>
                          Match {p?.name.split(" ")[0] ?? ""}
                        </Button>
                      ) : (
                        p?.name ?? "—"
                      )}
                    </td>
                    <td>
                      <button type="button" className="text-xs text-red-700" onClick={() => deleteLead(l.id)}>
                        Verwijder
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

}

function Keuring() {
  const { partners, setPartnerStatus, setPartnerExclusive } = useMatchdesk();
  const queue = partners.filter((p) => !p.example && (p.status === "Te beoordelen" || p.exclusivePaid));
  return (
    <section className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl">Keuring</h2>
      <p className="mt-1 text-sm text-muted">
        Betalen plaatst niemand op de site. Alleen jij zet op Actief. Badge alleen bij Actief + keuring betaald.
      </p>
      {queue.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Geen open keuringen.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {queue.map((p) => (
            <li key={p.id} className="rounded-md border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong className="font-display text-lg">{p.name}</strong>
                  <p className="text-xs text-muted">
                    {p.email} · KvK {p.kvk} · {p.prefixes.map((x) => `${x}xx`).join(", ")}
                  </p>
                  <p className="mt-1 text-xs">
                    Status {p.status} · keuring {p.exclusivePaid ? "betaald" : "niet betaald"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setPartnerStatus(p.id, "Actief")}>
                    Toelaten (live)
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPartnerStatus(p.id, "Gepauzeerd")}>
                    Pauzeren
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPartnerExclusive(p.id, !p.exclusivePaid)}>
                    {p.exclusivePaid ? "Badge uit" : "Badge aan"}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted">
        Voorbeeldrapport: /voorbeeld-rapport · Badge-pakket: /voorbeeld-badge
      </p>
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
    <section className="rounded-lg border border-line bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Installateurs</h2>
          <p className="text-sm text-muted">Toelaten, pauzeren, archiveren, toevoegen of verwijderen.</p>
        </div>
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Sluit" : "Installateur toevoegen"}
        </Button>
      </div>
      {open ? (
        <form
          className="mt-4 grid gap-3 rounded-md border border-line p-4 md:grid-cols-2"
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
          <Button type="submit">Opslaan</Button>
        </form>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {partners.map((p) => (
          <article key={p.id} className="rounded-md border border-line p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg">{p.name}</h3>
              <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-teal">{p.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{p.products.join(" · ")}</p>
            <p className="mt-1 text-xs text-muted">
              {p.email} · KvK {p.kvk} · {p.prefixes.map((x) => `${x}xx`).join(", ")}
            </p>
            <p className="mt-1 text-xs text-muted">Capaciteit {p.capacity} · kwaliteit {p.quality || "—"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.status !== "Actief" ? (
                <Button size="sm" onClick={() => setPartnerStatus(p.id, "Actief")}>
                  Toelaten
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setPartnerStatus(p.id, "Gepauzeerd")}>
                  Pauzeren
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setPartnerStatus(p.id, "Gearchiveerd")}>
                Archiveren
              </Button>
              <button type="button" className="text-xs text-red-700" onClick={() => deletePartner(p.id)}>
                Verwijder
              </button>
            </div>
            {p.example ? <p className="mt-2 text-xs text-muted">Voorbeeldbedrijf — niet zichtbaar op de publieke lijst</p> : null}
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={Boolean(p.exclusivePaid)}
                onChange={(e) => setPartnerExclusive(p.id, e.target.checked)}
              />
              Exclusief-proof betaald
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
    <section className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl">Afspraken</h2>
      <p className="text-sm text-muted">Bevestigen of annuleren.</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nog geen afspraken gepland.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line text-sm">
          {rows.map((l) => {
            const p = partners.find((x) => x.id === l.partnerId);
            return (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <strong>{l.name}</strong> · {l.appointment?.date} {l.appointment?.time} · {l.appointment?.status}
                  <small className="mt-1 block text-xs text-muted">
                    {l.product} · {p?.name ?? "geen match"} · {l.email}
                  </small>
                </span>
                <span className="flex gap-2">
                  {l.appointment?.status !== "Bevestigd" ? (
                    <Button size="sm" onClick={() => confirmAppointment(l.id)}>
                      Bevestig
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => cancelAppointment(l.id)}>
                    Annuleer
                  </Button>
                </span>
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
    <section className="rounded-lg border border-line bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Nieuwsbrief</h2>
          <p className="text-sm text-muted">{subscribers.length} aanmeldingen</p>
        </div>
        {subscribers.length ? <CopyList emails={subscribers.map((s) => s.email)} /> : null}
      </div>
      {subscribers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nog niemand ingeschreven.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line text-sm">
          {subscribers.map((s) => (
            <li key={s.email} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span>
                <strong>{s.name || "—"}</strong> · {s.email}
              </span>
              <span className="flex items-center gap-3 text-xs text-muted">
                {new Date(s.createdAt).toLocaleDateString("nl-NL")}
                <button type="button" className="text-red-700" onClick={() => deleteSubscriber(s.email)}>
                  Verwijder
                </button>
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
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-2xl">Status</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li>Domein: www.getmatchdesk.nl</li>
          <li>{health}</li>
          <li>Google-login: ingesteld</li>
          <li>E-mail/wachtwoord: aan</li>
          <li>Stripe woningscan: gekoppeld</li>
          <li>Stripe early-bird: gekoppeld</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <a href={STRIPE.woningscan} target="_blank" rel="noreferrer">
              Stripe woningscan
            </a>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href={STRIPE.exclusief} target="_blank" rel="noreferrer">
              Stripe early-bird
            </a>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/rapport">Rapportpagina</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/exclusief">Exclusief-proof</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/installateurs">Publieke lijst</Link>
          </Button>
        </div>
      </section>
      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-2xl">Sturing</h2>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input type="checkbox" checked={matchingPaused} onChange={(e) => setMatchingPaused(e.target.checked)} />
          Matching pauzeren (geen nieuwe matches)
        </label>
        <label className="mt-4 block text-sm">
          Melding op de site
          <textarea
            className="field-input mt-1 min-h-24"
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="Bijv. Tijdelijk geen nieuwe matches in Friesland."
          />
        </label>
        <Button className="mt-3" size="sm" onClick={() => setSiteNotice(notice)}>
          Melding opslaan
        </Button>
        <p className="mt-4 text-sm text-muted">
          Contact: {CONTACT.email} · KvK {CONTACT.kvk}
        </p>
        <a className="text-sm font-semibold text-teal" href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </section>
      <section className="rounded-lg border border-line bg-white p-6 lg:col-span-2">
        <h2 className="text-2xl">Pagina’s en data</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["Home", "/"],
            ["Aanvragen", "/aanvragen"],
            ["Login", "/login"],
            ["Klant", "/klant"],
            ["Bedrijf", "/bedrijf"],
            ["Installateurs", "/installateurs"],
            ["Rapport", "/rapport"],
            ["Exclusief", "/exclusief"],
            ["Blog", "/blog"],
            ["Tools", "/tools"],
            ["Nieuwsbrief", "/nieuwsbrief"],
            ["Wachtlijst", "/wachtlijst"],
          ].map(([label, href]) => (
            <Button key={href} asChild size="sm" variant="ghost">
              <a href={href}>{label}</a>
            </Button>
          ))}
        </div>
        <Button className="mt-4" size="sm" variant="ghost" onClick={() => exportWorkspace()}>
          Exporteer alle data (JSON)
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
    <section className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-2xl">Notities</h2>
      <p className="text-sm text-muted">Alleen jij ziet dit. Voor opvolging, belafspraken, open punten.</p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          addNote(text);
          setText("");
        }}
      >
        <input className="field-input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="Nieuwe notitie" />
        <Button type="submit">Toevoegen</Button>
      </form>
      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nog geen notities.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <span>
                {n.text}
                <small className="mt-1 block text-xs text-muted">{new Date(n.createdAt).toLocaleString("nl-NL")}</small>
              </span>
              <button type="button" className="text-xs text-red-700" onClick={() => deleteNote(n.id)}>
                Weg
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <small className="text-[11px] uppercase tracking-wider text-muted">{label}</small>
      <strong className="mt-1 block font-display text-3xl tabular-nums">{value}</strong>
    </div>
  );
}

function CopyList({ emails }: { emails: string[] }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(emails.join("\n"));
        setDone(true);
      }}
    >
      {done ? "Gekopieerd" : "Kopieer e-mails"}
    </Button>
  );
}
