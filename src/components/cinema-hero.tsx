import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Pause, Play } from "lucide-react";
import { Wrap } from "@/components/site-shell";
import { cn } from "@/lib/cn";

export function CinemaHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const mobile =
    typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches;
  const src = mobile ? "/higgsfield/home-mobile.mp4" : "/higgsfield/home-desktop.mp4";

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(reduce.matches);
    const onReduce = () => setReduced(reduce.matches);
    reduce.addEventListener("change", onReduce);
    return () => reduce.removeEventListener("change", onReduce);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("muted", "");

    if (reduced || userPaused) {
      video.pause();
      setPlaying(false);
      return;
    }

    let cancelled = false;
    const tryPlay = () => {
      if (cancelled || userPaused || reduced) return;
      video.muted = true;
      const attempt = video.play();
      if (attempt) {
        attempt.then(() => { if (!cancelled) setPlaying(true); }).catch(() => {});
      }
    };

    tryPlay();
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("playing", () => setPlaying(true));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") tryPlay();
    });
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("touchstart", tryPlay);
    const retry = window.setInterval(tryPlay, 800);

    return () => {
      cancelled = true;
      window.clearInterval(retry);
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };
  }, [userPaused, reduced, src]);

  const still = userPaused || reduced;

  return (
    <section className={cn("cinema-film", playing && !still && "is-playing")} aria-label="Openingsbeeld">
      <div className="cinema-stage">
        <picture className="cinema-poster">
          <source media="(max-width:720px)" srcSet="/higgsfield/home-mobile-poster.png" />
          <img
            src="/higgsfield/home-desktop-poster.png"
            alt="Nederlandse woning met zonnepanelen en een thuisbatterij"
            fetchPriority="high"
            className={cn(still && "is-still")}
          />
        </picture>
        {!reduced ? (
          <div className="cinema-video" aria-hidden>
            <video
              ref={videoRef}
              src={src}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              poster={mobile ? "/higgsfield/home-mobile-poster.png" : "/higgsfield/home-desktop-poster.png"}
              onPlaying={() => setPlaying(true)}
            />
          </div>
        ) : null}
        <div className="cinema-scrim" />
        <Wrap className="cinema-copy">
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
        <Wrap className="cinema-footer">
          <a href="#werkwijze" className="cinema-scroll">
            <i />
            Scroll naar jouw volgende stap
          </a>
          <button
            type="button"
            className="cinema-pause"
            aria-pressed={still}
            aria-label={still ? "Beweging hervatten" : "Beweging pauzeren"}
            onClick={() => setUserPaused((v) => !v)}
          >
            {still ? <Play className="size-4" /> : <Pause className="size-4" />}
            {still ? "Beweging hervatten" : "Beweging pauzeren"}
          </button>
        </Wrap>
      </div>
    </section>
  );
}
