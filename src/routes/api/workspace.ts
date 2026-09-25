import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { isOwnerEmail } from "@/lib/owner";
import { mergeProtectedLeads } from "@/lib/finance";
import { guardPartnerStatus } from "@/lib/mail/core.mjs";
import { activatedAtById, notifyNewJobs } from "@/lib/mail/server";
import { applyPartnerSelfServe, resolveSelfServeTarget } from "@/lib/partner-portal.mjs";
import type { Partner } from "@/lib/matchdesk";
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
    const email = session?.user?.email ? String(session.user.email).trim().toLowerCase() : "";
    return { email, owner: isOwnerEmail(email) };
  } catch {
    return { email: "", owner: false };
  }
}

function presentOwn(partner: Partner | null, stamps: Record<string, string>) {
  if (!partner) return null;
  const stamp = stamps[partner.id];
  if (stamp && !partner.activatedAt) return { ...partner, activatedAt: stamp };
  return partner;
}

function appendOnly(current: WorkspaceFile, incoming: Partial<WorkspaceFile>): WorkspaceFile {
  const leadIds = new Set(current.leads.map((l) => l.id));
  const partnerIds = new Set(current.partners.map((p) => p.id));
  const kvks = new Set(current.partners.map((p) => p.kvk));
  const subs = new Set(current.subscribers.map((s) => s.email.toLowerCase()));
  const extraLeads = (incoming.leads ?? []).filter((l) => l?.id && !leadIds.has(l.id));
  const extraPartners = realPartners(incoming.partners ?? [])
    .filter(
      (p) =>
        p?.id &&
        !partnerIds.has(p.id) &&
        !kvks.has(p.kvk) &&
        p.status === "Te beoordelen",
    )
    .map((p) => asSignupPartner(p));
  const extraSubs = (incoming.subscribers ?? []).filter(
    (s) => s?.email && !subs.has(s.email.toLowerCase()),
  );
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
        const ws = readWorkspaceFile();
        const { email, owner } = await sessionUser(request);
        const stamps = activatedAtById();
        const own = email ? resolveSelfServeTarget(ws.partners, email) : null;
        const ownPartner = presentOwn(own && own.ok ? own.partner : null, stamps);
        if (owner) {
          return Response.json({ full: true, workspace: ws, ownPartner });
        }
        return Response.json({
          full: false,
          ownPartner,
          workspace: {
            leads: [],
            partners: publicPartners(ws.partners),
            subscribers: [],
            notes: [],
            siteNotice: ws.siteNotice ?? "",
            matchingPaused: Boolean(ws.matchingPaused),
          },
        });
      },
      POST: async ({ request }) => {
        const { email, owner } = await sessionUser(request);
        let incoming: Partial<WorkspaceFile> & { partnerSelfServe?: SelfServeBody };
        try {
          incoming = (await request.json()) as Partial<WorkspaceFile> & { partnerSelfServe?: SelfServeBody };
        } catch {
          return Response.json({ error: "ongeldig" }, { status: 400 });
        }
        const current = readWorkspaceFile();
        if (incoming.partnerSelfServe) {
          if (!email) {
            return Response.json({ ok: false, message: "Log in om je bedrijf te beheren." }, { status: 401 });
          }
          const target = resolveSelfServeTarget(current.partners, email, incoming.partnerSelfServe.id);
          if (!target.ok) {
            return Response.json({ ok: false, message: target.message }, { status: target.status });
          }
          const stamps = activatedAtById();
          const result = applyPartnerSelfServe(target.partner, incoming.partnerSelfServe, stamps[target.partner.id]);
          if (!result.ok) {
            return Response.json({ ok: false, message: result.message }, { status: result.status });
          }
          const partners = current.partners.map((partner) =>
            partner.id === result.partner.id ? result.partner : partner,
          );
          writeWorkspaceFile({ ...current, partners });
          return Response.json({ ok: true, full: owner, partner: result.partner, message: result.message });
        }
        if (owner) {
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
            activeLeadId: incoming.activeLeadId,
            reportPaid: incoming.reportPaid,
            exclusivePaid: incoming.exclusivePaid,
            siteNotice: incoming.siteNotice ?? current.siteNotice ?? "",
            matchingPaused: Boolean(incoming.matchingPaused),
          };
          writeWorkspaceFile(next);
          try {
            await notifyNewJobs(current.leads, next.leads, next.partners);
          } catch (err) {
            console.error("[matchdesk-mail] klus", err);
          }
          return Response.json({ ok: true, full: true });
        }
        writeWorkspaceFile(appendOnly(current, incoming));
        return Response.json({ ok: true, full: false });
      },
    },
  },
});
