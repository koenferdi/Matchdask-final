import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { isOwnerEmail } from "@/lib/owner";
import {
  publicPartners,
  readWorkspaceFile,
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

function merge(current: WorkspaceFile, incoming: Partial<WorkspaceFile>): WorkspaceFile {
  const leadIds = new Set(current.leads.map((l) => l.id));
  const partnerIds = new Set(current.partners.map((p) => p.id));
  const subs = new Set(current.subscribers.map((s) => s.email.toLowerCase()));
  return {
    ...current,
    leads: [...current.leads, ...(incoming.leads ?? []).filter((l) => !leadIds.has(l.id))],
    partners: [...current.partners, ...(incoming.partners ?? []).filter((p) => !partnerIds.has(p.id))],
    subscribers: [
      ...current.subscribers,
      ...(incoming.subscribers ?? []).filter((s) => !subs.has(s.email.toLowerCase())),
    ],
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
          const next: WorkspaceFile = {
            leads: Array.isArray(incoming.leads) ? incoming.leads : current.leads,
            partners: Array.isArray(incoming.partners) ? incoming.partners : current.partners,
            subscribers: Array.isArray(incoming.subscribers) ? incoming.subscribers : current.subscribers,
            notes: Array.isArray(incoming.notes) ? incoming.notes : current.notes,
            activeLeadId: incoming.activeLeadId,
            reportPaid: incoming.reportPaid,
            exclusivePaid: incoming.exclusivePaid,
            siteNotice: incoming.siteNotice ?? "",
            matchingPaused: Boolean(incoming.matchingPaused),
          };
          writeWorkspaceFile(next);
          return Response.json({ ok: true, full: true });
        }
        writeWorkspaceFile(merge(current, incoming));
        return Response.json({ ok: true, full: false });
      },
    },
  },
});
