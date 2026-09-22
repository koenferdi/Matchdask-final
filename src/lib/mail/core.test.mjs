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
} from "./core.mjs";

const ORIGIN = "https://www.getmatchdesk.nl";
const DEMO_URL = `${ORIGIN}/activeren?token=DEMO-TOKEN-RD-SOLAR`;
const NOW = Date.parse("2026-09-22T08:00:00.000Z");

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
  assert.doesNotMatch(`${mail.html}\n${mail.text}`, /kennismaking/i);
  assert.equal(mail.subject, "Activeer je Matchdesk-account");
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
