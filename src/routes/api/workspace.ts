import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { isOwnerEmail } from "@/lib/owner";
import { guardPartnerStatus } from "@/lib/mail/core.mjs";
import { activatedAtById, notifyNewJobs } from "@/lib/mail/server";
import {
  asSignupPartner,
  publicPartners,
  readWorkspaceFile,
  realPartners,
  writeWorkspaceFile,
  type WorkspaceFile,
} from "@/lib/workspace-file";

async function ownerFrom(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return isOwnerEmail(session?.user?.email);
  } catch {
    return false;
  }
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
        const owner = await ownerFrom(request);
        if (owner) {
          return Response.json({ full: true, workspace: ws });
        }
        return Response.json({
          full: false,
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
        const owner = await ownerFrom(request);
        let incoming: Partial<WorkspaceFile>;
        try {
          incoming = (await request.json()) as Partial<WorkspaceFile>;
        } catch {
          return Response.json({ error: "ongeldig" }, { status: 400 });
        }
        const current = readWorkspaceFile();
        if (owner) {
          const partners = guardPartnerStatus(
            current.partners,
            realPartners(Array.isArray(incoming.partners) ? incoming.partners : current.partners),
            activatedAtById(),
          );
          const next: WorkspaceFile = {
            leads: Array.isArray(incoming.leads) ? incoming.leads : current.leads,
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
