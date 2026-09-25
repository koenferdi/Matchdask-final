/**
 * Soft launch West-Brabant scarcity banner.
 * Max 8 partner slots = start capacity in West-Brabant, not a geographic monopoly.
 * Per aanvraag 1:1. No fake countdown.
 */
export function SoftLaunchWestBrabant({
  taken = 0,
  ctaHref = "#aanmelden",
}: {
  taken?: number;
  ctaHref?: string;
}) {
  const open = Math.max(0, Math.min(8, 8 - taken));
  const slotLabel =
    taken === 0 ? "Nog 8 open in West-Brabant" : `${open} open in West-Brabant`;
  return (
    <aside
      className="relative overflow-hidden rounded-lg border border-line bg-night px-6 py-6 text-paper sm:px-7"
      aria-label="Soft launch West-Brabant"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-bright/15 blur-2xl"
        aria-hidden
      />
      <div className="relative inline-flex items-center gap-2 rounded-full border border-bright/35 bg-bright/12 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-mint">
        <span className="size-2 rounded-full bg-bright motion-safe:animate-[md-sl-pulse_2.2s_cubic-bezier(.2,.75,.25,1)_infinite]" aria-hidden />
        Soft launch West-Brabant · max 8 partnerplekken
      </div>
      <h2 className="relative mt-4 max-w-[22ch] font-display text-[clamp(1.6rem,3.2vw,2.25rem)] tracking-tight">
        Claim jouw plek in de soft launch
      </h2>
      <p className="relative mt-2 mb-5 max-w-[46ch] text-[15px] leading-relaxed text-mint/70">
        Geen leadveiling. Per aanvraag één installateur. Acht plekken is de startcapaciteit in West-Brabant, geen alleenrecht op Breda.
      </p>
      <a
        href={ctaHref}
        className="relative inline-flex rounded-md bg-mint px-5 py-3.5 text-sm font-semibold text-night transition-transform hover:-translate-y-0.5"
      >
        Claim jouw plek →
      </a>
      <div
        className="relative mt-5 flex flex-wrap gap-2"
        role="img"
        aria-label={`${open} van 8 open`}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className={
              i < taken
                ? "size-7 rounded-md border border-bright/40 bg-bright/40"
                : "size-7 rounded-md border border-paper/20 bg-paper/5"
            }
          />
        ))}
      </div>
      <p className="relative mt-2 text-xs text-mint/70">{slotLabel}</p>
    </aside>
  );
}
