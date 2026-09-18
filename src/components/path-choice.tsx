import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Wrap } from "@/components/site-shell";

export const PATHS = [
  {
    to: "/" as const,
    key: "orientatie",
    kicker: "ORIËNTATIE",
    title: "Ik kijk nog rond",
    body: "Hoe matching werkt, tools en inzichten. Geen account nodig.",
  },
  {
    to: "/woning" as const,
    key: "woning",
    kicker: "WONING",
    title: "Ik zoek een installateur",
    body: "Eén aanvraag. Eén match. Rapport en afspraak als jij dat wilt.",
  },
  {
    to: "/voor-bedrijven" as const,
    key: "bedrijf",
    kicker: "BEDRIJF",
    title: "Ik installeer",
    body: "Gratis aanmelden. 1:1-aanvragen in jouw postcodes. Geen veiling.",
  },
] as const;

export function PathGate({ onStay }: { onStay: () => void }) {
  const navigate = useNavigate();
  return (
    <main className="path-gate flex flex-col justify-center px-5 py-16 md:px-16">
      <div className="mx-auto w-full max-w-[1100px]">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-mint">MATCHDESK</p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.05]">
          Waarvoor kom je?
        </h1>
        <p className="mt-4 max-w-xl text-lg text-mint/75">
          Kies je pad. Daarna openen we de juiste pagina.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PATHS.map((p) => (
            <button
              key={p.key}
              type="button"
              className="path-gate-card rounded-lg border border-white/12 bg-deep p-6 text-left"
              onClick={() => {
                if (p.to === "/") onStay();
                else void navigate({ to: p.to });
              }}
            >
              <span className="text-[11px] tracking-[0.14em] text-mint/60">{p.kicker}</span>
              <strong className="mt-3 flex items-center justify-between gap-2 font-display text-2xl">
                {p.title} <ArrowRight className="size-5 shrink-0 text-bright" />
              </strong>
              <p className="mt-3 text-sm leading-6 text-mint/70">{p.body}</p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export function PathChoice({ current }: { current: "/" | "/woning" | "/voor-bedrijven" }) {
  const navigate = useNavigate();
  const here = PATHS.find((p) => p.to === current);
  return (
    <div className="border-b border-white/8 bg-deep px-5 py-3 text-sm text-mint/80 md:px-16">
      <Wrap className="flex flex-wrap items-center justify-between gap-2 !px-0">
        <span>
          Je pad: <strong className="text-paper">{here?.title ?? "Oriëntatie"}</strong>
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-mint hover:text-paper"
          onClick={() => {
            window.scrollTo(0, 0);
            void navigate({ to: "/", search: { kies: "1" } });
          }}
        >
          Andere keuze <ArrowRight className="size-3.5" />
        </button>
      </Wrap>
    </div>
  );
}
