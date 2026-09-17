import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Wrap } from "@/components/site-shell";
import { cn } from "@/lib/cn";

export function CinemaHero() {
  const pin = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(reduce.matches);
    const onReduce = () => setReduced(reduce.matches);
    reduce.addEventListener("change", onReduce);

    const el = pin.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const total = Math.max(1, el.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
        setProgress(p);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      reduce.removeEventListener("change", onReduce);
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const p = reduced ? 0 : progress;
  const scale = 1 + p * 0.1;
  const x = p * -3.2;
  const y = p * -2.4;
  const copyFade = Math.max(0, 1 - p * 1.35);

  return (
    <section ref={pin} className="cinema-film" aria-label="Openingsbeeld">
      <div className="cinema-stage">
        <picture className="cinema-poster">
          <source media="(max-width:720px)" srcSet="/higgsfield/home-mobile-poster.png" />
          <img
            src="/higgsfield/home-desktop-poster.png"
            alt="Nederlandse woning met zonnepanelen en een thuisbatterij"
            fetchPriority="high"
            style={{ transform: `scale(${scale}) translate3d(${x}%, ${y}%, 0)` }}
          />
        </picture>
        <div className="cinema-scrim" style={{ opacity: 0.75 + p * 0.25 }} />
        <Wrap className="cinema-copy" style={{ opacity: copyFade, transform: `translate3d(0, ${p * -28}px, 0)` }}>
          <span className="mb-6 block text-xs font-medium tracking-[0.13em] text-mint cinema-in">
            ZONNEPANELEN & THUISBATTERIJEN
          </span>
          <h1 className="text-[clamp(2.6rem,5.45vw,5rem)] font-medium leading-[1.07] tracking-[-0.055em] cinema-in">
            Eén aanvraag.
            <br />
            <span className="text-mint">Eén installateur.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-mint/80 cinema-in">
            Grote plannen voor je woning? Wij verbinden je met één passende installateur.
            Geselecteerd op kwaliteit, expertise en jouw regio.
          </p>
          <Link to="/aanvragen" className="cinema-cta cinema-in">
            Vind mijn match
            <span>
              <ArrowRight className="size-5" />
            </span>
          </Link>
          <div className="mt-6 flex flex-wrap gap-5 text-sm text-mint cinema-in">
            <span className="inline-flex items-center gap-2">
              <Check className="size-4" /> Persoonlijk geselecteerd
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="size-4" /> Eén op één gekoppeld
            </span>
          </div>
        </Wrap>
        <Wrap className="cinema-footer" style={{ opacity: copyFade }}>
          <a href="#werkwijze" className="cinema-scroll">
            <i />
            Scroll voor de volgende stap
          </a>
        </Wrap>
      </div>
    </section>
  );
}

export function HomeScrollReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("main > section:not(.cinema-film)");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.classList.add("is-in");
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return null;
}
