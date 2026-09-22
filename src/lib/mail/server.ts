import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { auth } from "@/lib/auth/server";
import { isOwnerEmail } from "@/lib/owner";
import type { Lead, Partner } from "@/lib/matchdesk";
import { readWorkspaceFile, writeWorkspaceFile } from "@/lib/workspace-file";
import {
  decideActivate,
  decideGate,
  emptyLedger,
  listActivationStatus,
  listMailActivity,
  appendOutbox,
  markConfirmationSent,
  markJobsSent,
  markKeySent,
  newToken,
  planJobMails,
  planMessage,
  previewActivation,
} from "@/lib/mail/core.mjs";

type MailResult = { ok: boolean; skipped?: boolean; reason?: string };

type Outbound = { to: string; subject: string; html: string; text: string };

type MailMeta = {
  type?: "activatie" | "bevestiging" | "klus" | "bericht" | "overig";
  partnerId?: string;
  leadId?: string;
};

function dataDir() {
  return process.env.MATCHDESK_DATA?.trim() || "/opt/matchdesk/data";
}

function ledgerPath() {
  return `${dataDir()}/mail-ledger.json`;
}

export function publicOrigin() {
  return (process.env.MATCHDESK_PUBLIC_URL || process.env.BETTER_AUTH_URL || "https://www.getmatchdesk.nl").replace(
    /\/$/,
    "",
  );
}

export function fromAddress() {
  return process.env.FROM_EMAIL?.trim() || "info@getmatchdesk.nl";
}

function loadLedger() {
  try {
    const parsed = JSON.parse(readFileSync(ledgerPath(), "utf8"));
    return parsed && typeof parsed === "object" ? parsed : emptyLedger();
  } catch {
    return emptyLedger();
  }
}

function saveLedger(ledger: unknown) {
  const file = ledgerPath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(ledger, null, 2));
}

export async function ownerFrom(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return isOwnerEmail(session?.user?.email);
  } catch {
    return false;
  }
}

export async function sendMail(message: Outbound, meta: MailMeta = {}): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = fromAddress();
  let result: MailResult;
  if (!apiKey) {
    console.warn("[matchdesk-mail] RESEND_API_KEY ontbreekt; niet verzonden:", message.subject);
    result = { ok: false, skipped: true, reason: "RESEND_API_KEY ontbreekt" };
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Matchdesk <${from}>`,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error("[matchdesk-mail] resend", res.status, detail.slice(0, 400));
        result = { ok: false, reason: `Resend ${res.status}` };
      } else {
        result = { ok: true };
      }
    } catch (err) {
      console.error("[matchdesk-mail] verzenden mislukt", err);
      result = { ok: false, reason: "verzenden mislukt" };
    }
  }
  try {
    const status = result.ok ? "sent" : result.skipped ? "queued" : "failed";
    saveLedger(
      appendOutbox(loadLedger(), {
        to: message.to,
        subject: message.subject,
        type: meta.type || "overig",
        status,
        reason: result.reason || null,
        partnerId: meta.partnerId,
        leadId: meta.leadId,
      }),
    );
  } catch (err) {
    console.error("[matchdesk-mail] outbox log", err);
  }
  return result;
}

export function mailActivity(limit = 100) {
  const ws = readWorkspaceFile();
  return listMailActivity({
    ledger: loadLedger(),
    partners: ws.partners,
    leads: ws.leads,
    limit,
  });
}

export function activatedAtById() {
  const ledger = loadLedger();
  const map: Record<string, string> = {};
  const rows = ledger.byPartner && typeof ledger.byPartner === "object" ? ledger.byPartner : {};
  for (const row of Object.values(rows) as Array<{ partnerId?: string; activatedAt?: string }>) {
    if (row?.partnerId && row.activatedAt) map[row.partnerId] = row.activatedAt;
  }
  return map;
}

export function gateStatus(partners: Partner[]) {
  return listActivationStatus(partners, loadLedger());
}

export async function sendActivationMail(partnerId: string, resend = false) {
  const ws = readWorkspaceFile();
  const token = newToken();
  const decided = decideGate({
    partners: ws.partners,
    ledger: loadLedger(),
    partnerId,
    resend,
    now: Date.now(),
    token,
    origin: publicOrigin(),
  });
  if (!decided.ok) return decided;
  if (decided.alreadySent) return decided;
  saveLedger(decided.ledger);
  const mailed = await sendMail(decided.email, { type: "activatie", partnerId });
  return {
    ok: true,
    mailed: mailed.ok,
    skipped: Boolean(mailed.skipped),
    message: mailed.ok
      ? "Activatiemail verstuurd."
      : mailed.reason || "Link aangemaakt, mail niet verzonden.",
    activationUrl: mailed.ok ? undefined : decided.activationUrl,
    email: decided.email.to,
  };
}

export async function readActivation(token: string) {
  const ws = readWorkspaceFile();
  return previewActivation({
    partners: ws.partners,
    ledger: loadLedger(),
    token,
    now: Date.now(),
  });
}

export async function activateFromToken(token: string) {
  const ws = readWorkspaceFile();
  const decided = decideActivate({
    partners: ws.partners,
    ledger: loadLedger(),
    token,
    now: Date.now(),
    portalUrl: `${publicOrigin()}/bedrijf`,
  });
  if (!decided.ok) return decided;
  if (decided.already) {
    if (decided.partners) writeWorkspaceFile({ ...readWorkspaceFile(), partners: decided.partners });
    return {
      ok: true,
      already: true,
      company: decided.company,
      mailed: !decided.mailedSkipped,
      message: decided.mailedSkipped
        ? `${decided.company} is geactiveerd. De bevestigingsmail kon nu niet worden verstuurd.`
        : `${decided.company} is al geactiveerd.`,
    };
  }
  if (decided.ledger && !decided.retryConfirmation) saveLedger(decided.ledger);
  if (decided.partners) {
    writeWorkspaceFile({ ...readWorkspaceFile(), partners: decided.partners });
  }
  let mailed = { ok: false, skipped: true, reason: "geen bevestigingsmail" } as MailResult;
  if (decided.email) {
    mailed = await sendMail(decided.email, {
      type: "bevestiging",
      partnerId: decided.partnerId,
    });
    if (mailed.ok && decided.partnerId) {
      saveLedger(markConfirmationSent(loadLedger(), decided.partnerId, Date.now()));
    }
  }
  try {
    const fresh = readWorkspaceFile();
    await notifyNewJobs(fresh.leads, fresh.leads, fresh.partners);
  } catch (err) {
    console.error("[matchdesk-mail] klus na activatie", err);
  }
  return {
    ok: true,
    already: false,
    company: decided.company,
    mailed: mailed.ok,
    message: mailed.ok
      ? `${decided.company} is geactiveerd. De bevestiging is onderweg.`
      : `${decided.company} is geactiveerd. De bevestigingsmail kon nu niet worden verstuurd.`,
  };
}

export async function notifyNewJobs(before: Lead[], after: Lead[], partners: Partner[]) {
  const current = loadLedger();
  const planned = planJobMails({
    beforeLeads: before,
    afterLeads: after,
    partners,
    ledger: current,
    portalUrl: `${publicOrigin()}/bedrijf`,
  });
  const beforePending = JSON.stringify(current.pendingJobs ?? []);
  const afterPending = JSON.stringify(planned.ledger.pendingJobs ?? []);
  if (beforePending !== afterPending) saveLedger(planned.ledger);
  const sent: string[] = [];
  for (const item of planned.emails) {
    const result = await sendMail(item.mail, {
      type: "klus",
      partnerId: item.job?.partnerId,
      leadId: item.job?.leadId,
    });
    if (result.ok) sent.push(item.key);
  }
  if (sent.length) saveLedger(markJobsSent(loadLedger(), sent, Date.now()));
}

export async function sendPartnerMessage(input: { partnerId: string; leadId?: string; preview: string }) {
  const ws = readWorkspaceFile();
  const partner = ws.partners.find((item) => item.id === input.partnerId);
  const lead = input.leadId ? ws.leads.find((item) => item.id === input.leadId) : undefined;
  const planned = planMessage({
    partner,
    lead,
    preview: input.preview,
    ledger: loadLedger(),
    portalUrl: `${publicOrigin()}/bedrijf`,
  });
  if (!planned.ok || planned.alreadySent) return planned;
  const mailed = await sendMail(planned.email, {
    type: "bericht",
    partnerId: input.partnerId,
    leadId: input.leadId,
  });
  if (mailed.ok) saveLedger(markKeySent(loadLedger(), planned.key, Date.now()));
  return {
    ok: mailed.ok,
    status: mailed.ok ? 200 : 502,
    mailed: mailed.ok,
    skipped: Boolean(mailed.skipped),
    message: mailed.ok ? "Berichtmail verstuurd." : mailed.reason || "Berichtmail niet verzonden.",
  };
}
