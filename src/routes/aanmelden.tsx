import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";
import { SoftLaunchWestBrabant } from "@/components/marketing/soft-launch-west-brabant";
import { PRODUCTS, type Product } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";

export const Route = createFileRoute("/aanmelden")({ component: Aanmelden });

function Aanmelden() {
  const submitPartner = useMatchdesk((s) => s.submitPartner);
  const [done, setDone] = useState<{ name: string; email: string } | null>(null);
  const [products, setProducts] = useState<Product[]>(["Zonnepanelen"]);
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const kvk = String(data.get("kvk") || "").trim();
    const prefixes = String(data.get("prefixes") || "")
      .split(/[,\s]+/)
      .map((p) => p.replace(/\D/g, "").slice(0, 2))
      .filter((p) => p.length === 2);
    const capacity = Number(data.get("capacity") || 3);
    if (!name || !email) return setError("Vul bedrijfsnaam en e-mail in.");
    if (!products.length) return setError("Kies minstens één specialisme.");
    if (!prefixes.length) return setError("Vul postcodegebieden in, bijvoorbeeld 35 34 39.");
    submitPartner({ name, email, kvk, products, prefixes, capacity });
    setDone({ name, email });
  }

  if (done) {
    return (
      <main className="bg-paper py-16 text-ink">
        <Wrap>
          <PageIntro kicker="Aanmelding ontvangen · gratis" title="Binnen. Geen betaling nodig.">
            Je bedrijf staat klaar voor beoordeling. Aanmelden kost niets. Een badge is later optioneel — niet nu.
          </PageIntro>
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <section className="rounded-lg border border-line bg-white p-8">
              <div className="mb-4 flex size-12 items-center justify-center rounded-sm bg-mint text-teal">
                <Check className="size-5" />
              </div>
              <h2 className="text-3xl">Je aanmelding is binnen.</h2>
              <p className="mt-3 text-muted">
                Matchdesk beoordeelt KvK, vak en werkgebied. Bij toelating ontvang je 1:1-aanvragen. Geen inschrijfgeld.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <Link
                    to="/login"
                    search={{
                      role: "bedrijf",
                      mode: "aanmelden",
                      next: "/bedrijf",
                      email: done.email,
                      name: done.name,
                    }}
                  >
                    Bedrijfsaccount maken
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/voor-bedrijven">Terug</Link>
                </Button>
              </div>
            </section>
            <aside className="h-fit rounded-lg border border-line bg-white p-6">
              <h3 className="font-display text-2xl">Later, als je wilt</h3>
              <p className="mt-2 text-sm text-muted">
                Exclusief-proof is een optionele keuring voor een publieke badge. Geen voorwaarde om mee te doen.
              </p>
              <Link to="/exclusief" className="mt-3 inline-block text-sm font-semibold text-teal">
                Wat de badge is
              </Link>
            </aside>
          </div>
        </Wrap>
      </main>
    );
  }

  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap>
        <PageIntro kicker="Gratis aanmelden" title="Jouw bedrijf. Ons netwerk.">
          Geen inschrijfgeld. Je vult KvK, vak en werkgebied in. Daarna beoordelen wij. Een badge is later optioneel.
        </PageIntro>
        <div className="mt-8">
          <SoftLaunchWestBrabant ctaHref="#aanmelden" taken={0} />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
          <section className="rounded-lg border border-line bg-white p-8">
            <h2 className="text-2xl">Vertel ons wie je bent.</h2>
            <p className="mt-1 text-sm text-muted">De aanmelding wordt opgeslagen en verschijnt in beheer ter beoordeling.</p>
            <form id="aanmelden" onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                Bedrijfsnaam
                <input name="name" required autoComplete="organization" placeholder="Naam installatiebedrijf" className="field-input mt-1.5" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Zakelijk e-mailadres
                  <input name="email" required type="email" autoComplete="email" className="field-input mt-1.5" />
                </label>
                <label className="block text-sm font-semibold">
                  KvK-nummer
                  <input name="kvk" pattern="[0-9]{8}" inputMode="numeric" maxLength={8} placeholder="8 cijfers" className="field-input mt-1.5" />
                </label>
              </div>
              <fieldset>
                <legend className="text-sm font-semibold">Specialismen</legend>
                <div className="mt-2 space-y-2">
                  {PRODUCTS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-teal"
                        checked={products.includes(p)}
                        onChange={(e) =>
                          setProducts((cur) => (e.target.checked ? [...cur, p] : cur.filter((x) => x !== p)))
                        }
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-semibold">
                Postcodegebieden
                <input name="prefixes" required placeholder="35 34 39" className="field-input mt-1.5" />
                <span className="mt-1 block text-xs font-normal text-muted">Eerste twee cijfers, gescheiden door een spatie.</span>
              </label>
              <label className="block text-sm font-semibold">
                Vrije projectcapaciteit
                <input name="capacity" type="number" min={1} max={20} defaultValue={3} className="field-input mt-1.5" />
              </label>
              {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
              <Button type="submit">
                Bedrijf aanmelden <ArrowRight className="size-4" />
              </Button>
            </form>
          </section>
          <aside className="h-fit rounded-lg border border-line bg-white p-6 text-sm text-muted">
            <h3 className="font-display text-2xl text-ink">Geen abonnement.</h3>
            <p className="mt-3">Commissie geldt alleen als de klus doorgaat. Eerste gewonnen klus via Matchdesk: €0 commissie.</p>
          </aside>
        </div>
      </Wrap>
    </main>
  );
}
