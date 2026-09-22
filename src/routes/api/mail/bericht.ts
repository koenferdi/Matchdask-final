import { createFileRoute } from "@tanstack/react-router";
import { ownerFrom, sendPartnerMessage } from "@/lib/mail/server";

export const Route = createFileRoute("/api/mail/bericht")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await ownerFrom(request))) {
          return Response.json({ error: "geen toegang" }, { status: 401 });
        }
        let body: { partnerId?: string; leadId?: string; preview?: string };
        try {
          body = (await request.json()) as { partnerId?: string; leadId?: string; preview?: string };
        } catch {
          return Response.json({ ok: false, message: "Ongeldige JSON." }, { status: 400 });
        }
        const result = await sendPartnerMessage({
          partnerId: String(body?.partnerId || "").trim(),
          leadId: body?.leadId ? String(body.leadId).trim() : undefined,
          preview: String(body?.preview || ""),
        });
        const status = result.ok ? 200 : result.status || 400;
        return Response.json(result, { status });
      },
    },
  },
});
