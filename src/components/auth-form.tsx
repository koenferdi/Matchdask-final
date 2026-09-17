import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LOGIN_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { isOwnerEmail } from "@/lib/owner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type AuthRole = "klant" | "bedrijf";
export type AuthMode = "inloggen" | "aanmelden";

const ROLE_COPY = {
  klant: {
    kicker: "Voor je woning",
    signup: "Maak je klantaccount",
    login: "Log in op je project",
    next: "/klant",
  },
  bedrijf: {
    kicker: "Voor je bedrijf",
    signup: "Meld je bedrijf aan",
    login: "Log in op je werkgebied",
    next: "/bedrijf",
  },
} as const;

export function rememberRole(role: AuthRole) {
  try {
    localStorage.setItem("matchdesk.role", role);
  } catch {
    /* ignore */
  }
}

export function rememberedRole(): AuthRole | null {
  try {
    const v = localStorage.getItem("matchdesk.role");
    return v === "bedrijf" || v === "klant" ? v : null;
  } catch {
    return null;
  }
}

export function AuthForm({
  role,
  mode,
  next,
  email: emailPrefill = "",
  name: namePrefill = "",
  onRoleChange,
  onModeChange,
}: {
  role: AuthRole;
  mode: AuthMode;
  next?: string;
  email?: string;
  name?: string;
  onRoleChange?: (role: AuthRole) => void;
  onModeChange?: (mode: AuthMode) => void;
}) {
  const navigate = useNavigate();
  const copy = ROLE_COPY[role];
  const dest = next || copy.next;
  const [name, setName] = useState(namePrefill);
  const [email, setEmail] = useState(emailPrefill);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Vul een geldig e-mailadres in.");
    if (password.length < 8) return setError("Kies een wachtwoord van minstens 8 tekens.");
    setBusy(true);
    rememberRole(role);
    try {
      if (mode === "aanmelden") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || (role === "bedrijf" ? "Bedrijf" : "Klant"),
        });
        if (err) throw new Error(err.message || "Aanmelden lukte niet.");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message || "Inloggen lukte niet. Controleer e-mail en wachtwoord.");
      }
      await authClient.getSession();
      if (isOwnerEmail(email)) await navigate({ to: "/beheer" });
      else if (dest === "/bedrijf") await navigate({ to: "/bedrijf" });
      else if (dest === "/portalen") await navigate({ to: "/portalen" });
      else await navigate({ to: "/klant" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Er ging iets mis.";
      setError(
        /exist|already|taken/i.test(message)
          ? "Dit e-mailadres heeft al een account. Log in of kies een ander adres."
          : /invalid|credential|password/i.test(message)
            ? "E-mail of wachtwoord klopt niet."
            : message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {(["klant", "bedrijf"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRoleChange?.(r)}
            className={cn(
              "rounded-sm border px-3 py-3 text-sm font-semibold",
              role === r ? "border-teal bg-mint/30 text-ink" : "border-line text-muted",
            )}
          >
            {r === "klant" ? "Ik zoek een installateur" : "Ik heb een bedrijf"}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">{copy.kicker}</p>
      <h2 className="font-display text-2xl">{mode === "aanmelden" ? copy.signup : copy.login}</h2>

      {authEnabled ? (
        <div className="space-y-2">
          {LOGIN_PROVIDERS.map((p) => (
            <button
              key={p.providerId}
              type="button"
              onClick={() => {
                rememberRole(role);
                void signIn(p.providerId, { callbackURL: "/portalen" });
              }}
              className="inline-flex w-full items-center justify-center gap-3 rounded-sm border border-line px-4 py-3 text-sm font-semibold hover:border-teal hover:bg-paper"
            >
              {p.idp === "google" ? (
                <>
                  <GoogleMark />
                  Doorgaan met Google
                </>
              ) : (
                `Doorgaan met ${p.label}`
              )}
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-center text-xs text-muted">of met e-mail</p>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "aanmelden" ? (
          <input
            className="field-input"
            autoComplete="name"
            placeholder={role === "bedrijf" ? "Bedrijfsnaam" : "Je naam"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        ) : null}
        <input
          className="field-input"
          type="email"
          autoComplete="email"
          placeholder="E-mailadres"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="field-input"
          type="password"
          autoComplete={mode === "aanmelden" ? "new-password" : "current-password"}
          placeholder="Wachtwoord (min. 8 tekens)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Even geduld…" : mode === "aanmelden" ? "Account maken" : "Inloggen"}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {mode === "aanmelden" ? (
          <>
            Al een account?{" "}
            <button type="button" className="font-semibold text-teal" onClick={() => onModeChange?.("inloggen")}>
              Inloggen
            </button>
          </>
        ) : (
          <>
            Nog geen account?{" "}
            <button type="button" className="font-semibold text-teal" onClick={() => onModeChange?.("aanmelden")}>
              Aanmelden
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
