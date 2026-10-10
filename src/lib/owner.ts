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
  return OWNER_EMAILS.has(value);
}

export function isOwner(user: AppUser | null | undefined) {
  if (!user) return false;
  // Presentation names are editable and do not establish an admin identity.
  // Server endpoints additionally require a verified authenticated e-mail.
  return isOwnerEmail(user.primaryEmail);
}
