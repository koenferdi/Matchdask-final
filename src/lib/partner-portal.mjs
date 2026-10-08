/**
 * Partner self-serve and matchability.
 * One workspace file remains the source of truth; this only decides
 * which status/capacity edits a logged-in partner may write, and who is matchable.
 */

export const GATE_MESSAGE =
  "Matchdesk moet je eerst toelaten. Tot die tijd kun je status en capaciteit niet zelf wijzigen.";

export const ARCHIVE_MESSAGE =
  "Dit bedrijf is gearchiveerd. Alleen Matchdesk kan dat terugzetten.";

export const STATUS_MESSAGE = "Je kunt alleen Actief of Gepauzeerd kiezen.";

export const CAPACITY_MESSAGE = "Capaciteit is een geheel getal van 0 tot en met 999.";

export const NO_PARTNER_MESSAGE =
  "Geen bedrijf gekoppeld aan dit account. Gebruik het e-mailadres van je aanmelding.";

export const WRONG_PARTNER_MESSAGE = "Dit account hoort niet bij dat bedrijf.";

export const EMPTY_PATCH_MESSAGE = "Geen status of capaciteit meegegeven.";

const SELF_SERVE_STATUS = new Set(["Actief", "Gepauzeerd"]);

export function isMatchablePartner(partner) {
  if (!partner || partner.example) return false;
  if (partner.status !== "Actief") return false;
  const capacity = Number(partner.capacity);
  return Number.isFinite(capacity) && capacity > 0;
}

function admissionStamp(partner, ledgerStamp) {
  if (partner?.activatedAt) return partner.activatedAt;
  return ledgerStamp || null;
}

/**
 * review: still waiting for Gate, read-only.
 * archived: owner-only.
 * manage: partner may edit Actief/Gepauzeerd and capacity.
 * canActivate: may switch to Actief (needs an admission stamp, or they are already Actief).
 */
export function selfServeView(partner, ledgerStamp) {
  if (!partner || partner.example) return { mode: "none", canActivate: false };
  if (partner.status === "Gearchiveerd") return { mode: "archived", canActivate: false };
  const stamp = admissionStamp(partner, ledgerStamp);
  if (partner.status === "Te beoordelen" && !stamp) return { mode: "review", canActivate: false };
  if (partner.status === "Actief" || partner.status === "Gepauzeerd" || stamp) {
    return { mode: "manage", canActivate: partner.status === "Actief" || Boolean(stamp) };
  }
  return { mode: "review", canActivate: false };
}

export function parseCapacity(value) {
  if (typeof value === "boolean" || value == null) return { ok: false };
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return { ok: false };
  const capacity = Number(text);
  if (!Number.isInteger(capacity) || capacity < 0 || capacity > 999) return { ok: false };
  return { ok: true, capacity };
}

function rank(partner) {
  if (partner.status === "Actief") return 0;
  if (partner.status === "Gepauzeerd") return 1;
  if (partner.status === "Te beoordelen") return 2;
  return 3;
}

/** Partner row for this login. Same e-mail, real companies only. */
export function findOwnPartner(partners, email) {
  const needle = String(email || "").trim().toLowerCase();
  if (!needle) return null;
  const hits = (partners || []).filter(
    (partner) =>
      partner &&
      !partner.example &&
      String(partner.email || "").trim().toLowerCase() === needle,
  );
  if (!hits.length) return null;
  return [...hits].sort((a, b) => rank(a) - rank(b))[0];
}

export function resolveSelfServeTarget(partners, email, requestedId) {
  const partner = findOwnPartner(partners, email);
  if (!partner) return { ok: false, status: 404, message: NO_PARTNER_MESSAGE };
  const id = requestedId == null ? "" : String(requestedId).trim();
  if (id && id !== partner.id) {
    return { ok: false, status: 409, message: WRONG_PARTNER_MESSAGE };
  }
  return { ok: true, partner };
}

export function applyPartnerSelfServe(current, patch, ledgerStamp) {
  const view = selfServeView(current, ledgerStamp);
  if (view.mode === "archived") {
    return { ok: false, status: 403, code: "archived", message: ARCHIVE_MESSAGE, partner: current };
  }
  if (view.mode !== "manage") {
    return { ok: false, status: 403, code: "gate", message: GATE_MESSAGE, partner: current };
  }

  const source = patch && typeof patch === "object" ? patch : {};
  const hasStatus = source.status != null && String(source.status).trim() !== "";
  const hasCapacity = source.capacity != null && String(source.capacity).trim() !== "";
  if (!hasStatus && !hasCapacity) {
    return { ok: false, status: 422, code: "empty", message: EMPTY_PATCH_MESSAGE, partner: current };
  }

  const next = { ...current };
  const stamp = admissionStamp(current, ledgerStamp);
  if (stamp && !next.activatedAt) next.activatedAt = stamp;

  if (hasStatus) {
    const status = String(source.status).trim();
    if (!SELF_SERVE_STATUS.has(status)) {
      return { ok: false, status: 422, code: "status", message: STATUS_MESSAGE, partner: current };
    }
    if (status === "Actief" && !view.canActivate) {
      return { ok: false, status: 403, code: "gate", message: GATE_MESSAGE, partner: current };
    }
    next.status = status;
  }

  if (hasCapacity) {
    const parsed = parseCapacity(source.capacity);
    if (!parsed.ok) {
      return { ok: false, status: 422, code: "capacity", message: CAPACITY_MESSAGE, partner: current };
    }
    next.capacity = parsed.capacity;
  }

  const changed = next.status !== current.status || Number(next.capacity) !== Number(current.capacity) || next.activatedAt !== current.activatedAt;
  return {
    ok: true,
    status: 200,
    code: changed ? "ok" : "noop",
    message: "Opgeslagen.",
    partner: next,
  };
}
