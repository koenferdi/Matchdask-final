import type { AppUser } from "@/lib/auth/use-current-user";

const OWNER_EMAILS = new Set([
  "info@getmatchdesk.nl",
  "koenferdi@gmail.com",
  "koen@getmatchdesk.nl",
  "koen.ferdi@gmail.com",
  "koeen.033@live.nl",
]);

export function isOwnerEmail(email?: string | null) {
  const value = email?.trim().toLowerCase() ?? "";
  if (!value) return false;
  if (OWNER_EMAILS.has(value)) return true;
  if (value.endsWith("@getmatchdesk.nl")) return true;
  return false;
}

export function isOwner(user: AppUser | null | undefined) {
  if (!user) return false;
  if (isOwnerEmail(user.primaryEmail)) return true;
  const name = user.displayName?.trim().toLowerCase() ?? "";
  return name.startsWith("koen ");
}