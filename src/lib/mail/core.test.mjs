// @ts-nocheck
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  decideActivate,
  decideGate,
  emptyLedger,
  guardPartnerStatus,
  hashToken,
  markConfirmationSent,
  markJobsSent,
  planJobMails,
  planMessage,
  previewActivation,
  renderActivationEmail,
  renderConfirmationEmail,
  renderJobEmail,
  renderMessageEmail,
  listMailActivity,
  appendOutbox,
  recordOutbox,
} from "./core.mjs";

const ORIGIN = "https://www.getmatchdesk.nl";
const DEMO_URL = `${ORIGIN}/activeren?token=DEMO-TOKEN-RD-SOLAR`;
const NOW = Date.parse("2026-09-22T08:00:00.000Z");
const SOCIAL_URLS = [
  "https://www.instagram.com/matchdesknl/",
  "https://www.facebook.com/matchdesknl",
  "https://wa.me/31643610083",
];

function assertSocials(mail) {
  for (const url of SOCIAL_URLS) {
    assert.ok(mail.html.includes(url), url);
    assert.ok(mail.text.includes(url), url);
  }
  assert.match(mail.html, /Instagram<\/a> · <a [^>]+>Facebook<\/a> · <a [^>]+>WhatsApp<\/a>/);
  assert.match(mail.text, /Instagram: https:\/\/www\.instagram\.com\/matchdesknl\//);
  assert.match(mail.text, /Facebook: https:\/\/www\.facebook\.com\/matchdesknl/);
  assert.match(mail.text, /WhatsApp: https:\/\/wa\.me\/31643610083/);
  assert.doesNotMatch(mail.html, /<img[^>]+(?:instagram|facebook|whatsapp)/i);
}

function partner(patch = {}) {
  return {
    id: "P-RD",
    name: "RD Solar Group",
    email: "info@rdsolargroup.nl",
    contactName: "Pieter",
    kvk: "12345678",
    products: ["Zonnepanelen"],
    prefixes: ["48"],
    capacity: 3,
    status: "Te beoordelen",
    quality: 0,
    ...patch,
  };
}

function lead(patch = {}) {
  return {
    id: "MD-1",
    product: "Zonnepanelen",
    postcode: "4811 AB",
    city: "Breda",
    name: "Fleur de Vries",
    email: "fleur@example.nl",
    phone: "0612345678",
    partnerId: "",
    status: "Nieuw",
    ...patch,
  };
}

test("activatiemail volgt het branded voorbeeld", () => {
  const mail = renderActivationEmail({
    greeting: "Pieter",
    company: "RD Solar Group",
    activationUrl: DEMO_URL,
  });
  const html = readFileSync(new URL("../../../ops/mail/activatie-registratie.html", import.meta.url), "utf8");
  const text = readFileSync(new URL("../../../ops/mail/activatie-registratie.txt", import.meta.url), "utf8");
  assert.equal(mail.html, html.trimEnd());
  assert.equal(mail.text, text);
  assert.match(mail.html, /bgcolor="#0D9488"/);
  assert.match(mail.html, />M</);
  assert.match(mail.html, /Activeer account/);
  assert.match(mail.html, /DEMO-TOKEN-RD-SOLAR/);
  assert.match(mail.html, /info@getmatchdesk\.nl/);
  assertSocials(mail);
  assert.doesNotMatch(`${mail.html}\n${mail.text}`, /kennismaking/i);
  assert.equal(mail.subject, "Activeer je Matchdesk-account");
});

test("bevestiging, klus en bericht erven dezelfde social footer", () => {
  const mails = [
    renderConfirmationEmail({
      greeting: "Pieter",
      company: "RD Solar Group",
      portalUrl: `${ORIGIN}/bedrijf`,
    }),
    renderJobEmail({
      greeting: "Pieter",
      company: "RD Solar Group",
      lead: lead(),
      portalUrl: `${ORIGIN}/bedrijf`,
    }),
    renderMessageEmail({
      greeting: "Pieter",
      company: "RD Solar Group",
      preview: "De schouwing kan dinsdag.",
      portalUrl: `${ORIGIN}/bedrijf`,
      dossier: "MD-1",
    }),
  ];
  for (const mail of mails) assertSocials(mail);
});

test("bedrijfsnaam wordt ge-escaped", () => {
  const mail = renderActivationEmail({
    greeting: "Sam",
    company: `<script>alert("x")</script>`,
    activationUrl: DEMO_URL,
  });
  assert.equal(mail.html.includes("<script>alert"), false);
  assert.match(mail.html, /&lt;script&gt;/);
});

test("gate weigert zonder kvk of werkgebied en stuurt nog geen bevestiging", () => {
  const missing = decideGate({
    partners: [partner({ kvk: "12" })],
    ledger: emptyLedger(),
    partnerId: "P-RD",
    resend: false,
    now: NOW,
    token: "tok",
    origin: ORIGIN,
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.email, undefined);

  const noZone = decideGate({
    partners: [partner({ prefixes: [] })],
    ledger: emptyLedger(),
    partnerId: "P-RD",
    resend: false,
    now: NOW,
    token: "tok",
    origin: ORIGIN,
  });
  assert.equal(noZone.ok, false);
});

test("gate mailt de activatielink en pas daarna activeert de bevestiging", () => {
  const gate = decideGate({
    partners: [partner()],
    ledger: emptyLedger(),
    partnerId: "P-RD",
    resend: false,
    now: NOW,
    token: "tok-een",
    origin: ORIGIN,
  });
  assert.equal(gate.ok, true);
  assert.equal(gate.email.subject, "Activeer je Matchdesk-account");
  assert.match(gate.email.text, /Na activatie ontvang je een aparte bevestiging/);
  assert.equal(gate.ledger.byPartner["P-RD"].tokenHash, hashToken("tok-een"));
  assert.equal(gate.ledger.byPartner["P-RD"].activatedAt, undefined);

  const again = decideGate({
    partners: [partner()],
    ledger: gate.ledger,
    partnerId: "P-RD",
    resend: false,
    now: NOW + 1000,
    token: "tok-twee",
    origin: ORIGIN,
  });
  assert.equal(again.alreadySent, true);
  assert.equal(again.email, undefined);

  const preview = previewActivation({
    partners: [partner()],
    ledger: gate.ledger,
    token: "tok-een",
    now: NOW + 1000,
  });
  assert.equal(preview.state, "klaar");
  assert.equal(preview.company, "RD Solar Group");

  const activated = decideActivate({
    partners: [partner()],
    ledger: gate.ledger,
    token: "tok-een",
    now: NOW + 2000,
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(activated.ok, true);
  assert.equal(activated.email.subject, "Je Matchdesk-account is actief");
  assert.equal(activated.partners.find((item) => item.id === "P-RD").status, "Actief");
  assert.equal(activated.ledger.byPartner["P-RD"].confirmationSentAt, undefined);
  assert.match(activated.email.html, /is geactiveerd/);
  assert.doesNotMatch(activated.email.html, /Activeer account/);

  const marked = markConfirmationSent(activated.ledger, "P-RD", NOW + 3000);
  const second = decideActivate({
    partners: activated.partners,
    ledger: marked,
    token: "tok-een",
    now: NOW + 4000,
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(second.already, true);
  assert.equal(second.email, undefined);
});

test("verlopen link activeert niet en een mislukte bevestiging kan opnieuw", () => {
  const gate = decideGate({
    partners: [partner()],
    ledger: emptyLedger(),
    partnerId: "P-RD",
    resend: false,
    now: NOW,
    token: "tok",
    origin: ORIGIN,
  });
  const expired = decideActivate({
    partners: [partner()],
    ledger: gate.ledger,
    token: "tok",
    now: NOW + 8 * 24 * 60 * 60 * 1000,
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(expired.ok, false);
  assert.equal(expired.state, "verlopen");

  const activated = decideActivate({
    partners: [partner()],
    ledger: gate.ledger,
    token: "tok",
    now: NOW + 1000,
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  const retry = decideActivate({
    partners: activated.partners,
    ledger: activated.ledger,
    token: "tok",
    now: NOW + 2000,
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(retry.retryConfirmation, true);
  assert.equal(retry.email.subject, "Je Matchdesk-account is actief");
});

test("status Actief kan niet zonder activatie, wel pauzeren daarna", () => {
  const blocked = guardPartnerStatus([partner()], [partner({ status: "Actief" })], {});
  assert.equal(blocked[0].status, "Te beoordelen");

  const stamped = "2026-09-22T09:00:00.000Z";
  const kept = guardPartnerStatus(
    [partner({ status: "Actief", activatedAt: stamped })],
    [partner({ status: "Te beoordelen" })],
    { "P-RD": stamped },
  );
  assert.equal(kept[0].status, "Actief");

  const paused = guardPartnerStatus(
    [partner({ status: "Actief", activatedAt: stamped })],
    [partner({ status: "Gepauzeerd", activatedAt: stamped })],
    { "P-RD": stamped },
  );
  assert.equal(paused[0].status, "Gepauzeerd");
});

test("klusmail alleen bij nieuwe toewijzing aan een actief bedrijf", () => {
  const inactive = planJobMails({
    beforeLeads: [lead()],
    afterLeads: [lead({ partnerId: "P-RD", status: "Gematcht" })],
    partners: [partner()],
    ledger: emptyLedger(),
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(inactive.emails.length, 0);
  assert.equal(inactive.ledger.pendingJobs.length, 1);

  const activePartner = partner({ status: "Actief" });
  const first = planJobMails({
    beforeLeads: [lead()],
    afterLeads: [lead({ partnerId: "P-RD", status: "Gematcht" })],
    partners: [activePartner],
    ledger: emptyLedger(),
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(first.emails.length, 1);
  assert.match(first.emails[0].mail.html, /één lead, één installateur/i);
  assert.match(first.emails[0].mail.text, /€0/);
  const sent = markJobsSent(first.ledger, [first.emails[0].key], NOW);
  const repeat = planJobMails({
    beforeLeads: [lead({ partnerId: "P-RD", status: "Gematcht" })],
    afterLeads: [lead({ partnerId: "P-RD", status: "Gematcht" })],
    partners: [activePartner],
    ledger: sent,
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(repeat.emails.length, 0);
});

test("berichtmail bestaat en gaat niet naar een bedrijf in beoordeling", () => {
  const blocked = planMessage({
    partner: partner(),
    lead: lead({ partnerId: "P-RD" }),
    preview: "De schouwing kan dinsdag.",
    ledger: emptyLedger(),
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(blocked.ok, false);

  const ready = planMessage({
    partner: partner({ status: "Actief" }),
    lead: lead({ partnerId: "P-RD" }),
    preview: "De schouwing kan dinsdag.",
    ledger: emptyLedger(),
    portalUrl: `${ORIGIN}/bedrijf`,
  });
  assert.equal(ready.ok, true);
  assert.equal(ready.email.subject, "Nieuw bericht via Matchdesk");
  assert.match(ready.email.html, /Open het bericht/);
  assert.doesNotMatch(`${ready.email.html}${renderConfirmationEmail({ greeting: "Pieter", company: "RD Solar Group", portalUrl: `${ORIGIN}/bedrijf` }).html}${renderJobEmail({ greeting: "Pieter", company: "RD Solar Group", lead: lead(), portalUrl: `${ORIGIN}/bedrijf` }).html}`, /kennismaking/i);
});

test("listMailActivity toont outbox en ledger-sleutels", () => {
  let ledger = emptyLedger();
  ledger = appendOutbox(ledger, {
    to: "info@rdsolargroup.nl",
    subject: "Activeer je Matchdesk-account",
    type: "activatie",
    status: "sent",
    partnerId: "P-RD",
    at: "2026-09-22T08:00:00.000Z",
  });
  ledger = {
    ...ledger,
    sentKeys: { "klus:MD-1:P-RD": "2026-09-22T09:00:00.000Z" },
    pendingJobs: [{ leadId: "MD-2", partnerId: "P-RD" }],
  };
  const listed = listMailActivity({
    ledger,
    partners: [partner({ status: "Actief" })],
    leads: [lead({ id: "MD-1", partnerId: "P-RD" }), lead({ id: "MD-2", partnerId: "P-RD" })],
  });
  assert.ok(listed.rows.length >= 2);
  assert.ok(listed.rows.some((row) => row.type === "activatie" && row.status === "sent"));
  assert.ok(listed.rows.some((row) => row.type === "klus" && row.status === "queued"));
  assert.ok(listed.gaps.length >= 1);
});

test("appendOutbox en listMailActivity tonen cold en fu zonder body", () => {
  let ledger = emptyLedger();
  ledger = appendOutbox(ledger, {
    to: "Piet@Solar.nl",
    subject: "Korte introductie Matchdesk",
    type: "cold",
    status: "sent",
    messageId: " <gmail-cold-1> ",
    partnerId: "P-RD",
    at: "2026-09-25T10:00:00.000Z",
    html: "<p>niet bewaren</p>",
    text: "niet bewaren",
    body: "niet bewaren",
  });
  ledger = appendOutbox(ledger, {
    to: "piet@solar.nl",
    subject: "Follow-up Matchdesk",
    type: "fu",
    status: "sent",
    messageId: "<gmail-fu-1>",
    at: "2026-09-25T12:00:00.000Z",
  });
  ledger = appendOutbox(ledger, {
    to: "ander@bedrijf.nl",
    subject: "Losse notitie",
    type: "overig",
    at: "2026-09-25T11:00:00.000Z",
  });

  assert.equal(ledger.outbox.length, 3);
  const cold = ledger.outbox.find((row) => row.type === "cold");
  assert.equal(cold.to, "piet@solar.nl");
  assert.equal(cold.messageId, "<gmail-cold-1>");
  assert.equal(cold.html, undefined);
  assert.equal(cold.text, undefined);
  assert.equal(cold.body, undefined);
  assert.ok(ledger.outbox.some((row) => row.type === "fu"));
  assert.ok(ledger.outbox.some((row) => row.type === "overig" && row.status === "unknown"));
  const withoutId = appendOutbox(
    appendOutbox(emptyLedger(), { to: "a@b.nl", subject: "Eén", type: "overig" }),
    { to: "a@b.nl", subject: "Twee", type: "overig" },
  );
  assert.equal(withoutId.outbox.length, 2);

  const listed = listMailActivity({
    ledger,
    partners: [partner({ status: "Actief", email: "piet@solar.nl" })],
    leads: [],
  });
  assert.equal(listed.rows.find((row) => row.type === "cold").subject, "Korte introductie Matchdesk");
  assert.equal(listed.rows.find((row) => row.type === "cold").company, "RD Solar Group");
  assert.equal(listed.rows.find((row) => row.type === "fu").messageId, "<gmail-fu-1>");
  assert.ok(listed.rows.some((row) => row.type === "overig"));
  const order = listed.rows.map((row) => row.type);
  assert.ok(order.indexOf("fu") < order.indexOf("overig"));
  assert.ok(order.indexOf("overig") < order.indexOf("cold"));
});

test("recordOutbox slaat een dubbele messageId over en laat systeemrijen staan", () => {
  const first = recordOutbox(emptyLedger(), {
    to: "info@partner.nl",
    subject: "Matchdesk — korte introductie",
    type: "cold",
    messageId: "<abc@mail.gmail.com>",
    partnerId: "P-RD",
    sentAt: "2026-09-25T10:00:00.000Z",
    html: "<p>geheim</p>",
    body: "geheim",
  });
  assert.equal(first.ok, true);
  assert.equal(first.duplicate, false);
  assert.equal(first.row.status, "sent");
  assert.equal(first.row.type, "cold");
  assert.equal(first.row.at, "2026-09-25T10:00:00.000Z");
  assert.equal(first.row.html, undefined);
  assert.equal(first.row.body, undefined);
  assert.equal(first.ledger.outbox.length, 1);

  const again = recordOutbox(first.ledger, {
    to: "iemand@anders.nl",
    subject: "Dit mag niet overschrijven",
    type: "fu",
    status: "failed",
    messageId: "<abc@mail.gmail.com>",
  });
  assert.equal(again.ok, true);
  assert.equal(again.duplicate, true);
  assert.equal(again.ledger.outbox.length, 1);
  assert.equal(again.row.subject, "Matchdesk — korte introductie");
  assert.equal(again.row.type, "cold");
  assert.equal(again.ledger.outbox[0].status, "sent");

  const withSystem = appendOutbox(again.ledger, {
    to: "info@rdsolargroup.nl",
    subject: "Activeer je Matchdesk-account",
    type: "activatie",
    status: "sent",
    partnerId: "P-RD",
    at: "2026-09-22T08:00:00.000Z",
  });
  const fu = recordOutbox(withSystem, {
    to: "info@partner.nl",
    subject: "Korte follow-up",
    type: "FU",
    messageId: "<def@mail.gmail.com>",
  });
  assert.equal(fu.ok, true);
  assert.equal(fu.duplicate, false);
  assert.equal(fu.row.type, "fu");
  assert.equal(fu.ledger.outbox.length, 3);

  const listed = listMailActivity({
    ledger: fu.ledger,
    partners: [partner()],
    leads: [],
  });
  assert.ok(listed.rows.some((row) => row.type === "activatie" && row.status === "sent"));
  assert.ok(listed.rows.some((row) => row.type === "cold"));
  assert.ok(listed.rows.some((row) => row.type === "fu" && row.subject === "Korte follow-up"));

  const direct = appendOutbox(fu.ledger, {
    to: "info@partner.nl",
    subject: "nog een keer",
    type: "cold",
    messageId: "<abc@mail.gmail.com>",
  });
  assert.equal(direct.outbox.length, 3);

  assert.equal(recordOutbox(emptyLedger(), { to: "geen-mail", subject: "x", type: "cold" }).status, 400);
  assert.equal(recordOutbox(emptyLedger(), { to: "a@b.nl", subject: "  ", type: "cold" }).ok, false);
  assert.equal(recordOutbox(emptyLedger(), { to: "a@b.nl", subject: "Hoi", type: "nieuwsbrief" }).ok, false);
  assert.equal(recordOutbox(emptyLedger(), { to: "a@b.nl", subject: "Hoi", type: "cold", sentAt: "geen-datum" }).ok, false);
  assert.equal(
    recordOutbox(emptyLedger(), { to: "a@b.nl", subject: "Hoi", type: "cold", status: "bounced" }).ok,
    false,
  );
});
