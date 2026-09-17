import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { AuthForm, rememberedRole, type AuthMode, type AuthRole } from "@/components/auth-form";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isOwner } from "@/lib/owner";

type Search = {
  role?: AuthRole;
  mode?: AuthMode;
  next?: string;
  email?: string;
  name?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    role: s.role === "bedrijf" ? "bedrijf" : s.role === "klant" ? "klant" : undefined,
    mode: s.mode === "aanmelden" ? "aanmelden" : s.mode === "inloggen" ? "inloggen" : undefined,
    next: typeof s.next === "string" ? s.next : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
  }),
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [role, setRole] = useState<AuthRole>(search.role || rememberedRole() || "klant");
  const [mode, setMode] = useState<AuthMode>(search.mode || "aanmelden");

  if (isPending) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-paper">
        <div className="h-8 w-40 animate-pulse rounded-sm bg-line" />
      </main>
    );
  }
  if (user) {
    if (isOwner(user) || search.next === "/beheer") return <Navigate to="/beheer" />;
    if (search.next === "/bedrijf" || (!search.next && role === "bedrijf")) return <Navigate to="/bedrijf" />;
    if (search.next === "/portalen") return <Navigate to="/portalen" />;
    return <Navigate to="/klant" />;
  }

  return (
    <main className="grid min-h-[70vh] place-items-center bg-paper px-6 py-16 text-ink">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-8 shadow-[var(--shadow-card)]">
        <Brand className="mb-6 text-[24px]" />
        <AuthForm
          role={role}
          mode={mode}
          next={search.next}
          email={search.email}
          name={search.name}
          onRoleChange={setRole}
          onModeChange={setMode}
        />
        <p className="mt-6 text-xs text-muted">
          Matchdesk bemiddelt. We sturen niets naar een installateur voordat jij om een match vraagt.
        </p>
      </div>
    </main>
  );
}
