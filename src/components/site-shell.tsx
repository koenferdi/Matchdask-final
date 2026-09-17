import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CONTACT } from "@/lib/matchdesk";
import { useMatchdesk } from "@/lib/store";
import { cn } from "@/lib/cn";
import { UserButton } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isOwner } from "@/lib/owner";

const NAV = [
  { to: "/", hash: "oplossingen", label: "Oplossingen" },
  { to: "/", hash: "werkwijze", label: "Zo werkt het" },
  { to: "/rapport", label: "Woningrapport" },
  { to: "/installateurs", label: "Installateurs" },
  { to: "/exclusief", label: "Exclusief-proof" },
  { to: "/blog", label: "Inzicht" },
  { to: "/tools", label: "Slimme tools" },
] as const;

export function SiteShell() {
  const hydrate = useMatchdesk((s) => s.hydrate);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useCurrentUserState();
  const owner = isOwner(user);
  const [open, setOpen] = useState(false);
  const dark = pathname === "/";

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={cn("min-h-svh", dark ? "bg-night text-paper" : "bg-paper text-ink")}>
      <p className="bg-deep px-4 py-2 text-center text-[13px] text-mint">
        <strong className="font-semibold">Matchdesk bemiddelt. Matchdesk installeert niet.</strong>{" "}
        Jouw installateur verzorgt de uitvoering.
      </p>
      <SiteNotice />
      <header className={cn("sticky top-0 z-40 border-b", dark ? "border-white/8 bg-night/90 backdrop-blur-md" : "border-line bg-paper/90 backdrop-blur-md")}>
        <div className="mx-auto flex min-h-16 w-full max-w-[1400px] items-center gap-3 px-4 md:min-h-20 md:px-16">
          <div className="min-w-0 shrink-0">
            <Brand inverted={dark} />
          </div>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-6 text-[14px] font-semibold lg:flex" aria-label="Hoofdnavigatie">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={"hash" in item ? item.hash : undefined}
                className={cn(
                  "transition-colors hover:text-bright",
                  "highlight" in item && item.highlight && "text-bright",
                )}
              >
                {item.label}
              </Link>
            ))}
            {owner ? (
              <Link to="/beheer" className="text-bright">
                Beheer
              </Link>
            ) : null}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <AuthSlot />
            <Button asChild variant={dark ? "mint" : "default"} size="sm" className="hidden lg:inline-flex">
              <Link to="/aanvragen">Vind mijn installateur</Link>
            </Button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-sm lg:hidden"
              aria-label={open ? "Menu sluiten" : "Menu openen"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open ? (
          <nav className="flex flex-col gap-1 border-t border-line/40 px-5 py-4 lg:hidden" aria-label="Mobiel menu">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={"hash" in item ? item.hash : undefined}
                className="rounded-sm px-2 py-3 text-base font-semibold"
              >
                {item.label}
              </Link>
            ))}
            {owner ? (
              <Link to="/beheer" className="rounded-sm px-2 py-3 text-base font-semibold text-bright">
                Beheer
              </Link>
            ) : null}
            {user ? (
              <>
                <Link to="/portalen" className="rounded-sm px-2 py-3 text-base font-semibold">
                  Mijn Matchdesk
                </Link>
                <button
                  type="button"
                  className="rounded-sm px-2 py-3 text-left text-base font-semibold"
                  onClick={() => void signOut()}
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <Link to="/login" search={{ mode: "inloggen" }} className="rounded-sm px-2 py-3 text-base font-semibold">
                  Inloggen
                </Link>
                <Link to="/login" search={{ mode: "aanmelden", role: "klant" }} className="rounded-sm px-2 py-3 text-base font-semibold">
                  Account maken
                </Link>
              </>
            )}
            <Button asChild variant="mint" className="mt-2">
              <Link to="/aanvragen">Vind mijn installateur</Link>
            </Button>
          </nav>
        ) : null}
      </header>
      <Outlet />
      <footer className={cn("border-t", dark ? "border-white/8 bg-night" : "border-line bg-paper")}>
        <div className="mx-auto grid w-full max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-4 md:px-16">
          <div className="space-y-4">
            <Brand inverted={dark} />
            <p className={cn("max-w-sm text-sm leading-7", dark ? "text-mint/70" : "text-muted")}>
              Een persoonlijke match voor jouw energie.
              <br />
              Op kwaliteit geselecteerd. In jouw regio.
              <br />
              Van eerste idee tot de juiste installateur.
            </p>
          </div>
          <FooterCol title="Voor jouw woning">
            <Link to="/aanvragen">Vind een installateur</Link>
            <Link to="/wachtlijst">Gratis woningscan</Link>
            <Link to="/rapport">Mijn woningrapport</Link>
            <Link to="/klant">Mijn project</Link>
            <Link to="/klant/afspraken">Afspraak maken</Link>
            <Link to="/tools">Slimme tools</Link>
            <Link to="/blog">Inzicht & blog</Link>
            <Link to="/nieuwsbrief">Nieuwsbrief</Link>
          </FooterCol>
          <FooterCol title="Voor jouw bedrijf">
            <Link to="/installateurs">Geverifieerde installateurs</Link>
            <Link to="/exclusief">Exclusief-proof · €149</Link>
            <Link to="/aanmelden">Bedrijf aanmelden</Link>
            <Link to="/bedrijf">Bedrijfsportaal</Link>
          </FooterCol>
          <FooterCol title="Persoonlijk contact">
            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
              WhatsApp <ArrowUpRight className="size-4" />
            </a>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <span>Matchdesk · KvK {CONTACT.kvk}</span>
          </FooterCol>
        </div>
        <div className={cn("mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-5 py-6 text-xs md:flex-row md:items-center md:justify-between md:px-16", dark ? "text-mint/50" : "text-muted")}>
          <span>© {new Date().getFullYear()} Matchdesk · KvK {CONTACT.kvk}</span>
          <span>De installateur is jouw contractpartij.</span>
          <span className="flex gap-3">
            <Link to="/privacy">Privacy</Link>
            <Link to="/voorwaarden">Voorwaarden</Link>
            <Link to="/cookies">Cookies</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 text-sm">
      <strong className="mb-1 font-display text-base">{title}</strong>
      {children}
    </div>
  );
}

export function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="mb-5 flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-teal">
        <span className="h-px w-6 bg-current" />
        {kicker}
      </p>
      <h1 className="text-[clamp(2rem,5vw,3.4rem)]">{title}</h1>
      {children ? <div className="mt-4 text-base leading-7 text-muted">{children}</div> : null}
    </div>
  );
}

export function Wrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1400px] px-5 md:px-16", className)}>{children}</div>;
}

function SiteNotice() {
  const notice = useMatchdesk((s) => s.siteNotice);
  const paused = useMatchdesk((s) => s.matchingPaused);
  if (!notice && !paused) return null;
  return (
    <p className="bg-amber px-4 py-2 text-center text-[13px] font-semibold text-ink">
      {paused ? "Matching staat tijdelijk gepauzeerd. " : null}
      {notice}
    </p>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-8 animate-pulse rounded-full bg-current/10" />;
  }
  if (user) {
    return (
      <div className="flex items-center gap-2">
        {isOwner(user) ? (
          <Link to="/beheer" className="text-sm font-semibold text-bright">
            Beheer
          </Link>
        ) : null}
        <UserButton />
      </div>
    );
  }
  return (
    <Link to="/login" search={{ mode: "inloggen" }} className="text-sm font-semibold hover:text-bright">
      Inloggen
    </Link>
  );
}
