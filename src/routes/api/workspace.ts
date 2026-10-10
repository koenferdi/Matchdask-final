import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { isOwnerEmail } from "@/lib/owner";
import { mergeProtectedLeads } from "@/lib/finance";
import { guardPartnerStatus } from "@/lib/mail/core.mjs";
import { activatedAtById, notifyNewJobs } from "@/lib/mail/server";
import { applyPartnerSelfServe, parseCapacity, resolveSelfServeTarget, VERIFY_EMAIL_MESSAGE, workspaceIdentity } from "@/lib/partner-portal.mjs";
import { PRODUCTS, TERMS, findPartnerFor, type Lead, type Partner } from "@/lib/matchdesk";
import {
  asSignupPartner,
  publicPartners,
  readWorkspaceFile,
  realPartners,
  writeWorkspaceFile,
  type WorkspaceFile,
} from "@/lib/workspace-file";

type SelfServeBody = {
  id?: string;
  status?: string;
  capacity?: number | string;
};

async function sessionUser(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return workspaceIdentity(session?.user, isOwnerEmail);
  } catch {
    return { email: "", verified: false, owner: false };
  }
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(data, { ...init, headers });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function presentOwn(partner: Partner | null, stamps: Record<string, string>) {
  if (!partner) return null;
  const stamp = stamps[partner.id];
  if (stamp && !partner.activatedAt) return { ...partner, activatedAt: stamp };
  return partner;
}

function consumerLead(lead: Lead): Lead {
  const copy = { ...lead };
  delete copy.deal;
  delete copy.deletedAt;
  return copy;
}

function belongsTo(lead: Lead, email: string) {
  return typeof lead.email === "string" && lead.email.trim().toLowerCase() === email;
}

/** Public intake cannot create matches, financial registrations or payment rights. */
function asIntakeLead(input: Lead): Lead {
  return {
    id: input.id.slice(0, 80),
    product: input.product,
    postcode: input.postcode.trim().toUpperCase(),
    city: input.city.trim().slice(0, 120),
    address: input.address.trim().slice(0, 200),
    term: input.term,
    name: input.name.trim().slice(0, 160),
    email: input.email.trim().toLowerCase().slice(0, 160),
    phone: input.phone.trim().slice(0, 40),
    consent: true,
    status: "Nieuw",
    createdAt: new Date().toISOString(),
    usageKwh: typeof input.usageKwh === "number" && Number.isFinite(input.usageKwh) && input.usageKwh >= 0 ? input.usageKwh : undefined,
    roofType: input.roofType,
    roofDir: input.roofDir,
    shade: input.shade,
    meter: input.meter,
    hasSolar: input.hasSolar === true,
    note: typeof input.note === "string" ? input.note.trim().slice(0, 2000) : undefined,
  };
}

function validIntakeLead(input: unknown): input is Lead {
  if (!isRecord(input)) return false;
  return ["id", "postcode", "city", "address", "name", "email", "phone"].every((key) => typeof input[key] === "string")
    && /^[A-Za-z0-9_-]{1,80}$/.test(String(input.id))
    && Boolean(String(input.name).trim() && String(input.phone).trim())
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input.email).trim())
    && /^[1-9]\d{3}\s?[A-Z]{2}$/i.test(String(input.postcode).trim())
    && input.consent === true
    && PRODUCTS.includes(input.product as Lead["product"])
    && TERMS.includes(input.term as Lead["term"]);
}

function appendOnly(current: WorkspaceFile, incoming: Partial<WorkspaceFile>): WorkspaceFile {
  const leadIds = new Set(current.leads.map((l) => l.id));
  const partnerIds = new Set(current.partners.map((p) => p.id));
  const kvks = new Set(current.partners.map((p) => p.kvk));
  const subs = new Set(current.subscribers.map((s) => s.email.toLowerCase()));
  const extraLeads = (incoming.leads ?? []).filter((lead) => {
    if (!lead?.id || leadIds.has(lead.id)) return false;
    leadIds.add(lead.id);
    return true;
  }).map(asIntakeLead);
  const extraPartners = realPartners(incoming.partners ?? [])
    .filter((partner) => {
      if (!partner?.id || partnerIds.has(partner.id) || kvks.has(partner.kvk) || partner.status !== "Te beoordelen") return false;
      partnerIds.add(partner.id);
      kvks.add(partner.kvk);
      return true;
    })
    .map((p) => asSignupPartner(p));
  const extraSubs = (incoming.subscribers ?? []).filter((subscriber) => {
    const email = subscriber.email.trim().toLowerCase();
    if (!email || subs.has(email)) return false;
    subs.add(email);
    return true;
  }).map((subscriber) => ({
    email: subscriber.email.trim().toLowerCase().slice(0, 160),
    name: typeof subscriber.name === "string" ? subscriber.name.trim().slice(0, 160) : "",
    createdAt: new Date().toISOString(),
  }));
  return {
    ...current,
    leads: [...current.leads, ...extraLeads],
    partners: [...current.partners, ...extraPartners],
    subscribers: [...current.subscribers, ...extraSubs],
  };
}

export const Route = createFileRoute("/api/workspace")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { email, verified, owner } = await sessionUser(request);
        const ws = readWorkspaceFile();
        const stamps = activatedAtById();
        const own = verified ? resolveSelfServeTarget(ws.partners, email) : null;
        const ownPartner = presentOwn(own && own.ok ? own.partner : null, stamps);
        if (owner) {
          return json({ full: true, workspace: ws, ownPartner });
        }
        return json({
          full: false,
          ownPartner,
          accessMessage: email && !verified ? VERIFY_EMAIL_MESSAGE : undefined,
          workspace: {
            leads: verified ? ws.leads.filter((lead) => !lead.deletedAt && belongsTo(lead, email)).map(consumerLead) : [],
            partners: publicPartners(ws.partners),
            subscribers: [],
            notes: [],
            siteNotice: ws.siteNotice ?? "",
            matchingPaused: Boolean(ws.matchingPaused),
          },
        });
      },
      POST: async ({ request }) => {
        if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
          return json({ ok: false, message: "Verstuur de gegevens als JSON." }, { status: 415 });
        }
        const { email, verified, owner } = await sessionUser(request);
        let incoming: Partial<WorkspaceFile> & { partnerSelfServe?: SelfServeBody; intake?: boolean; matchRequest?: { id?: string } };
        try {
          const body: unknown = await request.json();
          if (!isRecord(body)) return json({ ok: false, message: "Ongeldige JSON." }, { status: 400 });
          incoming = body as Partial<WorkspaceFile> & { partnerSelfServe?: SelfServeBody; intake?: boolean; matchRequest?: { id?: string } };
        } catch {
          return json({ ok: false, message: "Ongeldige JSON." }, { status: 400 });
        }
        const current = readWorkspaceFile();
        if (Object.hasOwn(incoming, "matchRequest")) {
          if (!email) return json({ ok: false, message: "Log in om je aanvraag te beheren." }, { status: 401 });
          if (!verified) return json({ ok: false, message: VERIFY_EMAIL_MESSAGE }, { status: 403 });
          if (!isRecord(incoming.matchRequest) || typeof incoming.matchRequest.id !== "string" || !incoming.matchRequest.id.trim()) {
            return json({ ok: false, message: "Kies een geldige aanvraag." }, { status: 400 });
          }
          const lead = current.leads.find((item) => item.id === incoming.matchRequest?.id && !item.deletedAt);
          if (!lead) return json({ ok: false, message: "Aanvraag niet gevonden." }, { status: 404 });
          if (!owner && !belongsTo(lead, email)) {
            return json({ ok: false, message: "Deze aanvraag hoort niet bij jouw account." }, { status: 403 });
          }
          if (lead.consent !== true) {
            return json({ ok: false, message: "Toestemming voor deze aanvraag ontbreekt." }, { status: 422 });
          }
          if (lead.partnerId) {
            return json({ ok: true, lead: owner ? lead : consumerLead(lead), message: "Deze aanvraag is al toegewezen. Matchdesk volgt de bestaande toewijzing op." });
          }
          if (lead.status !== "Nieuw") {
            return json({ ok: false, message: "Deze aanvraag wordt al behandeld. Matchdesk moet de status eerst beoordelen." }, { status: 409 });
          }
          if (!PRODUCTS.includes(lead.product) || typeof lead.postcode !== "string" || !/^[1-9]\d{3}\s?[A-Z]{2}$/i.test(lead.postcode.trim())) {
            return json({ ok: false, message: "Product of postcode is niet geldig voor matching." }, { status: 422 });
          }
          if (current.matchingPaused) {
            return json({ ok: false, message: "Matching is tijdelijk gepauzeerd. Je aanvraag blijft bewaard." }, { status: 409 });
          }
          const partner = findPartnerFor(lead, current.partners);
          if (!partner) {
            return json({ ok: false, message: "Er is nu geen beschikbare installateur voor dit product in jouw postcodegebied. Je aanvraag blijft bewaard." }, { status: 409 });
          }
          const capacity = parseCapacity(partner.capacity);
          if (!capacity.ok || capacity.capacity < 1) {
            return json({ ok: false, message: "Deze installateur heeft nu geen capaciteit." }, { status: 409 });
          }
          const nextLead: Lead = { ...lead, status: "Gematcht", partnerId: partner.id };
          const next: WorkspaceFile = {
            ...current,
            leads: current.leads.map((item) => item.id === lead.id ? nextLead : item),
            partners: current.partners.map((item) => item.id === partner.id ? { ...item, capacity: capacity.capacity - 1 } : item),
          };
          try {
            writeWorkspaceFile(next);
          } catch {
            return json({ ok: false, message: "Toewijzing is niet opgeslagen. Probeer het opnieuw." }, { status: 500 });
          }
          try {
            await notifyNewJobs(current.leads, next.leads, next.partners);
          } catch (err) {
            console.error("[matchdesk-mail] klus", err);
          }
          return json({ ok: true, lead: owner ? nextLead : consumerLead(nextLead), remainingCapacity: capacity.capacity - 1, message: "De toewijzing is opgeslagen. Matchdesk volgt je aanvraag op." });
        }
        if (Object.hasOwn(incoming, "partnerSelfServe")) {
          if (!email) {
            return json({ ok: false, message: "Log in om je bedrijf te beheren." }, { status: 401 });
          }
          if (!verified) {
            return json({ ok: false, message: VERIFY_EMAIL_MESSAGE }, { status: 403 });
          }
          if (!isRecord(incoming.partnerSelfServe)) {
            return json({ ok: false, message: "Ongeldige status of capaciteit." }, { status: 400 });
          }
          const target = resolveSelfServeTarget(current.partners, email, incoming.partnerSelfServe.id);
          if (!target.ok) {
            return json({ ok: false, message: target.message }, { status: target.status });
          }
          const stamps = activatedAtById();
          const result = applyPartnerSelfServe(target.partner, incoming.partnerSelfServe, stamps[target.partner.id]);
          if (!result.ok) {
            return json({ ok: false, message: result.message }, { status: result.status });
          }
          const partners = current.partners.map((partner) =>
            partner.id === result.partner.id ? result.partner : partner,
          );
          try {
            writeWorkspaceFile({ ...current, partners });
          } catch {
            return json({ ok: false, message: "Opslaan op de server lukte niet. Probeer het opnieuw." }, { status: 500 });
          }
          return json({ ok: true, full: owner, partner: result.partner, message: result.message });
        }
        if (email && !verified) {
          return json({ ok: false, message: VERIFY_EMAIL_MESSAGE }, { status: 403 });
        }
        for (const key of ["leads", "partners", "subscribers", "notes"] as const) {
          if (incoming[key] != null && !Array.isArray(incoming[key])) {
            return json({ ok: false, message: "Ongeldige gegevens." }, { status: 400 });
          }
        }
        if (Object.hasOwn(incoming, "intake") && incoming.intake !== true) {
          return json({ ok: false, message: "Ongeldige aanmelding." }, { status: 400 });
        }
        if (owner && !incoming.intake) {
          const partners = guardPartnerStatus(
            current.partners,
            realPartners(Array.isArray(incoming.partners) ? incoming.partners : current.partners),
            activatedAtById(),
          );
          const leads = Array.isArray(incoming.leads)
            ? mergeProtectedLeads(current.leads, incoming.leads)
            : current.leads;
          const next: WorkspaceFile = {
            leads,
            partners,
            subscribers: Array.isArray(incoming.subscribers) ? incoming.subscribers : current.subscribers,
            notes: Array.isArray(incoming.notes) ? incoming.notes : current.notes,
            activeLeadId: incoming.activeLeadId ?? current.activeLeadId,
            reportPaid: incoming.reportPaid ?? current.reportPaid,
            exclusivePaid: incoming.exclusivePaid ?? current.exclusivePaid,
            siteNotice: incoming.siteNotice ?? current.siteNotice ?? "",
            matchingPaused: incoming.matchingPaused == null ? Boolean(current.matchingPaused) : Boolean(incoming.matchingPaused),
          };
          writeWorkspaceFile(next);
          try {
            await notifyNewJobs(current.leads, next.leads, next.partners);
          } catch (err) {
            console.error("[matchdesk-mail] klus", err);
          }
          return json({ ok: true, full: true });
        }
        const currentLeadIds = new Set(current.leads.map((lead) => lead.id));
        if ((incoming.leads ?? []).some((lead) => !currentLeadIds.has(lead?.id) && !validIntakeLead(lead))) {
          return json({ ok: false, message: "Vul geldige contactgegevens, postcode en toestemming in." }, { status: 422 });
        }
        if ((incoming.partners ?? []).some((partner) =>
          !isRecord(partner) || typeof partner.id !== "string" || typeof partner.kvk !== "string"
          || typeof partner.email !== "string" || typeof partner.name !== "string"
          || !parseCapacity(partner.capacity).ok)) {
          return json({ ok: false, message: "Vul een geldig bedrijfsprofiel en capaciteit in." }, { status: 422 });
        }
        const currentPartnerIds = new Set(current.partners.map((partner) => partner.id));
        const signups = (incoming.partners ?? []).filter((partner) => !currentPartnerIds.has(partner.id) && partner.status === "Te beoordelen");
        if (signups.some((partner) =>
          !/^[A-Za-z0-9_-]{1,80}$/.test(partner.id) || !partner.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.email.trim())
          || !/^\d{8}$/.test(partner.kvk)
          || !Array.isArray(partner.products) || !partner.products.length || partner.products.some((product) => !PRODUCTS.includes(product))
          || !Array.isArray(partner.prefixes) || !partner.prefixes.length || partner.prefixes.some((prefix) => typeof prefix !== "string" || !/^[1-9]\d$/.test(prefix)))) {
          return json({ ok: false, message: "Vul bedrijfsnaam, e-mail, acht KvK-cijfers, specialisme en postcodegebieden in." }, { status: 422 });
        }
        if (incoming.intake && signups.some((partner) => current.partners.some((existing) => existing.kvk === partner.kvk || existing.email.trim().toLowerCase() === partner.email.trim().toLowerCase()))) {
          return json({ ok: false, message: "Dit bedrijf of e-mailadres is al aangemeld. Log in met het bestaande account." }, { status: 409 });
        }
        if ((incoming.subscribers ?? []).some((subscriber) =>
          !isRecord(subscriber) || typeof subscriber.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subscriber.email.trim()))) {
          return json({ ok: false, message: "Vul een geldig e-mailadres in." }, { status: 422 });
        }
        const next = appendOnly(current, incoming);
        try {
          writeWorkspaceFile(next);
        } catch {
          return json({ ok: false, message: "Opslaan op de server lukte niet. Probeer het opnieuw." }, { status: 500 });
        }
        return json({
          ok: true,
          full: false,
          createdLeadIds: next.leads.filter((lead) => !currentLeadIds.has(lead.id)).map((lead) => lead.id),
          createdPartnerIds: next.partners.filter((partner) => !currentPartnerIds.has(partner.id)).map((partner) => partner.id),
        });
      },
    },
  },
});
