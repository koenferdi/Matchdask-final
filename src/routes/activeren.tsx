import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Wrap } from "@/components/site-shell";

type Search = { token?: string };

type View = {
  loading: boolean;
  state: "ontbreekt" | "laden" | "klaar" | "actief" | "al-actief" | "verlopen" | "ongeldig" | "fout";
  company: string;
  message: string;
  mailed: boolean | null;
  confirmationPending: boolean;
};

export const Route = createFileRoute("/activeren")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token.slice(0, 200) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Activeer je Matchdesk-account" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActiverenPage,
});

function ActiverenPage() {
  const { token } = Route.useSearch();
  const [view, setView] = useState<View>({
    loading: Boolean(token),
    state: token ? "laden" : "ontbreekt",
    company: "",
    message: token ? "" : "Deze pagina heeft een activatielink uit de mail van Matchdesk nodig.",
    mailed: null,
    confirmationPending: false,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetch("/api/partner/activeren", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => ({ res, data: await res.json().catch(() => ({})) }))
      .then(({ data }) => {
        if (cancelled) return;
        const state = data.state === "klaar" || data.state === "al-actief" || data.state === "verlopen" || data.state === "ongeldig"
          ? data.state
          : "fout";
        setView({
          loading: false,
          state,
          company: typeof data.company === "string" ? data.company : "",
          message: typeof data.message === "string" ? data.message : "De activatielink kon niet worden gelezen.",
          mailed: null,
          confirmationPending: Boolean(data.confirmationPending),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setView({
          loading: false,
          state: "fout",
          company: "",
          message: "De activatiepagina is nu niet bereikbaar. Probeer het zo opnieuw.",
          mailed: null,
          confirmationPending: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function confirm() {
    if (!token || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/partner/activeren", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, confirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setView({
          loading: false,
          state: data.state === "verlopen" || data.state === "ongeldig" ? data.state : "fout",
          company: typeof data.company === "string" ? data.company : view.company,
          message: typeof data.message === "string" ? data.message : "Activeren lukte niet.",
          mailed: null,
          confirmationPending: false,
        });
        return;
      }
      setView({
        loading: false,
        state: "actief",
        company: typeof data.company === "string" ? data.company : view.company,
        message: typeof data.message === "string" ? data.message : "Je bedrijf is geactiveerd.",
        mailed: Boolean(data.mailed),
        confirmationPending: !data.mailed,
      });
    } catch {
      setView((current) => ({
        ...current,
        state: "fout",
        message: "Activeren lukte niet door een verbindingsfout.",
      }));
    } finally {
      setBusy(false);
    }
  }

  const title =
    view.state === "actief" || view.state === "al-actief"
      ? view.company
        ? `${view.company} is actief.`
        : "Je account is actief."
      : "Activeer je account.";

  return (
    <main className="bg-paper py-16 text-ink">
      <Wrap>
        <PageIntro kicker="Partneractivatie" title={title}>
          {view.state === "actief" || view.state === "al-actief"
            ? "Eén lead, één installateur. De bevestiging volgt per e-mail nadat de activatie gelukt is."
            : "Matchdesk heeft KvK en werkgebied gecontroleerd. Pas na deze stap staat het bedrijf op Actief."}
        </PageIntro>
        <section className="max-w-xl rounded-lg border border-line bg-white p-8">
          {view.loading ? <div className="h-24 animate-pulse rounded-md bg-line/60" /> : null}
          {!view.loading && (view.state === "actief" || view.state === "al-actief") ? (
            <div className="mb-4 flex size-12 items-center justify-center rounded-sm bg-mint text-teal">
              <Check className="size-5" />
            </div>
          ) : null}
          {!view.loading ? <p className="text-muted">{view.message}</p> : null}
          {view.state === "klaar" ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted">
                Eerste gewonnen klus €0 commissie, daarna 10% (max €400 panelen / €600 batterij).
              </p>
              <Button type="button" onClick={() => void confirm()} disabled={busy}>
                {busy ? "Bezig…" : "Activeer account"}
              </Button>
            </div>
          ) : null}
          {view.confirmationPending && (view.state === "actief" || view.state === "al-actief") ? (
            <div className="mt-6">
              <Button type="button" onClick={() => void confirm()} disabled={busy}>
                {busy ? "Bezig…" : "Bevestigingsmail opnieuw"}
              </Button>
            </div>
          ) : null}
          {view.state === "actief" || view.state === "al-actief" ? (
            <div className="mt-6">
              <Button asChild>
                <Link to="/bedrijf">Naar je portaal</Link>
              </Button>
            </div>
          ) : null}
        </section>
      </Wrap>
    </main>
  );
}
