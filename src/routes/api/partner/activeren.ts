import { createFileRoute } from "@tanstack/react-router";
import { activateFromToken, readActivation } from "@/lib/mail/server";

const hits = new Map<string, { n: number; reset: number }>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || "local";
}

function limited(ip: string) {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || row.reset < now) {
    hits.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  row.n += 1;
  return row.n > 30;
}

export const Route = createFileRoute("/api/partner/activeren")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (limited(clientIp(request))) {
          return Response.json({ ok: false, message: "Te veel pogingen. Probeer het later opnieuw." }, { status: 429 });
        }
        let body: { token?: string; confirm?: boolean };
        try {
          body = (await request.json()) as { token?: string; confirm?: boolean };
        } catch {
          return Response.json({ ok: false, message: "Ongeldige JSON." }, { status: 400 });
        }
        const token = String(body?.token || "").trim().slice(0, 200);
        if (!token) {
          return Response.json({ ok: false, state: "ongeldig", message: "Activatielink ontbreekt." }, { status: 400 });
        }
        if (!body?.confirm) {
          const preview = await readActivation(token);
          const status = preview.ok ? 200 : preview.status || 400;
          return Response.json(
            {
              ok: preview.ok,
              state: preview.state,
              company: preview.company,
              message: preview.message,
              confirmationPending: Boolean(preview.confirmationPending),
            },
            { status },
          );
        }
        const result = await activateFromToken(token);
        const status = result.ok ? 200 : result.status || 400;
        return Response.json(
          {
            ok: result.ok,
            already: Boolean(result.already),
            company: result.company,
            mailed: Boolean(result.mailed),
            state: result.ok ? "actief" : result.state,
            message: result.message,
          },
          { status },
        );
      },
    },
  },
});
