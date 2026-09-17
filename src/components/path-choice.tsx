import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Wrap } from "@/components/site-shell";

const PATHS = [
  {
    to: "/" as const,
    kicker: "ORIËNTATIE",
    title: "Ik kijk nog rond",
    body: "Hoe matching werkt, tools en inzichten. Geen account nodig.",
  },
  {
    to: "/woning" as const,
    kicker: "WONING",
    title: "Ik zoek een installateur",
    body: "Eén aanvraag. Eén match. Rapport en afspraak als jij dat wilt.",
  },
  {
    to: "/voor-bedrijven" as const,
    kicker: "BEDRIJF",
    title: "Ik installeer",
    body: "Keuring, badge en 1:1-aanvragen in jouw postcodes. Geen veiling.",
  },
] as const;

export function PathChoice({ current }: { current?: "/" | "/woning" | "/voor-bedrijven" }) {
  return (
    <section className="border-y border-white/8 bg-deep py-10" aria-label="Waarvoor kom je?">
      <Wrap>
        <p className="mb-5 text-[12px] font-semibold tracking-[0.14em] text-mint">WAARVOOR KOM JE?</p>
        <div className="grid gap-3 md:grid-cols-3">
          {PATHS.map((p) => {
            const on = current === p.to;
            return (
              <Link
                key={p.to}
                to={p.to}
                className={`rounded-lg border p-5 transition-colors ${
                  on ? "border-bright bg-night" : "border-white/10 hover:border-mint/40"
                }`}
              >
                <span className="text-[11px] tracking-[0.14em] text-mint/60">{p.kicker}</span>
                <strong className="mt-2 flex items-center justify-between gap-2 font-display text-xl">
                  {p.title} <ArrowRight className="size-4 shrink-0" />
                </strong>
                <p className="mt-2 text-sm text-mint/70">{p.body}</p>
              </Link>
            );
          })}
        </div>
      </Wrap>
    </section>
  );
}
