import { createFileRoute } from "@tanstack/react-router";
import { appendMailLog, mailActivity, ownerFrom, type MailLogInput } from "@/lib/mail/server";

export const Route = createFileRoute("/api/mail/log")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await ownerFrom(request))) {
          return Response.json({ error: "geen toegang" }, { status: 401 });
        }
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") || 100);
        const data = mailActivity(Number.isFinite(limit) ? limit : 100);
        return Response.json({ ok: true, ...data });
      },
      POST: async ({ request }) => {
        if (!(await ownerFrom(request))) {
          return Response.json({ error: "geen toegang" }, { status: 401 });
        }
        let body: MailLogInput;
        try {
          body = (await request.json()) as MailLogInput;
        } catch {
          return Response.json({ ok: false, error: "Ongeldige JSON." }, { status: 400 });
        }
        const result = appendMailLog(body);
        if (!result.ok) {
          return Response.json({ ok: false, error: result.error }, { status: result.status });
        }
        return Response.json(result);
      },
    },
  },
});
