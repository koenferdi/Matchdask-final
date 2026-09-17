import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { Wrap } from "@/components/site-shell";
import { CinemaHero, HomeScrollReveal } from "@/components/cinema-hero";
import { NewsletterForm } from "@/components/newsletter-form";
import { CONTACT, kwh } from "@/lib/matchdesk";
import { ARTICLES } from "@/lib/blog";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

const STEPS = [
  {
    title: "Jouw wensen",
    body: "Vertel ons over je woning, je plannen en je gewenste termijn. Eén aanvraag is genoeg.",
    icon: "/higgsfield/icon-region.png",
  },
  {
    title: "Een zorgvuldige selectie",
    body: "We kijken naar werkgebied, vakgebied, beoordeelde kwaliteit en beschikbare capaciteit.",
    icon: "/higgsfield/icon-quality.png",
  },
  {
    title: "Eén passende installateur",
    body: "Je aanvraag gaat naar één bedrijf. Samen bespreek je de mogelijkheden, offerte en uitvoering.",
    icon: "/higgsfield/icon-match.png",
  },
] as const;

const FAQ = [
  {
    q: "Installeert Matchdesk zelf?",
    a: "Nee. Matchdesk is een bemiddelingsplatform. Je installateur geeft advies, maakt de offerte en voert het werk uit. Je sluit de installatieovereenkomst rechtstreeks met dat bedrijf.",
  },
  {
    q: "Naar hoeveel bedrijven gaat mijn aanvraag?",
    a: "Naar één passende installateur. We verspreiden je aanvraag niet over meerdere bedrijven.",
  },
  {
    q: "Waar kijken jullie naar bij de match?",
    a: "Naar je postcodegebied, het gewenste vakgebied, beoordeelde kwaliteit en de beschikbare capaciteit van een partner.",
  },
  {
    q: "Hoe verdient Matchdesk aan een match?",
    a: "Als huiseigenaar betaal je Matchdesk niets. Matchdesk ontvangt commissie van de installateur als de klus doorgaat — vaak (deels) vooraf: eerste gewonnen klus €0, daarna 10% van de dealwaarde (max. €400 bij panelen, €600 bij batterij/combi). Jouw prijs en voorwaarden spreek je rechtstreeks met de installateur af.",
  },
  {
    q: "Is er altijd een installateur beschikbaar?",
    a: "Dat hangt af van je regio, je wensen en de beschikbare partners. Is er geen passende installateur, dan blijft je aanvraag open.",
  },
  {
    q: "Kan ik een gesprek plannen?",
    a: "Maak een aanvraag aan en kies daarna in je portaal een moment voor een telefonisch gesprek. Je ziet daar de status van je afspraak.",
  },
];

function Home() {
  const [step, setStep] = useState(0);
  const [use, setUse] = useState(3500);
  const [solar, setSolar] = useState(3000);
  const [share, setShare] = useState(30);
  const direct = Math.round((solar * share) / 100);
  const fromGrid = Math.max(0, use - direct);

  return (
    <main className="bg-night text-paper">
      <HomeScrollReveal />
      <CinemaHero />

      <section id="werkwijze" className="py-24">
        <Wrap className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <span className="mb-6 block text-[12px] tracking-[0.13em] text-mint">
              EEN GOEDE MATCH MAAKT HET VERSCHIL
            </span>
            <div className="font-display text-[clamp(5rem,12vw,9rem)] font-medium leading-none tracking-[-0.06em]">
              1<span className="text-bright">:</span>1
            </div>
            <h2 className="mt-8 text-[clamp(2rem,3.6vw,3.4rem)]">
              Geen keuzestress.
              <br />
              Wel de juiste connectie.
            </h2>
            <p className="mt-5 text-mint/70">
              Je zoekt iemand die het goed doet.
              <br />
              Wij helpen je die te vinden.
            </p>
          </div>
          <div className="space-y-2">
            {STEPS.map((item, i) => {
              const open = step === i;
              return (
                <div key={item.title} className={cn("border-b border-white/10", open && "bg-deep/60")}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-2 py-5 text-left"
                    aria-expanded={open}
                    onClick={() => setStep(i)}
                  >
                    <span className="text-sm text-mint/60">0{i + 1}</span>
                    <img src={item.icon} alt="" className="size-10 object-contain" />
                    <strong className="flex-1 font-display text-xl">{item.title}</strong>
                    <Plus className={cn("size-5 transition-transform", open && "rotate-45")} />
                  </button>
                  {open ? <p className="px-2 pb-5 pl-16 text-mint/70">{item.body}</p> : null}
                </div>
              );
            })}
            <Link to="/aanvragen" className="mt-6 inline-flex items-center gap-2 pt-4 text-sm font-semibold text-mint">
              Ontdek jouw match <ArrowRight className="size-4" />
            </Link>
          </div>
        </Wrap>
      </section>

      <section id="oplossingen" className="py-24">
        <Wrap>
          <div className="mb-12">
            <h2 className="text-[clamp(2rem,3.6vw,3.4rem)]">
              Maak meer van
              <br />
              je eigen energie.
            </h2>
            <p className="mt-4 text-mint/70">
              Een zonnig dak. Een slimme batterij.
              <br />
              Of allebei, in één doordacht plan.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ProductCard
              product="Zonnepanelen"
              image="/higgsfield/solar.webp"
              n="01 / OPWEKKEN"
              title="Zonnepanelen"
              body="Geef je dak een nieuwe rol."
            />
            <ProductCard
              product="Thuisbatterij"
              image="/higgsfield/battery.webp"
              n="02 / OPSLAAN"
              title="Thuisbatterij"
              body="Bewaar energie voor een ander moment."
            />
          </div>
          <Link
            to="/aanvragen"
            search={{ product: "Zonnepanelen + thuisbatterij" }}
            className="mt-6 flex flex-col gap-1 border border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between"
          >
            <span className="text-sm text-mint/70">Liever het complete plaatje?</span>
            <strong className="inline-flex items-center gap-2 font-display text-xl">
              Zonnepanelen + thuisbatterij <ArrowRight className="size-4" />
            </strong>
          </Link>
        </Wrap>
      </section>

      <section className="bg-deep py-24">
        <Wrap>
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="text-[clamp(2rem,3.6vw,3.4rem)]">
              Een match is het begin.
              <br />
              Overzicht blijft.
            </h2>
            <div>
              <p className="text-mint/70">
                Je aanvraag, de volgende stap en je afspraken.
                <br />
                Een eigen plek voor iedereen.
              </p>
              <Link to="/portalen" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-mint">
                Ontdek de portalen <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-night">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-xs text-mint/60">
              <span className="flex gap-1.5">
                <i className="size-2.5 rounded-full bg-white/20" />
                <i className="size-2.5 rounded-full bg-white/20" />
                <i className="size-2.5 rounded-full bg-white/20" />
              </span>
              <span>matchdesk / jouw werkruimte</span>
              <span>INTERACTIEF VOORBEELD</span>
            </div>
            <div className="grid md:grid-cols-[220px_1fr]">
              <nav className="border-b border-white/8 p-5 md:border-b-0 md:border-r" aria-label="Voorbeeldportaal">
                <strong className="mb-4 block text-sm">Jouw Matchdesk</strong>
                <Link to="/klant" className="flex items-center gap-2 py-2 text-sm text-mint">
                  Voor mijn woning
                </Link>
                <Link to="/bedrijf" className="flex items-center gap-2 py-2 text-sm text-mint/60 hover:text-mint">
                  Voor mijn bedrijf
                </Link>
                <Link to="/blog" className="flex items-center gap-2 py-2 text-sm text-mint/60 hover:text-mint">
                  Inzicht & blog
                </Link>
              </nav>
              <div className="p-6">
                <span className="text-[11px] tracking-[0.14em] text-mint/50">FICTIEF VOORBEELD</span>
                <h3 className="mt-2 font-display text-3xl">Welkom thuis, Fleur.</h3>
                <p className="mt-2 text-mint/70">Jouw energieproject krijgt vorm.</p>
                <img
                  src="/higgsfield/solar.webp"
                  alt="Illustratie bij het voorbeeldportaal"
                  className="mt-6 h-48 w-full rounded-md object-cover"
                />
              </div>
            </div>
          </div>
        </Wrap>
      </section>

      <section className="relative overflow-hidden py-24">
        <img
          src="/higgsfield/installer.webp"
          alt="Illustratief beeld van vakmanschap bij een woning"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-night/70" />
        <Wrap className="relative">
          <span className="mb-6 block text-[12px] tracking-[0.13em] text-mint">VOOR VAKBEDRIJVEN</span>
          <h2 className="max-w-xl text-[clamp(2rem,3.6vw,3.4rem)]">
            Jij doet het werk.
            <br />
            Wij maken
            <br />
            de connectie.
          </h2>
          <p className="mt-5 max-w-md text-mint/75">
            Aanvragen in jouw werkgebied, passend bij jouw vak. Eén op één toegewezen. Jij houdt grip op je
            capaciteit.
          </p>
          <Link
            to="/aanmelden"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-mint"
          >
            Word Matchdesk-partner <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-sm text-mint/50">
            Commissie als de klus doorgaat.
            <br />
            De afspraken maken we vooraf helder.
          </p>
        </Wrap>
      </section>

      <section id="tools" className="py-24">
        <Wrap className="grid gap-12 lg:grid-cols-2">
          <div>
            <img src="/higgsfield/icon-solar.png" alt="" className="mb-6 size-14" />
            <h2 className="text-[clamp(2rem,3.6vw,3.4rem)]">
              Een beetje inzicht.
              <br />
              Een betere start.
            </h2>
            <p className="mt-4 max-w-md text-mint/70">
              Breng je verbruik en opwek bij elkaar. Handig om mee te nemen in je eerste gesprek.
            </p>
            <Link to="/tools" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-mint">
              Ontdek alle tools <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="rounded-lg border border-white/10 bg-deep p-6">
            <div className="mb-6 flex items-center justify-between text-[11px] tracking-[0.14em] text-mint/60">
              JOUW ENERGIEPROFIEL <span>01 / TOOL</span>
            </div>
            <Slider label="Jaarverbruik" value={`${use.toLocaleString("nl-NL")} kWh`} min={1000} max={15000} step={100} current={use} onChange={setUse} />
            <Slider label="Opwek zonnepanelen" value={`${solar.toLocaleString("nl-NL")} kWh`} min={0} max={15000} step={100} current={solar} onChange={setSolar} />
            <Slider label="Aandeel direct eigen gebruik" value={`${share}%`} min={0} max={100} step={5} current={share} onChange={setShare} />
            <div className="mt-6">
              <span className="text-sm text-mint/60">Van je panelen naar je huis</span>
              <strong className="mt-1 block font-display text-4xl tabular-nums">
                {direct.toLocaleString("nl-NL")}
                <small className="ml-1 text-base font-normal text-mint/60"> kWh / jaar</small>
              </strong>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <i className="block h-full bg-bright" style={{ width: `${Math.min(100, (direct / Math.max(use, 1)) * 100)}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-mint/50">
                <span>Direct gebruik</span>
                <span>Uit het net: {kwh(fromGrid)}</span>
              </div>
            </div>
            <p className="mt-5 text-xs text-mint/50">
              Vereenvoudigde jaarbalans met jouw invoer. Geen besparingsbelofte of batterijadvies: tijdstip,
              tarieven en installatie tellen hier niet mee.
            </p>
          </div>
        </Wrap>
      </section>

      <section className="py-24">
        <Wrap className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-[clamp(2rem,3.6vw,3.4rem)]">
              Goede vragen.
              <br />
              Heldere antwoorden.
            </h2>
            <p className="mt-4 text-mint/70">
              Liever even persoonlijk contact?
              <br />
              <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-mint">
                Stuur WhatsApp <ArrowRight className="size-4" />
              </a>
            </p>
          </div>
          <div>
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-white/10 py-4">
                <summary className="cursor-pointer list-none font-display text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-mint/70">{item.a}</p>
              </details>
            ))}
          </div>
        </Wrap>
      </section>

      <section className="border-t border-white/8 py-24">
        <Wrap className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <span className="mb-6 block text-xs tracking-[0.13em] text-mint">INZICHT</span>
            <h2 className="text-[clamp(2rem,3.6vw,3.4rem)]">
              Korte stukken.
              <br />
              Geen ruis.
            </h2>
            <p className="mt-4 max-w-md text-mint/70">
              Matching, batterijen en het eerste gesprek — zonder beloftes die een installateur niet kan waarmaken.
            </p>
            <div className="mt-10 grid gap-6">
              {ARTICLES.map((a) => (
                <Link key={a.slug} to="/blog/$slug" params={{ slug: a.slug }} className="group border-t border-white/10 pt-5">
                  <span className="text-xs tracking-[0.12em] text-mint/50">{a.kicker}</span>
                  <strong className="mt-2 block font-display text-2xl group-hover:text-mint">{a.title}</strong>
                  <p className="mt-2 text-sm text-mint/65">{a.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-deep p-7">
            <h3 className="font-display text-2xl">Nieuwsbrief</h3>
            <p className="mt-3 mb-6 text-sm text-mint/70">
              Af en toe een helder stuk over wonen en energie. Geen wekelijkse storm.
            </p>
            <NewsletterForm inverted />
          </div>
        </Wrap>
      </section>

      <section className="py-28 text-center">
        <Wrap>
          <h2 className="text-[clamp(2.4rem,5vw,4.4rem)]">
            Jouw plannen.
            <br />
            <span className="text-mint">Onze volgende match.</span>
          </h2>
          <Link
            to="/aanvragen"
            className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-sm bg-mint px-6 py-3.5 text-sm font-semibold text-night"
          >
            Vind mijn match <ArrowRight className="size-4" />
          </Link>
        </Wrap>
      </section>
    </main>
  );
}

function ProductCard({
  product,
  image,
  n,
  title,
  body,
}: {
  product: string;
  image: string;
  n: string;
  title: string;
  body: string;
}) {
  return (
    <Link to="/aanvragen" search={{ product }} className="group">
      <div className="relative overflow-hidden rounded-md">
        <img src={image} alt={`Illustratie van ${title.toLowerCase()} bij een woning`} className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className="absolute left-4 top-4 text-[11px] tracking-[0.14em] text-paper">{n}</span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl">{title}</h3>
          <p className="mt-1 text-mint/70">{body}</p>
        </div>
        <ArrowRight className="mt-1 size-5 shrink-0" />
      </div>
    </Link>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="mb-5 block text-sm">
      <span className="mb-2 flex justify-between">
        {label} <strong className="tabular-nums text-mint">{value}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-bright"
      />
    </label>
  );
}
