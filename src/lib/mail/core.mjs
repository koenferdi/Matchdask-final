// @ts-nocheck
/**
 * Pure mail decisions for partner activation, klus-updates and berichten.
 * No filesystem and no Resend calls — the server adapter persists and sends.
 */
import { createHash, randomBytes } from "node:crypto";

export const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const COMMISSION_TEXT =
  "Eerste gewonnen klus €0 commissie, daarna 10% (max €400 panelen / €600 batterij).";
export const COMMISSION_HTML =
  "Eerste gewonnen klus <strong>€0</strong> commissie, daarna <strong>10%</strong> (max €400 panelen / €600 batterij).";

export function emptyLedger() {
  return { byPartner: {}, sentKeys: {}, pendingJobs: [], outbox: [] };
}

/** Outbox types. Resend system mail plus manually logged outreach from info@. */
export const MAIL_TYPES = ["activatie", "bevestiging", "klus", "bericht", "cold", "fu", "overig"];
const MAIL_LOG_STATUSES = ["sent", "failed", "queued"];

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function firstName(contactName) {
  const raw = String(contactName || "").trim();
  if (!raw) return "";
  return raw.split(/\s+/)[0].slice(0, 60);
}

export function activationUrl(origin, token) {
  const base = String(origin || "https://www.getmatchdesk.nl").replace(/\/$/, "");
  return `${base}/activeren?token=${encodeURIComponent(token)}`;
}

function hi(greeting) {
  return greeting ? `Hoi ${greeting},` : "Hoi,";
}

function p(html, last = false) {
  return `<p style="margin:${last ? "0" : "0 0 14px"};">${html}</p>`;
}

export function brandedEmail({ title, bodyHtml, ctaLabel, ctaUrl }) {
  const safeTitle = esc(title);
  const safeLabel = esc(ctaLabel);
  const safeUrl = esc(ctaUrl);
  const html = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
<tr><td align="left" style="padding:24px 16px 40px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;">
  <tr><td style="padding:0 0 20px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle" width="36" height="36" bgcolor="#0D9488" style="width:36px;height:36px;border-radius:8px;text-align:center;font-size:18px;font-weight:700;color:#ffffff;line-height:36px;">M</td>
      <td valign="middle" style="padding-left:10px;font-size:15px;font-weight:600;color:#071520;">Matchdesk</td>
    </tr></table>
    <div style="margin-top:8px;height:3px;width:48px;background-color:#0D9488;font-size:0;line-height:0;">&nbsp;</div>
  </td></tr>
  <tr><td style="font-size:15px;line-height:1.65;color:#1F2A37;">
    ${bodyHtml}
  </td></tr>
  <tr><td style="padding:22px 0 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td bgcolor="#0D9488" style="border-radius:6px;">
        <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${safeLabel}</a>
      </td>
    </tr></table>
    <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#9CA3AF;">Of open: ${safeUrl}</p>
  </td></tr>
  <tr><td style="padding-top:28px;border-top:1px solid #EEF1F5;font-size:13px;line-height:1.55;color:#6B7280;">
    Groet,<br><strong style="color:#1F2A37;">Koen</strong> · Matchdesk<br>
    <span style="color:#9CA3AF;font-size:12px;">info@getmatchdesk.nl</span>
  </td></tr>
</table></td></tr></table>
</body></html>`;
  return html;
}

function textFooter(lines) {
  return [...lines, "", "Groet,", "Koen · Matchdesk", "info@getmatchdesk.nl", ""].join("\n");
}

export function renderActivationEmail({ greeting, company, activationUrl: url }) {
  const hello = hi(greeting);
  const safeCompany = esc(company);
  const bodyHtml = [
    p(esc(hello)),
    p(
      `Goed nieuws: we hebben <strong>${safeCompany}</strong> gecontroleerd (KvK + werkgebied). Je kunt nu je Matchdesk-account activeren.`,
    ),
    p(
      "Na activatie ontvang je een aparte bevestiging. Daarna kun je exclusieve 1:1-aanvragen ontvangen — geen leadveiling.",
    ),
    p(COMMISSION_HTML, true),
  ].join("\n    ");
  return {
    subject: "Activeer je Matchdesk-account",
    html: brandedEmail({
      title: "Activeer je Matchdesk-account",
      bodyHtml,
      ctaLabel: "Activeer account",
      ctaUrl: url,
    }),
    text: textFooter([
      hello,
      "",
      `Goed nieuws: we hebben ${company} gecontroleerd (KvK + werkgebied). Je kunt nu je Matchdesk-account activeren.`,
      "",
      `→ ${url}`,
      "",
      "Na activatie ontvang je een aparte bevestiging. Daarna kun je exclusieve 1:1-aanvragen ontvangen — geen leadveiling.",
      "",
      COMMISSION_TEXT,
    ]),
  };
}

export function renderConfirmationEmail({ greeting, company, portalUrl }) {
  const hello = hi(greeting);
  const safeCompany = esc(company);
  const bodyHtml = [
    p(esc(hello)),
    p(
      `<strong>${safeCompany}</strong> is geactiveerd. Je kunt nu exclusieve 1:1-aanvragen ontvangen — geen leadveiling.`,
    ),
    p("Eén lead gaat naar één installateur."),
    p(COMMISSION_HTML, true),
  ].join("\n    ");
  return {
    subject: "Je Matchdesk-account is actief",
    html: brandedEmail({
      title: "Je Matchdesk-account is actief",
      bodyHtml,
      ctaLabel: "Naar je portaal",
      ctaUrl: portalUrl,
    }),
    text: textFooter([
      hello,
      "",
      `${company} is geactiveerd. Je kunt nu exclusieve 1:1-aanvragen ontvangen — geen leadveiling.`,
      "",
      "Eén lead gaat naar één installateur.",
      "",
      COMMISSION_TEXT,
      "",
      `→ ${portalUrl}`,
    ]),
  };
}

export function renderJobEmail({ greeting, company, lead, portalUrl }) {
  const hello = hi(greeting);
  const place = [lead.postcode, lead.city].filter(Boolean).join(" ");
  const contact = [
    lead.email ? `E-mail: ${esc(lead.email)}` : "",
    lead.phone ? `Telefoon: ${esc(lead.phone)}` : "",
  ]
    .filter(Boolean)
    .join("<br>");
  const bodyHtml = [
    p(esc(hello)),
    p(
      `Er is een nieuwe klus voor <strong>${esc(company)}</strong>. Die aanvraag is alleen voor jullie: één lead, één installateur. Geen veiling.`,
    ),
    p(
      `<strong>${esc(lead.product || "Klus")}</strong><br>${esc(place)}<br>Klant: ${esc(lead.name || "—")}<br>Dossier: ${esc(lead.id || "")}`,
    ),
    contact ? p(contact) : "",
    p(COMMISSION_HTML, true),
  ]
    .filter(Boolean)
    .join("\n    ");
  const subjectPlace = lead.city ? ` in ${lead.city}` : "";
  return {
    subject: `Nieuwe klus — ${lead.product || "aanvraag"}${subjectPlace}`,
    html: brandedEmail({
      title: "Nieuwe klus via Matchdesk",
      bodyHtml,
      ctaLabel: "Bekijk de klus",
      ctaUrl: portalUrl,
    }),
    text: textFooter([
      hello,
      "",
      `Er is een nieuwe klus voor ${company}. Die aanvraag is alleen voor jullie: één lead, één installateur. Geen veiling.`,
      "",
      `${lead.product || "Klus"}`,
      place,
      `Klant: ${lead.name || "—"}`,
      `Dossier: ${lead.id || ""}`,
      lead.email ? `E-mail: ${lead.email}` : "",
      lead.phone ? `Telefoon: ${lead.phone}` : "",
      "",
      COMMISSION_TEXT,
      "",
      `→ ${portalUrl}`,
    ].filter((line) => line !== "")),
  };
}

export function renderMessageEmail({ greeting, company, preview, portalUrl, dossier }) {
  const hello = hi(greeting);
  const about = dossier ? ` over dossier ${esc(dossier)}` : "";
  const aboutText = dossier ? ` over dossier ${dossier}` : "";
  const bodyHtml = [
    p(esc(hello)),
    p(`Er staat een nieuw bericht klaar voor <strong>${esc(company)}</strong>${about}.`),
    p(esc(preview)),
    p(`Eén lead, één installateur. ${COMMISSION_HTML}`, true),
  ].join("\n    ");
  return {
    subject: "Nieuw bericht via Matchdesk",
    html: brandedEmail({
      title: "Nieuw bericht via Matchdesk",
      bodyHtml,
      ctaLabel: "Open het bericht",
      ctaUrl: portalUrl,
    }),
    text: textFooter([
      hello,
      "",
      `Er staat een nieuw bericht klaar voor ${company}${aboutText}.`,
      "",
      preview,
      "",
      `Eén lead, één installateur. ${COMMISSION_TEXT}`,
      "",
      `→ ${portalUrl}`,
    ]),
  };
}

function normalizeLedger(ledger) {
  const base = ledger && typeof ledger === "object" ? ledger : {};
  return {
    byPartner: base.byPartner && typeof base.byPartner === "object" ? base.byPartner : {},
    sentKeys: base.sentKeys && typeof base.sentKeys === "object" ? base.sentKeys : {},
    pendingJobs: Array.isArray(base.pendingJobs) ? base.pendingJobs : [],
    outbox: Array.isArray(base.outbox) ? base.outbox : [],
  };
}

function findByToken(ledger, token) {
  const hash = hashToken(token);
  return Object.values(ledger.byPartner).find((row) => row && row.tokenHash === hash) ?? null;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function canonicalType(type) {
  const value = String(type || "").trim().toLowerCase();
  return MAIL_TYPES.includes(value) ? value : "overig";
}

function cleanMessageId(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, 200) : null;
}

function cleanId(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text ? text.slice(0, 80) : null;
}

function cleanReason(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, 300) : null;
}

export function decideGate({ partners, ledger, partnerId, resend, now, token, origin }) {
  const list = Array.isArray(partners) ? partners : [];
  const partner = list.find((p) => p && p.id === partnerId && !p.example);
  if (!partner) return { ok: false, status: 404, message: "Bedrijf niet gevonden." };
  const kvk = String(partner.kvk || "").trim();
  if (!/^[0-9]{8}$/.test(kvk)) {
    return {
      ok: false,
      status: 422,
      message: "KvK-nummer moet uit 8 cijfers bestaan voordat je de activatiemail stuurt.",
    };
  }
  const prefixes = (Array.isArray(partner.prefixes) ? partner.prefixes : []).map(String).filter(Boolean);
  if (!prefixes.length) {
    return {
      ok: false,
      status: 422,
      message: "Werkgebied ontbreekt. Vul minstens één postcode-prefix in.",
    };
  }
  const email = String(partner.email || "").trim().toLowerCase();
  if (!validEmail(email)) {
    return { ok: false, status: 422, message: "Zakelijk e-mailadres ontbreekt of is ongeldig." };
  }
  const book = normalizeLedger(ledger);
  const current = book.byPartner[partnerId];
  if (current?.activatedAt) {
    return { ok: false, status: 409, message: "Dit bedrijf is al geactiveerd." };
  }
  if (current?.sentAt && current.expiresAt > now && !resend) {
    return {
      ok: true,
      alreadySent: true,
      message: "Er is al een geldige activatielink. Stuur opnieuw als de mail niet aankwam.",
    };
  }
  const url = activationUrl(origin, token);
  const message = renderActivationEmail({
    greeting: firstName(partner.contactName),
    company: partner.name,
    activationUrl: url,
  });
  return {
    ok: true,
    activationUrl: url,
    email: { to: email, ...message },
    ledger: {
      ...book,
      byPartner: {
        ...book.byPartner,
        [partnerId]: {
          partnerId,
          tokenHash: hashToken(token),
          expiresAt: now + ACTIVATION_TTL_MS,
          sentAt: new Date(now).toISOString(),
        },
      },
    },
  };
}

export function previewActivation({ partners, ledger, token, now }) {
  if (!token) return { ok: false, status: 400, state: "ongeldig", message: "Activatielink ontbreekt." };
  const book = normalizeLedger(ledger);
  const row = findByToken(book, token);
  if (!row) {
    return {
      ok: false,
      status: 404,
      state: "ongeldig",
      message: "Deze activatielink is ongeldig. Vraag Matchdesk om een nieuwe link.",
    };
  }
  const partner = (partners || []).find((p) => p.id === row.partnerId);
  if (!partner) {
    return { ok: false, status: 404, state: "ongeldig", message: "Dit bedrijf staat niet meer in het bestand." };
  }
  if (row.activatedAt) {
    const pending = !row.confirmationSentAt;
    return {
      ok: true,
      state: "al-actief",
      confirmationPending: pending,
      company: partner.name,
      message: pending
        ? `${partner.name} is geactiveerd. De bevestigingsmail is nog niet verzonden.`
        : `${partner.name} is al geactiveerd.`,
    };
  }
  if (row.expiresAt <= now) {
    return {
      ok: false,
      status: 410,
      state: "verlopen",
      company: partner.name,
      message: "Deze activatielink is verlopen. Vraag Matchdesk om een nieuwe link.",
    };
  }
  return {
    ok: true,
    state: "klaar",
    company: partner.name,
    message: `${partner.name} is gecontroleerd. Bevestig hieronder om het account te activeren.`,
  };
}

export function decideActivate({ partners, ledger, token, now, portalUrl }) {
  const preview = previewActivation({ partners, ledger, token, now });
  if (!preview.ok && preview.state !== "verlopen") return preview;
  if (preview.state === "verlopen" || preview.state === "ongeldig") return preview;
  if (preview.state === "al-actief") {
    const book = normalizeLedger(ledger);
    const row = findByToken(book, token);
    const partner = (partners || []).find((p) => p.id === row?.partnerId);
    const nextPartners = (partners || []).map((p) => {
      if (!partner || p.id !== partner.id) return p;
      if (p.status === "Gepauzeerd" || p.status === "Gearchiveerd") return p;
      return { ...p, status: "Actief", activatedAt: row.activatedAt || p.activatedAt };
    });
    if (row?.confirmationSentAt) {
      return {
        ok: true,
        already: true,
        company: preview.company,
        partnerId: row.partnerId,
        partners: nextPartners,
      };
    }
    if (!partner || !validEmail(partner.email)) {
      return {
        ok: true,
        already: true,
        company: preview.company,
        partnerId: row?.partnerId,
        partners: nextPartners,
        mailedSkipped: true,
      };
    }
    return {
      ok: true,
      already: false,
      retryConfirmation: true,
      partnerId: partner.id,
      company: partner.name,
      partners: nextPartners,
      ledger: book,
      email: {
        to: String(partner.email).trim().toLowerCase(),
        ...renderConfirmationEmail({
          greeting: firstName(partner.contactName),
          company: partner.name,
          portalUrl,
        }),
      },
    };
  }
  const book = normalizeLedger(ledger);
  const row = findByToken(book, token);
  const partner = (partners || []).find((p) => p.id === row.partnerId);
  const activatedAt = new Date(now).toISOString();
  const nextPartners = (partners || []).map((p) =>
    p.id === partner.id ? { ...p, status: "Actief", activatedAt } : p,
  );
  const nextLedger = {
    ...book,
    byPartner: {
      ...book.byPartner,
      [partner.id]: { ...row, activatedAt },
    },
  };
  if (!validEmail(partner.email)) {
    return {
      ok: true,
      partnerId: partner.id,
      company: partner.name,
      partners: nextPartners,
      ledger: nextLedger,
      mailedSkipped: true,
    };
  }
  return {
    ok: true,
    partnerId: partner.id,
    company: partner.name,
    partners: nextPartners,
    ledger: nextLedger,
    email: {
      to: String(partner.email).trim().toLowerCase(),
      ...renderConfirmationEmail({
        greeting: firstName(partner.contactName),
        company: partner.name,
        portalUrl,
      }),
    },
  };
}

export function markConfirmationSent(ledger, partnerId, now) {
  const book = normalizeLedger(ledger);
  const row = book.byPartner[partnerId];
  if (!row) return book;
  return {
    ...book,
    byPartner: {
      ...book.byPartner,
      [partnerId]: { ...row, confirmationSentAt: new Date(now).toISOString() },
    },
  };
}

export function activationMap(ledger) {
  const book = normalizeLedger(ledger);
  const map = {};
  for (const row of Object.values(book.byPartner)) {
    if (row?.activatedAt && row.partnerId) map[row.partnerId] = row.activatedAt;
  }
  return map;
}

export function listActivationStatus(partners, ledger) {
  const book = normalizeLedger(ledger);
  return (partners || [])
    .filter((p) => p && !p.example)
    .map((p) => {
      const row = book.byPartner[p.id];
      return {
        id: p.id,
        sentAt: row?.sentAt ?? null,
        expiresAt: row?.expiresAt ?? null,
        activatedAt: row?.activatedAt ?? null,
        confirmationSentAt: row?.confirmationSentAt ?? null,
      };
    });
}

export function guardPartnerStatus(current, incoming, activatedAtById) {
  const prev = new Map((current || []).map((p) => [p.id, p]));
  const active = activatedAtById && typeof activatedAtById === "object" ? activatedAtById : {};
  return (incoming || []).map((p) => {
    const old = prev.get(p.id);
    const activatedAt = active[p.id];
    if (activatedAt && p.status === "Te beoordelen") {
      const status = old?.status === "Gepauzeerd" || old?.status === "Gearchiveerd" ? old.status : "Actief";
      return { ...p, status, activatedAt: old?.activatedAt || activatedAt };
    }
    if (p.status === "Actief" && old?.status !== "Actief" && !activatedAt) {
      return { ...p, status: old?.status || "Te beoordelen" };
    }
    if (activatedAt && p.status === "Actief") {
      return { ...p, activatedAt: old?.activatedAt || activatedAt };
    }
    return p;
  });
}

function jobKey(leadId, partnerId) {
  return `klus:${leadId}:${partnerId}`;
}

export function planJobMails({ beforeLeads, afterLeads, partners, ledger, portalUrl }) {
  const book = normalizeLedger(ledger);
  const before = new Map((beforeLeads || []).map((lead) => [lead.id, lead.partnerId || ""]));
  const pending = [...book.pendingJobs];
  for (const lead of afterLeads || []) {
    if (!lead?.partnerId) continue;
    const prev = before.get(lead.id) || "";
    if (prev === lead.partnerId) continue;
    const key = jobKey(lead.id, lead.partnerId);
    if (book.sentKeys[key]) continue;
    if (pending.some((job) => job.leadId === lead.id && job.partnerId === lead.partnerId)) continue;
    pending.push({ leadId: lead.id, partnerId: lead.partnerId });
  }
  const emails = [];
  const still = [];
  for (const job of pending) {
    const key = jobKey(job.leadId, job.partnerId);
    if (book.sentKeys[key]) continue;
    const lead = (afterLeads || []).find((item) => item.id === job.leadId);
    const partner = (partners || []).find((item) => item.id === job.partnerId && !item.example);
    if (!lead || lead.partnerId !== job.partnerId || !partner) continue;
    if (partner.status !== "Actief" || !validEmail(partner.email)) {
      still.push(job);
      continue;
    }
    emails.push({
      key,
      job,
      mail: {
        to: String(partner.email).trim().toLowerCase(),
        ...renderJobEmail({
          greeting: firstName(partner.contactName),
          company: partner.name,
          lead,
          portalUrl,
        }),
      },
    });
    still.push(job);
  }
  return {
    emails,
    ledger: { ...book, pendingJobs: still },
  };
}

export function markJobsSent(ledger, keys, now) {
  const book = normalizeLedger(ledger);
  const sentKeys = { ...book.sentKeys };
  const stamp = new Date(now).toISOString();
  const done = new Set(keys || []);
  for (const key of done) sentKeys[key] = stamp;
  return {
    ...book,
    sentKeys,
    pendingJobs: book.pendingJobs.filter((job) => !done.has(jobKey(job.leadId, job.partnerId))),
  };
}

export function planMessage({ partner, lead, preview, ledger, portalUrl }) {
  if (!partner || partner.example) return { ok: false, status: 404, message: "Bedrijf niet gevonden." };
  if (partner.status !== "Actief") {
    return { ok: false, status: 409, message: "Alleen een geactiveerd bedrijf ontvangt berichtmails." };
  }
  if (!validEmail(partner.email)) {
    return { ok: false, status: 422, message: "Dit bedrijf heeft geen geldig e-mailadres." };
  }
  const text = String(preview || "").trim().slice(0, 500);
  if (text.length < 2) return { ok: false, status: 422, message: "Schrijf een korte tekst voor het bericht." };
  const dossier = lead?.id || "";
  const key = `bericht:${partner.id}:${dossier || "algemeen"}:${hashToken(text).slice(0, 16)}`;
  const book = normalizeLedger(ledger);
  if (book.sentKeys[key]) {
    return { ok: true, alreadySent: true, message: "Dit bericht is al gemaild." };
  }
  return {
    ok: true,
    key,
    email: {
      to: String(partner.email).trim().toLowerCase(),
      ...renderMessageEmail({
        greeting: firstName(partner.contactName),
        company: partner.name,
        preview: text,
        portalUrl,
        dossier,
      }),
    },
  };
}

export function markKeySent(ledger, key, now) {
  const book = normalizeLedger(ledger);
  return {
    ...book,
    sentKeys: { ...book.sentKeys, [key]: new Date(now).toISOString() },
  };
}

/**
 * Build a cockpit mail list from the ledger + optional outbox rows.
 * Gaps: older Resend attempts without outbox entries only show keys/timestamps;
 * subject/to may be reconstructed from partners/leads when linked.
 */
export function listMailActivity({ ledger, partners, leads, limit = 100 } = {}) {
  const book = normalizeLedger(ledger);
  const partnerById = new Map((partners || []).map((p) => [p.id, p]));
  const leadById = new Map((leads || []).map((l) => [l.id, l]));
  const rows = [];

  for (const entry of book.outbox) {
    if (!entry || typeof entry !== "object") continue;
    rows.push({
      id: entry.id || `outbox:${entry.at}:${entry.to}:${entry.subject}`,
      at: entry.at || null,
      to: entry.to || "",
      subject: entry.subject || "",
      type: entry.type || "overig",
      status: entry.status || "unknown",
      reason: entry.reason || null,
      partnerId: entry.partnerId || null,
      leadId: entry.leadId || null,
      messageId: entry.messageId || null,
      company: entry.partnerId ? partnerById.get(entry.partnerId)?.name || null : null,
      leadName: entry.leadId ? leadById.get(entry.leadId)?.name || null : null,
      source: "outbox",
    });
  }

  for (const row of Object.values(book.byPartner)) {
    if (!row?.partnerId) continue;
    const partner = partnerById.get(row.partnerId);
    if (row.sentAt) {
      rows.push({
        id: `activatie:${row.partnerId}:${row.sentAt}`,
        at: row.sentAt,
        to: partner?.email || "",
        subject: "Activeer je Matchdesk-account",
        type: "activatie",
        status: "queued",
        reason: "Link aangemaakt in ledger (verzending niet altijd bevestigd).",
        partnerId: row.partnerId,
        leadId: null,
        company: partner?.name || null,
        leadName: null,
        source: "ledger",
      });
    }
    if (row.confirmationSentAt) {
      rows.push({
        id: `bevestiging:${row.partnerId}:${row.confirmationSentAt}`,
        at: row.confirmationSentAt,
        to: partner?.email || "",
        subject: "Je Matchdesk-account is actief",
        type: "bevestiging",
        status: "sent",
        reason: null,
        partnerId: row.partnerId,
        leadId: null,
        company: partner?.name || null,
        leadName: null,
        source: "ledger",
      });
    }
  }

  for (const [key, at] of Object.entries(book.sentKeys)) {
    if (key.startsWith("klus:")) {
      const [, leadId, partnerId] = key.split(":");
      const partner = partnerById.get(partnerId);
      const lead = leadById.get(leadId);
      rows.push({
        id: `sent:${key}`,
        at: typeof at === "string" ? at : null,
        to: partner?.email || "",
        subject: lead?.product ? `Nieuwe klus — ${lead.product}` : "Nieuwe klus",
        type: "klus",
        status: "sent",
        reason: null,
        partnerId: partnerId || null,
        leadId: leadId || null,
        company: partner?.name || null,
        leadName: lead?.name || null,
        source: "ledger",
      });
      continue;
    }
    if (key.startsWith("bericht:")) {
      const parts = key.split(":");
      const partnerId = parts[1];
      const partner = partnerById.get(partnerId);
      const leadId = parts[2] && parts[2] !== "algemeen" ? parts[2] : null;
      const lead = leadId ? leadById.get(leadId) : null;
      rows.push({
        id: `sent:${key}`,
        at: typeof at === "string" ? at : null,
        to: partner?.email || "",
        subject: "Nieuw bericht via Matchdesk",
        type: "bericht",
        status: "sent",
        reason: null,
        partnerId: partnerId || null,
        leadId,
        company: partner?.name || null,
        leadName: lead?.name || null,
        source: "ledger",
      });
    }
  }

  for (const job of book.pendingJobs) {
    if (!job?.leadId || !job?.partnerId) continue;
    const partner = partnerById.get(job.partnerId);
    const lead = leadById.get(job.leadId);
    rows.push({
      id: `pending:${job.leadId}:${job.partnerId}`,
      at: null,
      to: partner?.email || "",
      subject: lead?.product ? `Nieuwe klus — ${lead.product}` : "Nieuwe klus",
      type: "klus",
      status: "queued",
      reason: "Wacht op Actief bedrijf of geldig e-mailadres.",
      partnerId: job.partnerId,
      leadId: job.leadId,
      company: partner?.name || null,
      leadName: lead?.name || null,
      source: "ledger",
    });
  }

  // Prefer outbox rows over reconstructed ledger duplicates (same type+partner+time window).
  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const stamp = row.at || "pending";
    const fingerprint =
      row.source === "outbox"
        ? row.id
        : `${row.type}|${row.partnerId || ""}|${row.leadId || ""}|${stamp}|${row.status}`;
    if (seen.has(fingerprint)) continue;
    // Skip ledger reconstructions when outbox already logged the same event roughly.
    if (row.source === "ledger") {
      const covered = deduped.some(
        (other) =>
          other.source === "outbox" &&
          other.type === row.type &&
          other.partnerId === row.partnerId &&
          (other.leadId || null) === (row.leadId || null) &&
          other.at &&
          row.at &&
          Math.abs(Date.parse(other.at) - Date.parse(row.at)) < 60_000,
      );
      if (covered) continue;
    }
    seen.add(fingerprint);
    deduped.push(row);
  }

  deduped.sort((a, b) => {
    const ta = a.at ? Date.parse(a.at) : 0;
    const tb = b.at ? Date.parse(b.at) : 0;
    return tb - ta;
  });

  return {
    rows: deduped.slice(0, Math.max(1, Number(limit) || 100)),
    gaps: [
      "Resend-leveringsstatus (opens/bounces) staat niet in dit logboek.",
      "Voor entries zonder outbox-regel komen status en onderwerp uit de mail-ledger-sleutels.",
      "Activatiemail in de ledger betekent ‘link aangemaakt’; verzenden kan alsnog mislukt zijn zonder RESEND_API_KEY.",
      "Cold- en follow-upmails via Gmail staan hier alleen nadat ze handmatig zijn gelogd. Er is geen live Inbox/Sent-sync.",
    ],
  };
}

export function appendOutbox(ledger, entry) {
  const book = normalizeLedger(ledger);
  const safe = entry && typeof entry === "object" ? entry : {};
  const messageId = cleanMessageId(safe.messageId);
  if (messageId && book.outbox.some((row) => row && row.messageId === messageId)) {
    return book;
  }
  const row = {
    id: safe.id || `mail-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at: safe.at || new Date().toISOString(),
    to: String(safe.to || "").trim().toLowerCase(),
    subject: String(safe.subject || "").slice(0, 200),
    type: canonicalType(safe.type),
    status: safe.status || "unknown",
    reason: safe.reason ? String(safe.reason).slice(0, 300) : null,
    partnerId: safe.partnerId || null,
    leadId: safe.leadId || null,
  };
  if (messageId) row.messageId = messageId;
  return {
    ...book,
    outbox: [row, ...book.outbox].slice(0, 500),
  };
}

/**
 * Validate one manually logged mail and append it to the outbox.
 * Does not store HTML, text, or body. The same messageId is a no-op.
 * Status defaults to sent. Used by POST /api/mail/log.
 */
export function recordOutbox(ledger, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, status: 400, message: "Ongeldige invoer." };
  }
  const to = String(input.to || "").trim().toLowerCase();
  if (!validEmail(to)) {
    return { ok: false, status: 400, message: "Geldig e-mailadres (to) is verplicht." };
  }
  const subject = String(input.subject || "").trim();
  if (!subject) {
    return { ok: false, status: 400, message: "Onderwerp is verplicht." };
  }
  const type = String(input.type || "").trim().toLowerCase();
  if (!MAIL_TYPES.includes(type)) {
    return {
      ok: false,
      status: 400,
      message: "Type moet activatie, bevestiging, klus, bericht, cold, fu of overig zijn.",
    };
  }
  const status =
    input.status == null || String(input.status).trim() === ""
      ? "sent"
      : String(input.status).trim().toLowerCase();
  if (!MAIL_LOG_STATUSES.includes(status)) {
    return { ok: false, status: 400, message: "Status moet sent, failed of queued zijn." };
  }
  let at = new Date().toISOString();
  if (input.sentAt != null && String(input.sentAt).trim() !== "") {
    const parsed = Date.parse(input.sentAt);
    if (Number.isNaN(parsed)) {
      return { ok: false, status: 400, message: "sentAt is geen geldige datum." };
    }
    at = new Date(parsed).toISOString();
  }
  const messageId = cleanMessageId(input.messageId);
  const book = normalizeLedger(ledger);
  if (messageId) {
    const existing = book.outbox.find((row) => row && row.messageId === messageId);
    if (existing) {
      return { ok: true, duplicate: true, ledger: book, row: existing };
    }
  }
  const next = appendOutbox(book, {
    to,
    subject,
    type,
    status,
    reason: cleanReason(input.reason),
    partnerId: cleanId(input.partnerId),
    leadId: cleanId(input.leadId),
    messageId,
    at,
  });
  return { ok: true, duplicate: false, ledger: next, row: next.outbox[0] };
}
