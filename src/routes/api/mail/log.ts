import { createFileRoute } from "@tanstack/react-router";
import { mailActivity, ownerFrom } from "@/lib/mail/server";

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
    },
  },
});
