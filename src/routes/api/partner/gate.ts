import { createFileRoute } from "@tanstack/react-router";
import { gateStatus, ownerFrom, sendActivationMail } from "@/lib/mail/server";
import { readWorkspaceFile } from "@/lib/workspace-file";

export const Route = createFileRoute("/api/partner/gate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await ownerFrom(request))) {
          return Response.json({ error: "geen toegang" }, { status: 401 });
        }
        const ws = readWorkspaceFile();
        return Response.json({ partners: gateStatus(ws.partners) });
      },
      POST: async ({ request }) => {
        if (!(await ownerFrom(request))) {
          return Response.json({ error: "geen toegang" }, { status: 401 });
        }
        let body: { partnerId?: string; resend?: boolean };
        try {
          body = (await request.json()) as { partnerId?: string; resend?: boolean };
        } catch {
          return Response.json({ ok: false, message: "Ongeldige JSON." }, { status: 400 });
        }
        const partnerId = String(body?.partnerId || "").trim();
        if (!partnerId) {
          return Response.json({ ok: false, message: "Kies een bedrijf." }, { status: 400 });
        }
        const result = await sendActivationMail(partnerId, Boolean(body?.resend));
        const status = result.ok ? 200 : result.status || 400;
        return Response.json(result, { status });
      },
    },
  },
});
