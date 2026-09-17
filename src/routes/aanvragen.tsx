import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { PRODUCTS, TERMS, CONTACT, STRIPE, ROOF_TYPES, ROOF_DIRS, SHADES, METERS, type Product, type Term, type RoofType, type RoofDir, type Shade, type Meter, runScan, kwh } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/cn";

type Search = { product?: string };

export const Route = createFileRoute("/aanvragen")({
  component: Aanvragen,
  validateSearch: (s: Record<string, unknown>): Search => ({
    product: typeof s.product === "string" ? s.product : undefined,
  }),
});

const STEPS = ["Installatie", "Woning", "Planning", "Contact"] as const;

function Aanvragen() {
  const search = Route.useSearch();
  const { draft, setDraft, submitLead } = useMatchdesk();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    if (search.product && (PRODUCTS as readonly string[]).includes(search.product)) {
      setDraft({ product: search.product as Product });
    }
  }, [search.product, setDraft]);

  const lead = useMatchdesk((s) => s.leads.find((l) => l.id === doneId));
  const { user } = useCurrentUserState();

  function next(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 0 && !draft.product) return setError("Kies een installatie.");
    if (step === 1) {
      if (!/^[1-9][0-9]{3}\s?[A-Za-z]{2}$/.test(draft.postcode.trim())) {
        return setError("Vul een geldige postcode in, bijvoorbeeld 3511 AA.");
      }
      if (!draft.city.trim() || !draft.address.trim()) return setError("Vul woonplaats en adres in.");
    }
    if (step === 2 && !draft.term) return setError("Kies een termijn.");
    if (step === 3) {
      if (!draft.name.trim() || !draft.email.trim() || !draft.phone.trim()) {
        return setError("Vul naam, e-mail en telefoon in.");
      }
      if (!draft.consent) return setError("Bevestig dat we je antwoorden mogen opslaan.");
      const created = submitLead();
      setDoneId(created.id);
      return;
    }
    setStep((s) => s + 1);
  }

  if (doneId && lead) {
    const scan = runScan(lead);
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <section className="rounded-lg border border-line bg-white p-8 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex size-12 items-center justify-center rounded-sm bg-mint text-teal">
                <Check className="size-5" />
              </div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">Aanvraag opgeslagen</p>
              <h2 className="text-3xl">Je aanvraag is ontvangen.</h2>
              <p className="mt-3 text-muted">
                {user
                  ? "Je kunt deze aanvraag nu volgen in je klantportaal: status, match en afspraak."
                  : "Er is nog geen klantportaal. Dat ontstaat pas als je een account maakt. Zonder account kunnen we je aanvraag niet tonen of een afspraak plannen."}
              </p>
              <div className="mt-6 rounded-md border border-line bg-paper p-4 text-sm">
                <strong>{lead.product}</strong>
                <br />
                {lead.postcode} · {lead.city}
                <br />
                {lead.id}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat label="Regio" value={scan.region} />
                <Stat label="Inschatting" value={scan.suitability} />
                <Stat label={lead.product === "Thuisbatterij" ? "Batterij" : "Opwek"} value={lead.product === "Thuisbatterij" ? `${scan.batteryKwh} kWh` : kwh(scan.yieldKwh)} />
              </div>
              <p className="mt-4 text-sm text-muted">{scan.matchHint}</p>
              <div className="mt-8 rounded-lg border border-line p-6">
                <span className="inline-flex rounded-full bg-mint/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal">
                  Upgrade · €39
                </span>
                <h3 className="mt-3 font-display text-2xl">Beter voorbereid? Bekijk het uitgebreide woningrapport (€39)</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="size-4 text-teal" /> Fit-rapport mee naar jouw ene installateur</li>
                  <li className="flex gap-2"><Check className="size-4 text-teal" /> Scherpere eerste offerte</li>
                  <li className="flex gap-2"><Check className="size-4 text-teal" /> Oriëntatie — geen installatiegarantie</li>
                </ul>
                <Button asChild variant="mint" className="mt-5">
                  <a href={STRIPE.woningscan}>
                    Betaal €39 en open het rapport <ArrowRight className="size-4" />
                  </a>
                </Button>
                <p className="mt-3 text-xs text-muted">
                  Na betaling kom je terug op je rapport. Al betaald?{" "}
                  <Link to="/rapport" search={{ paid: "1" }} className="font-semibold text-teal">
                    Open het woningrapport
                  </Link>
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {user ? (
                  <Button asChild>
                    <Link to="/klant">Open mijn project</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild>
                      <Link
                        to="/login"
                        search={{
                          role: "klant",
                          mode: "aanmelden",
                          next: "/klant",
                          email: lead.email,
                          name: lead.name,
                        }}
                      >
                        Account maken en project volgen
                      </Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link to="/login" search={{ role: "klant", mode: "inloggen", next: "/klant", email: lead.email }}>
                        Ik heb al een account
                      </Link>
                    </Button>
                  </>
                )}
                <Button variant="link" onClick={() => { setDoneId(null); setStep(0); }}>
                  Nog een aanvraag maken
                </Button>
              </div>
            </section>
            <Aside />
          </div>
        </Wrap>
      </main>
    );
  }

  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap>
        <PageIntro kicker="Gratis Basis Woningscan" title="Wat past bij jouw woning?">
          Vier korte stappen. Direct een gratis basisanalyse.
        </PageIntro>
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <section className="rounded-lg border border-line bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
            <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STEPS.map((label, i) => (
                <div
                  key={label}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "rounded-sm px-2 py-2 text-center text-[12px] font-semibold",
                    i <= step ? "bg-mint text-night" : "bg-paper text-muted",
                  )}
                >
                  {i + 1}. {label}
                </div>
              ))}
            </div>
            <form onSubmit={next} className="space-y-5">
              {step === 0 ? (
                <>
                  <h2 className="text-2xl">Wat wil je laten installeren?</h2>
                  <p className="text-sm text-muted">Kies wat het beste bij je plannen past.</p>
                  {PRODUCTS.map((p, i) => (
                    <label key={p} className={cn("flex cursor-pointer items-start gap-4 rounded-md border p-4", draft.product === p ? "border-teal bg-mint/20" : "border-line")}>
                      <input
                        type="radio"
                        name="product"
                        className="mt-1 accent-teal"
                        checked={draft.product === p}
                        onChange={() => setDraft({ product: p })}
                      />
                      <span>
                        <strong className="block">{p}</strong>
                        <small className="text-muted">
                          {["Stroom opwekken op je eigen dak.", "Zelf opgewekte stroom opslaan.", "Beide in één afgestemd traject."][i]}
                        </small>
                      </span>
                    </label>
                  ))}
                </>
              ) : null}
              {step === 1 ? (
                <>
                  <h2 className="text-2xl">Vertel ons over je woning.</h2>
                  <p className="text-sm text-muted">We gebruiken je postcode om het werkgebied te bepalen.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Postcode">
                      <input
                        required
                        autoComplete="postal-code"
                        placeholder="3511 AA"
                        value={draft.postcode}
                        onChange={(e) => setDraft({ postcode: e.target.value.toUpperCase() })}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Woonplaats">
                      <input
                        required
                        autoComplete="address-level2"
                        placeholder="Utrecht"
                        value={draft.city}
                        onChange={(e) => setDraft({ city: e.target.value })}
                        className="field-input"
                      />
                    </Field>
                  </div>
                  <Field label="Straat en huisnummer">
                    <input
                      required
                      autoComplete="street-address"
                      placeholder="Straatnaam 12"
                      value={draft.address}
                      onChange={(e) => setDraft({ address: e.target.value })}
                      className="field-input"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Jaarverbruik (kWh, optioneel)">
                      <input
                        inputMode="numeric"
                        placeholder="bijv. 3500"
                        value={draft.usageKwh}
                        onChange={(e) => setDraft({ usageKwh: e.target.value.replace(/\D/g, "") })}
                        className="field-input"
                      />
                    </Field>
                    <Field label="Meterkast">
                      <select className="field-input" value={draft.meter} onChange={(e) => setDraft({ meter: e.target.value as Meter })}>
                        <option value="">Weet ik niet</option>
                        {METERS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Daktype">
                      <select className="field-input" value={draft.roofType} onChange={(e) => setDraft({ roofType: e.target.value as RoofType })}>
                        <option value="">Kies…</option>
                        {ROOF_TYPES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Meest zonnige dakvlak">
                      <select className="field-input" value={draft.roofDir} onChange={(e) => setDraft({ roofDir: e.target.value as RoofDir })}>
                        <option value="">Kies…</option>
                        {ROOF_DIRS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Schaduw op het dak">
                      <select className="field-input" value={draft.shade} onChange={(e) => setDraft({ shade: e.target.value as Shade })}>
                        <option value="">Kies…</option>
                        {SHADES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </Field>
                    <label className="flex items-end gap-3 pb-3 text-sm">
                      <input type="checkbox" className="accent-teal" checked={draft.hasSolar} onChange={(e) => setDraft({ hasSolar: e.target.checked })} />
                      Er liggen al zonnepanelen
                    </label>
                  </div>
                  <p className="text-xs text-muted">
                    <strong>Gratis:</strong> basisresultaat en match. Deze dakgegevens gaan mee in het optionele Fit-rapport voor de installateur.
                  </p>
                </>
              ) : null}
              {step === 2 ? (
                <>
                  <h2 className="text-2xl">Wanneer wil je beginnen?</h2>
                  <p className="text-sm text-muted">Een inschatting is genoeg.</p>
                  {TERMS.map((t) => (
                    <label key={t} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-4", draft.term === t ? "border-teal bg-mint/20" : "border-line")}>
                      <input
                        type="radio"
                        name="term"
                        className="accent-teal"
                        checked={draft.term === t}
                        onChange={() => setDraft({ term: t as Term })}
                      />
                      <strong>{t}</strong>
                    </label>
                  ))}
                </>
              ) : null}
              {step === 3 ? (
                <>
                  <h2 className="text-2xl">Maak je gratis scan compleet.</h2>
                  <p className="text-sm text-muted">We sturen je scan niet door voordat je zelf om een match vraagt.</p>
                  <Field label="Naam">
                    <input required autoComplete="name" value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} className="field-input" />
                  </Field>
                  <Field label="E-mailadres">
                    <input required type="email" autoComplete="email" value={draft.email} onChange={(e) => setDraft({ email: e.target.value })} className="field-input" />
                  </Field>
                  <Field label="Telefoonnummer">
                    <input required type="tel" minLength={9} autoComplete="tel" value={draft.phone} onChange={(e) => setDraft({ phone: e.target.value })} className="field-input" />
                  </Field>
                  <label className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 accent-teal" checked={draft.consent} onChange={(e) => setDraft({ consent: e.target.checked })} />
                    Ik ga akkoord met het opslaan van mijn antwoorden voor deze scan en een eventuele match die ik zelf aanvraag.
                  </label>
                  <p className="text-xs text-muted">De basisanalyse en installateursmatch zijn gratis. Het uitgebreide rapport van €39 is optioneel.</p>
                </>
              ) : null}
              {error ? <p className="text-sm font-medium text-red-700" role="alert">{error}</p> : null}
              <div className="flex items-center justify-between pt-2">
                {step ? (
                  <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                    Terug
                  </Button>
                ) : (
                  <span />
                )}
                <Button type="submit">
                  {step === 3 ? "Aanvraag opslaan" : "Volgende"} <ArrowRight className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted">Je antwoorden blijven tijdens deze sessie in dit tabblad bewaard.</p>
            </form>
          </section>
          <Aside />
        </div>
      </Wrap>
    </main>
  );
}

function Aside() {
  return (
    <aside className="h-fit rounded-lg border border-line bg-white p-6">
      <div className="mb-4 flex size-11 items-center justify-center rounded-sm bg-mint text-teal">
        <Shield className="size-5" />
      </div>
      <h3 className="font-display text-2xl">
        Waardevol inzicht.
        <br />
        Zonder betaalmuur.
      </h3>
      <div className="mt-5 space-y-2 text-sm">
        <div className="flex gap-2"><Check className="size-4 text-teal" />Gratis basisresultaat</div>
        <div className="flex gap-2"><Check className="size-4 text-teal" />Gratis installateursmatch</div>
        <div className="flex gap-2"><Check className="size-4 text-teal" />Eén gerichte aanvraag</div>
        <div className="flex gap-2"><Check className="size-4 text-teal" />Premiumrapport alleen als jij dat wilt</div>
      </div>
      <p className="mt-6 text-sm text-muted">
        <strong className="text-ink">Je woningscan is gratis.</strong>
        <br />
        Een match met een installateur is ook gratis.
        <br />
        <br />
        Liever WhatsApp?
        <br />
        <a href={CONTACT.whatsapp} className="font-semibold text-teal" target="_blank" rel="noopener noreferrer">
          Stuur WhatsApp
        </a>
      </p>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-3">
      <small className="text-[11px] uppercase tracking-wider text-muted">{label}</small>
      <strong className="mt-1 block font-display text-lg capitalize">{value}</strong>
    </div>
  );
}
