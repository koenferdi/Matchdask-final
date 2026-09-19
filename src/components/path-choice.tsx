import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Compass, Home, Wrench } from "lucide-react";
import { Wrap } from "@/components/site-shell";
import { cn } from "@/lib/cn";

export const PATHS = [
  {
    to: "/woning" as const,
    key: "woning",
    kicker: "WONING",
    title: "Ik zoek een installateur",
    body: "Eén aanvraag. Eén match. Rapport als jij dat wilt.",
    icon: Home,
    featured: true,
  },
  {
    to: "/voor-bedrijven" as const,
    key: "bedrijf",
    kicker: "BEDRIJF",
    title: "Ik installeer",
    body: "Gratis aanmelden. 1:1-aanvragen in jouw postcodes.",
    icon: Wrench,
    featured: false,
  },
  {
    to: "/" as const,
    key: "orientatie",
    kicker: "ORIËNTATIE",
    title: "Ik kijk nog rond",
    body: "Hoe matching werkt. Geen account nodig.",
    icon: Compass,
    featured: false,
  },
] as const;

export function PathGate({ onStay }: { onStay: () => void }) {
  const navigate = useNavigate();
  return (
    <main className="path-gate px-5 pb-16 pt-8 md:px-16 md:pt-12">
      <div className="mx-auto w-full max-w-xl lg:max-w-5xl">
        <h1 className="font-display text-[clamp(2rem,7vw,3.6rem)] leading-[1.08]">
          Waarvoor kom je?
        </h1>
        <p className="mt-3 max-w-md text-base text-mint/75 md:text-lg">
          Kies één pad. Daarna openen we de juiste pagina.
        </p>
        <div className="mt-8 grid gap-3 lg:grid-cols-3 lg:gap-4">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.key}
                type="button"
                className={cn(
                  "path-gate-card flex items-start gap-4 rounded-lg border p-5 text-left lg:flex-col lg:p-6",
                  p.featured
                    ? "border-bright/40 bg-mint/10"
                    : "border-white/12 bg-deep",
                )}
                onClick={() => {
                  if (p.to === "/") onStay();
                  else void navigate({ to: p.to });
                }}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-md",
                    p.featured ? "bg-mint text-night" : "bg-white/8 text-mint",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-mint/55">{p.kicker}</span>
                  <strong className="mt-1 flex items-center justify-between gap-2 font-display text-xl leading-snug lg:text-2xl">
                    {p.title}
                    <ArrowRight className="size-5 shrink-0 text-bright" />
                  </strong>
                  <p className="mt-2 text-sm leading-6 text-mint/70">{p.body}</p>
                </span>
              </button>
            );
          })}
        </div>
      </div>
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
