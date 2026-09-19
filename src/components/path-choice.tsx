import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Wrap } from "@/components/site-shell";

export const PATHS = [
  {
    to: "/woning" as const,
    key: "woning",
    kicker: "WONINGEIGENAAR",
    title: "Voor je huis",
    body: "Eén aanvraag. Eén installateur. Geselecteerd op kwaliteit en jouw postcode.",
    image: "/higgsfield/home-desktop-poster.png",
    featured: true,
  },
  {
    to: "/voor-bedrijven" as const,
    key: "bedrijf",
    kicker: "INSTALLATEUR",
    title: "Ik installeer",
    body: "Gratis aanmelden. 1:1-aanvragen in jouw werkgebied. Geen veiling.",
    image: "/higgsfield/installer.webp",
    featured: false,
  },
  {
    to: "/" as const,
    key: "orientatie",
    kicker: "ORIËNTATIE",
    title: "Ik kijk nog rond",
    body: "Hoe matching werkt. Tools en inzichten. Geen account nodig.",
    image: "/higgsfield/battery.webp",
    featured: false,
  },
] as const;

export function PathGate({ onStay }: { onStay: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("md-gate");
    return () => document.body.classList.remove("md-gate");
  }, []);

  return (
    <main className="path-gate">
      <div className="path-gate-head">
        <p className="path-gate-kicker">Eén aanvraag. Eén installateur.</p>
        <h1>Waarvoor kom je?</h1>
        <p className="path-gate-lead">Kies je ingang. De pagina die volgt is voor jou gemaakt.</p>
      </div>
      <div className="path-triptych">
        {PATHS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`path-panel${p.featured ? " is-featured" : ""}`}
            onClick={() => {
              if (p.to === "/") onStay();
              else void navigate({ to: p.to });
            }}
          >
            <img src={p.image} alt="" />
            <span className="path-panel-scrim" />
            <span className="path-panel-copy">
              <span className="path-panel-kicker">{p.kicker}</span>
              <strong>
                {p.title}
                <ArrowRight />
              </strong>
              <span className="path-panel-body">{p.body}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="path-gate-note">Matchdesk bemiddelt. Jouw installateur voert uit.</p>
    </main>
  );
}

export function PathChoice({ current }: { current: "/" | "/woning" | "/voor-bedrijven" }) {
  const here = PATHS.find((p) => p.to === current);
  return (
    <div className="border-b border-white/8 bg-deep px-5 py-3 text-sm text-mint/80 md:px-16">
      <Wrap className="flex flex-wrap items-center justify-between gap-2 !px-0">
        <span>
          Je pad: <strong className="text-paper">{here?.title ?? "Oriëntatie"}</strong>
        </span>
        <a href="/?kies=1" className="inline-flex items-center gap-1 text-mint hover:text-paper">
          Andere keuze <ArrowRight className="size-3.5" />
        </a>
      </Wrap>
    </div>
  );
}
