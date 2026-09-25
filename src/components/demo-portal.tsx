import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STAGES = ["Nieuw", "Gematcht", "Gesprek", "Offerte"] as const;

export function DemoPortal() {
  const [side, setSide] = useState<"woning" | "bedrijf">("woning");
  const [step, setStep] = useState(0);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-night">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-xs text-mint/60">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2.5 rounded-full bg-white/20" />
          <i className="size-2.5 rounded-full bg-white/20" />
          <i className="size-2.5 rounded-full bg-white/20" />
        </span>
        <span>matchdesk / voorbeeld</span>
        <span>INTERACTIEF · FICTIEF</span>
      </div>
      <div className="grid md:grid-cols-[200px_1fr]">
        <nav className="border-b border-white/8 p-4 md:border-b-0 md:border-r" aria-label="Voorbeeldportaal">
          <strong className="mb-3 block text-sm">Jouw Matchdesk</strong>
          <button
            type="button"
            onClick={() => setSide("woning")}
            className={`block w-full py-2 text-left text-sm ${side === "woning" ? "text-mint" : "text-mint/50 hover:text-mint"}`}
          >
            Voor mijn woning
          </button>
          <button
            type="button"
            onClick={() => setSide("bedrijf")}
            className={`block w-full py-2 text-left text-sm ${side === "bedrijf" ? "text-mint" : "text-mint/50 hover:text-mint"}`}
          >
            Voor mijn bedrijf
          </button>
        </nav>
        <div className="p-5 md:p-6">
          {side === "woning" ? <Woning step={step} setStep={setStep} /> : <Bedrijf />}
        </div>
      </div>
    </div>
  );
}

function Woning({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  const status = STAGES[Math.min(step, STAGES.length - 1)];
  return (
    <div>
      <span className="text-[11px] tracking-[0.14em] text-mint/50">FICTIEF VOORBEELD · Fleur, Utrecht</span>
      <h3 className="mt-2 font-display text-3xl">Zonnepanelen</h3>
      <p className="mt-1 text-sm text-mint/70">Kruisstraat 12 · 3511 AA · status {status}</p>
      <ol className="mt-5 flex flex-wrap gap-2">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              i <= step ? "bg-mint text-night" : "bg-white/8 text-mint/50"
            }`}
          >
            {s}
          </li>
        ))}
      </ol>
      <ul className="mt-5 space-y-2 text-sm text-mint/80">
        {step === 0 ? (
          <Line>Aanvraag staat klaar. Nog geen installateur — jij vraagt de match aan.</Line>
        ) : null}
        {step >= 1 ? <Line>Gekoppeld aan één installateur in Utrecht (fictief: Helderdak).</Line> : null}
        {step >= 2 ? <Line>Gesprek gepland: dinsdag 10:00 · telefonisch.</Line> : null}
        {step >= 3 ? <Line>Offerte volgt na schouwing. Matchdesk installeert niet.</Line> : null}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        {step < 3 ? (
          <Button type="button" variant="mint" size="sm" onClick={() => setStep(step + 1)}>
            {["Vraag match aan", "Plan een gesprek", "Naar offerte"][step]} <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setStep(0)}>
            Opnieuw bekijken
          </Button>
        )}
        <Button asChild variant="ghost" size="sm">
          <Link to="/aanvragen">Start jouw echte aanvraag</Link>
        </Button>
      </div>
    </div>
  );
}

function Bedrijf() {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <span className="text-[11px] tracking-[0.14em] text-mint/50">FICTIEF VOORBEELD · installateur</span>
      <h3 className="mt-2 font-display text-3xl">Eén aanvraag in jouw gebied</h3>
      <p className="mt-1 text-sm text-mint/70">Postcode 35xx · zonnepanelen · geen veiling</p>
      {open ? (
        <div className="mt-5 rounded-md border border-white/10 p-4">
          <strong className="block">Nieuwe match · Fleur, Utrecht</strong>
          <p className="mt-1 text-sm text-mint/70">8–12 panelen, hellend dak, 3-fase. Jij bent de enige.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="mint" size="sm" onClick={() => setOpen(false)}>
              Accepteer in dit voorbeeld
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/aanmelden">Meld je bedrijf aan</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/bedrijf">Open het bedrijfsportaal</Link>
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-mint">
          In het echte portaal zie je hier je eigen matches. Dit voorbeeld is leeggehaald.
        </p>
      )}
    </div>
  );
}

function Line({ children }: { children: string }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-bright" />
      {children}
    </li>
  );
}
