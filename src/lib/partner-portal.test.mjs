import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { FINANCIAL_DELETE_BLOCKED, hasFinancialRegistration, mergeProtectedLeads } from "./finance.ts";
import { guardPartnerStatus } from "./mail/core.mjs";
import { PRODUCTS, TERMS, findPartnerFor } from "./matchdesk.ts";
import {
  applyPartnerSelfServe,
  findOwnPartner,
  GATE_MESSAGE,
  isMatchablePartner,
  parseCapacity,
  resolveSelfServeTarget,
  selfServeView,
  VERIFY_EMAIL_MESSAGE,
  workspaceIdentity,
} from "./partner-portal.mjs";

const STAMP = "2026-09-22T09:00:00.000Z";

function partner(patch = {}) {
  return {
    id: "P-RD",
    name: "RD Solar Group",
    email: "info@rdsolargroup.nl",
    kvk: "12345678",
    products: ["Zonnepanelen"],
    prefixes: ["48"],
    capacity: 3,
    status: "Te beoordelen",
    quality: 0,
    ...patch,
  };
}

test("capacity 0 and paused partners are not matchable", () => {
  assert.equal(isMatchablePartner(partner({ status: "Actief", capacity: 3 })), true);
  assert.equal(isMatchablePartner(partner({ status: "Actief", capacity: 0 })), false);
  assert.equal(isMatchablePartner(partner({ status: "Actief", capacity: -1 })), false);
  assert.equal(isMatchablePartner(partner({ status: "Gepauzeerd", capacity: 4 })), false);
  assert.equal(isMatchablePartner(partner({ status: "Actief", capacity: 4, example: true })), false);
});

test("Te beoordelen stays read-only until admission", () => {
  assert.equal(selfServeView(partner()).mode, "review");
  const blocked = applyPartnerSelfServe(partner(), { status: "Actief", capacity: 2 }, null);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.message, GATE_MESSAGE);
  assert.equal(blocked.partner.status, "Te beoordelen");
  assert.equal(blocked.partner.capacity, 3);
});

test("admission stamp or Actief/Gepauzeerd unlocks self-serve, archive does not", () => {
  const admitted = partner({ status: "Te beoordelen", activatedAt: STAMP });
  assert.equal(selfServeView(admitted).mode, "manage");
  assert.equal(selfServeView(admitted).canActivate, true);

  const fromLedger = applyPartnerSelfServe(partner(), { status: "Actief" }, STAMP);
  assert.equal(fromLedger.ok, true);
  assert.equal(fromLedger.partner.status, "Actief");
  assert.equal(fromLedger.partner.activatedAt, STAMP);

  const live = partner({ status: "Actief", activatedAt: STAMP, capacity: 4 });
  const paused = applyPartnerSelfServe(live, { status: "Gepauzeerd" }, STAMP);
  assert.equal(paused.partner.status, "Gepauzeerd");
  assert.equal(paused.partner.capacity, 4);
  assert.equal(paused.partner.name, "RD Solar Group");

  const again = applyPartnerSelfServe(paused.partner, { status: "Actief", capacity: 0 }, STAMP);
  assert.equal(again.ok, true);
  assert.equal(again.partner.status, "Actief");
  assert.equal(again.partner.capacity, 0);

  const archived = partner({ status: "Gearchiveerd", activatedAt: STAMP });
  assert.equal(selfServeView(archived).mode, "archived");
  assert.equal(applyPartnerSelfServe(archived, { status: "Actief" }, STAMP).ok, false);
});

test("Gepauzeerd without an admission stamp cannot self-promote to Actief", () => {
  const paused = partner({ status: "Gepauzeerd" });
  assert.equal(selfServeView(paused).canActivate, false);
  const blocked = applyPartnerSelfServe(paused, { status: "Actief" }, null);
  assert.equal(blocked.ok, false);
  const capacity = applyPartnerSelfServe(paused, { capacity: 1 }, null);
  assert.equal(capacity.ok, true);
  assert.equal(capacity.partner.status, "Gepauzeerd");
  assert.equal(capacity.partner.capacity, 1);
});

test("capacity must be an integer from 0 through 999", () => {
  const live = partner({ status: "Actief", activatedAt: STAMP });
  assert.equal(applyPartnerSelfServe(live, { capacity: 1.5 }, STAMP).ok, false);
  assert.equal(applyPartnerSelfServe(live, { capacity: -1 }, STAMP).ok, false);
  assert.equal(applyPartnerSelfServe(live, { capacity: "1000" }, STAMP).ok, false);
  assert.equal(applyPartnerSelfServe(live, { capacity: "0" }, STAMP).partner.capacity, 0);
  assert.equal(applyPartnerSelfServe(live, { status: "Te beoordelen" }, STAMP).ok, false);
  assert.equal(applyPartnerSelfServe(live, { status: "Gearchiveerd" }, STAMP).ok, false);
});

test("capacity rejects coercible objects, arrays, booleans and invalid boundaries", () => {
  const live = partner({ status: "Actief", activatedAt: STAMP });
  for (const capacity of [[2], { toString: () => "2" }, true, null, "", "2.5", "1e2", Infinity, NaN, 1000]) {
    assert.equal(parseCapacity(capacity).ok, false);
    assert.equal(isMatchablePartner({ ...live, capacity }), false);
    assert.equal(applyPartnerSelfServe(live, { status: "Gepauzeerd", capacity }, STAMP).ok, false);
    assert.equal(live.status, "Actief");
  }
  for (const capacity of [0, "0", 999, "999"]) assert.equal(parseCapacity(capacity).ok, true);
});

test("private workspace identity requires a verified server-session email", () => {
  const ownerEmail = (email) => email === "koen@example.nl";
  for (const emailVerified of [false, undefined, null, "true", 1]) {
    assert.equal(workspaceIdentity({ email: "koen@example.nl", emailVerified }, ownerEmail).owner, false);
    assert.equal(workspaceIdentity({ email: "koen@example.nl", emailVerified }, ownerEmail).verified, false);
  }
  assert.deepEqual(workspaceIdentity({ email: " KOEN@EXAMPLE.NL ", emailVerified: true }, ownerEmail), {
    email: "koen@example.nl", verified: true, owner: true,
  });
  assert.equal(workspaceIdentity({ name: "Koen Eigenaar", email: "ander@example.nl", emailVerified: true }, ownerEmail).owner, false);
});

test("own partner is the login e-mail, preferring Actief", () => {
  const review = partner({ id: "P-1", status: "Te beoordelen" });
  const live = partner({ id: "P-2", status: "Actief", activatedAt: STAMP });
  const other = partner({ id: "P-3", email: "ander@bedrijf.nl", status: "Actief" });
  assert.equal(findOwnPartner([review, other, live], "INFO@rdsolargroup.nl").id, "P-2");
  assert.equal(resolveSelfServeTarget([live], "info@rdsolargroup.nl", "P-9").ok, false);
  assert.equal(resolveSelfServeTarget([live], "info@rdsolargroup.nl", ["P-2"]).ok, false);
  assert.equal(resolveSelfServeTarget([live], "info@rdsolargroup.nl", "P-2").partner.id, "P-2");
  assert.equal(resolveSelfServeTarget([other], "info@rdsolargroup.nl").ok, false);
});

/** Execute the real route handlers with in-memory auth, disk and mail adapters. */
function workspaceRoute({ user = null, workspace = {}, failWrite = false } = {}) {
  let saved = { leads: [], partners: [], subscribers: [], notes: [], ...structuredClone(workspace) };
  let writes = 0;
  let notifications = 0;
  const dependencies = {
    createFileRoute: () => (route) => route,
    auth: { api: { getSession: async () => user ? { user } : null } },
    isOwnerEmail: (email) => email === "koen@example.nl",
    mergeProtectedLeads,
    guardPartnerStatus,
    activatedAtById: () => ({}),
    notifyNewJobs: async () => { notifications++; },
    applyPartnerSelfServe,
    parseCapacity,
    resolveSelfServeTarget,
    VERIFY_EMAIL_MESSAGE,
    workspaceIdentity,
    PRODUCTS,
    TERMS,
    findPartnerFor,
    asSignupPartner: (input) => ({ ...input, status: "Te beoordelen", quality: 0, activatedAt: undefined }),
    publicPartners: (partners) => partners.filter((input) => input.status === "Actief").map((input) => ({ ...input, email: "", activatedAt: undefined })),
    realPartners: (partners) => partners.filter((input) => !input.example),
    readWorkspaceFile: () => structuredClone(saved),
    writeWorkspaceFile: (next) => {
      if (failWrite) throw new Error("disk unavailable");
      writes++;
      saved = structuredClone(next);
    },
  };
  const source = readFileSync(new URL("../routes/api/workspace.ts", import.meta.url), "utf8");
  const executable = stripTypeScriptTypes(source)
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];?\s*/gm, "")
    .replace("export const Route =", "const Route =");
  const handlers = new Function(...Object.keys(dependencies), `${executable}\nreturn Route.server.handlers;`)(...Object.values(dependencies));
  return {
    get: () => handlers.GET({ request: new Request("https://example.nl/api/workspace") }),
    post: (body) => handlers.POST({ request: new Request("https://example.nl/api/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) }),
    state: () => ({ writes, notifications, workspace: saved }),
  };
}

test("workspace route never gives an unverified account private data or writes", async () => {
  const company = partner({ status: "Actief", activatedAt: STAMP });
  for (const email of [company.email, "koen@example.nl"]) {
    const route = workspaceRoute({ user: { email, emailVerified: false }, workspace: { partners: [company], leads: [{ id: "private" }] } });
    const response = await route.get();
    const body = await response.json();
    assert.equal(body.full, false);
    assert.equal(body.ownPartner, null);
    assert.deepEqual(body.workspace.leads, []);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const denied = await route.post({ partnerSelfServe: { id: company.id, capacity: 7 } });
    assert.equal(denied.status, 403);
    assert.equal(route.state().writes, 0);
    assert.equal((await route.post({ siteNotice: "overwrite" })).status, 403);
  }
});

test("workspace route authorizes the own company and reports actual write failure", async () => {
  const company = partner({ status: "Actief", activatedAt: STAMP });
  const user = { email: company.email, emailVerified: true };
  const other = partner({ id: "P-OTHER", email: "other@example.nl", status: "Actief", activatedAt: STAMP });
  const route = workspaceRoute({ user, workspace: { partners: [company, other] } });
  assert.equal((await route.post({ partnerSelfServe: { id: other.id, capacity: 7 } })).status, 409);
  assert.equal((await route.post({ partnerSelfServe: { id: company.id, capacity: [7] } })).status, 422);
  assert.equal((await route.post({ partnerSelfServe: { id: company.id, capacity: 0 } })).status, 200);
  assert.equal(route.state().workspace.partners[0].capacity, 0);
  assert.equal(route.state().workspace.partners[1].capacity, 3);
  const failure = workspaceRoute({ user, workspace: { partners: [company] }, failWrite: true });
  const response = await failure.post({ partnerSelfServe: { id: company.id, capacity: 1 } });
  assert.equal(response.status, 500);
  assert.equal((await response.json()).ok, false);
  assert.equal(failure.state().writes, 0);
});

test("workspace route rejects malformed JSON shapes without a write", async () => {
  const route = workspaceRoute({ user: { email: "koen@example.nl", emailVerified: true } });
  for (const body of [null, [], 7, { partnerSelfServe: null }, { partnerSelfServe: [] }, { leads: {} }]) {
    assert.equal((await route.post(body)).status, 400);
  }
  assert.equal(route.state().writes, 0);
});

test("partial owner writes preserve flags, payments and active dossier", async () => {
  const route = workspaceRoute({
    user: { email: "koen@example.nl", emailVerified: true },
    workspace: { matchingPaused: true, reportPaid: true, exclusivePaid: true, activeLeadId: "MD-existing" },
  });
  assert.equal((await route.post({ siteNotice: "Onderhoud" })).status, 200);
  assert.equal(route.state().workspace.matchingPaused, true);
  assert.equal(route.state().workspace.reportPaid, true);
  assert.equal(route.state().workspace.exclusivePaid, true);
  assert.equal(route.state().workspace.activeLeadId, "MD-existing");
  assert.equal((await route.post({ matchingPaused: false, reportPaid: false })).status, 200);
  assert.equal(route.state().workspace.matchingPaused, false);
  assert.equal(route.state().workspace.reportPaid, false);
});

test("public intake cannot inject a match, invoice or paid status", async () => {
  const route = workspaceRoute();
  const lead = {
    id: "MD-new", product: "Zonnepanelen", postcode: "4811 AB", city: "Breda", address: "Straat 1",
    term: "Binnen 3 maanden", name: "Test", email: "test@example.nl", phone: "0612345678", consent: true,
    status: "Afgerond", partnerId: "P-RD", deal: { outcome: "Gewonnen", invoice: { totalCents: 50000 } },
    deletedAt: STAMP, createdAt: "bad date",
  };
  assert.equal((await route.post({ leads: [lead, lead], reportPaid: true })).status, 200);
  const saved = route.state().workspace;
  assert.equal(saved.leads.length, 1);
  assert.equal(saved.leads[0].status, "Nieuw");
  assert.equal(saved.leads[0].deal, undefined);
  assert.equal(saved.leads[0].partnerId, undefined);
  assert.equal(saved.leads[0].deletedAt, undefined);
  assert.equal(saved.reportPaid, undefined);
  const noConsent = workspaceRoute();
  assert.equal((await noConsent.post({ leads: [{ ...lead, consent: false }] })).status, 422);
  assert.equal(noConsent.state().writes, 0);
});

test("intake receipts represent stored records, including an owner signup", async () => {
  const original = { id: "MD-existing", name: "Existing" };
  const lead = {
    id: "MD-receipt", product: "Zonnepanelen", postcode: "4811 AB", city: "Breda", address: "Straat 1",
    term: "Binnen 3 maanden", name: "Test", email: "test@example.nl", phone: "0612345678", consent: true,
  };
  const route = workspaceRoute({ user: { email: "koen@example.nl", emailVerified: true }, workspace: { leads: [original] } });
  const response = await route.post({ intake: true, leads: [lead] });
  assert.deepEqual((await response.json()).createdLeadIds, [lead.id]);
  assert.equal(route.state().workspace.leads.length, 2);
  assert.equal(route.state().workspace.leads[0].id, original.id);
  const signup = partner();
  const duplicate = workspaceRoute({ workspace: { partners: [signup] } });
  assert.equal((await duplicate.post({ intake: true, partners: [{ ...signup, id: "P-new" }] })).status, 409);
  assert.equal(duplicate.state().writes, 0);
});

function storeHarness(fetch, local = {}) {
  const caches = [];
  const dependencies = {
    create: (initialize) => {
      let state;
      const set = (patch) => { state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) }; };
      const get = () => state;
      state = initialize(set, get);
      return { getState: get, setState: set };
    },
    loadWorkspace: () => ({ leads: [], partners: [], subscribers: [], notes: [], ...local }),
    saveWorkspace: (snapshot) => caches.push(structuredClone(snapshot)),
    newId: (prefix) => `${prefix}-confirmed`,
    findPartnerFor: () => undefined,
    FINANCIAL_DELETE_BLOCKED,
    hasFinancialRegistration,
    fetch,
    window: {},
  };
  const source = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const executable = stripTypeScriptTypes(source)
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];?\s*/gm, "")
    .replace("export const useMatchdesk =", "const useMatchdesk =");
  const store = new Function(...Object.keys(dependencies), `${executable}\nreturn useMatchdesk;`)(...Object.values(dependencies));
  return { store, caches };
}

test("client intake waits for the server's exact receipt before local success", async () => {
  let acknowledge;
  const { store } = storeHarness(() => new Promise((resolve) => { acknowledge = resolve; }));
  store.getState().setDraft({ name: "Test", email: "test@example.nl", postcode: "4811 AB", phone: "0612345678", consent: true });
  const pending = store.getState().submitLead();
  assert.equal(store.getState().leads.length, 0);
  acknowledge(Response.json({ ok: true, createdLeadIds: ["MD-confirmed"] }));
  const lead = await pending;
  assert.equal(lead.id, "MD-confirmed");
  assert.equal(store.getState().leads.length, 1);
  assert.equal(store.getState().activeLeadId, "MD-confirmed");
});

test("client does not claim intake received on failure or missing receipt", async () => {
  for (const response of [Response.json({ ok: true, createdPartnerIds: [] }), Response.json({ ok: false, message: "Server vol" }, { status: 500 })]) {
    const { store, caches } = storeHarness(async () => response);
    await assert.rejects(store.getState().submitPartner(partner()));
    assert.equal(store.getState().partners.length, 0);
    assert.equal(caches.length, 0);
  }
  const { store } = storeHarness(async () => { throw new Error("offline"); });
  await assert.rejects(store.getState().submitLead(), /verbindingsfout/);
  assert.equal(store.getState().leads.length, 0);
});

test("client portal uses server identity and replaces stale cached availability", async () => {
  const stale = partner({ status: "Actief", activatedAt: STAMP, capacity: 9 });
  const fresh = { ...stale, status: "Gepauzeerd", capacity: 0 };
  const { store } = storeHarness(async () => Response.json({ full: false, ownPartner: fresh, workspace: { partners: [] } }), { partners: [stale] });
  store.getState().hydrate();
  assert.equal(store.getState().ownPartner, null);
  await new Promise(setImmediate);
  assert.equal(store.getState().ownPartner.status, "Gepauzeerd");
  assert.equal(store.getState().partners[0].capacity, 0);
  const failed = storeHarness(async () => Response.json({}, { status: 503 }), { partners: [stale] });
  failed.store.getState().hydrate();
  await new Promise(setImmediate);
  assert.equal(failed.store.getState().ownPartner, null);
  assert.match(failed.store.getState().remoteError, /server/);
});

test("owner datasets remain in memory and are not persisted in a browser cache", async () => {
  const { store, caches } = storeHarness(async () => Response.json({ full: true, workspace: { leads: [{ id: "private" }], partners: [partner()], subscribers: [{ email: "private@example.nl" }], notes: [{ text: "private" }] } }));
  store.getState().hydrate();
  await new Promise(setImmediate);
  assert.equal(store.getState().leads.length, 1);
  assert.deepEqual(caches.at(-1).leads, []);
  assert.deepEqual(caches.at(-1).partners, []);
  assert.deepEqual(caches.at(-1).subscribers, []);
  assert.deepEqual(caches.at(-1).notes, []);
});

test("an old owner response cannot overwrite the newer account or its cache", async () => {
  const requests = [];
  const { store, caches } = storeHarness((url, options) => new Promise((resolve, reject) => { requests.push({ resolve, reject, signal: options.signal }); }));
  store.getState().hydrate();
  store.getState().hydrate();
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(requests[1].signal.aborted, false);
  const currentPartner = partner({ id: "P-new-account", email: "new@example.nl" });
  requests[1].resolve(Response.json({ full: false, ownPartner: currentPartner, workspace: { leads: [{ id: "MD-current" }], partners: [] } }));
  await new Promise(setImmediate);
  requests[0].resolve(Response.json({ full: true, workspace: { leads: [{ id: "MD-private-owner" }], partners: [partner()], subscribers: [{ email: "private@example.nl" }], notes: [{ text: "private owner" }] } }));
  await new Promise(setImmediate);
  assert.equal(store.getState().serverOwner, false);
  assert.equal(store.getState().ownPartner.id, currentPartner.id);
  assert.deepEqual(store.getState().leads.map((lead) => lead.id), ["MD-current"]);
  assert.deepEqual(store.getState().subscribers, []);
  assert.deepEqual(store.getState().notes, []);
  assert.equal(store.getState().remoteError, "");
  assert.equal(store.getState().remoteReady, true);
  assert.equal(caches.length, 1);
  assert.deepEqual(caches[0].leads.map((lead) => lead.id), ["MD-current"]);
});

test("an old anonymous failure cannot finish or clear a newer pending hydration", async () => {
  const requests = [];
  const { store } = storeHarness(() => new Promise((resolve, reject) => { requests.push({ resolve, reject }); }));
  store.getState().hydrate();
  store.getState().hydrate();
  requests[0].reject(new Error("Old request failed"));
  await new Promise(setImmediate);
  assert.equal(store.getState().remoteReady, false);
  assert.equal(store.getState().remoteError, "");
  requests[1].resolve(Response.json({ full: true, workspace: { leads: [{ id: "MD-owner" }], partners: [] } }));
  await new Promise(setImmediate);
  assert.equal(store.getState().serverOwner, true);
  assert.equal(store.getState().remoteReady, true);
  assert.equal(store.getState().remoteError, "");
});

test("late owner JSON parsing cannot restore private data after logout hydration", async () => {
  let finishOldBody;
  let calls = 0;
  const { store, caches } = storeHarness(async () => {
    calls++;
    if (calls === 1) return { ok: true, json: () => new Promise((resolve) => { finishOldBody = resolve; }) };
    return Response.json({ full: false, ownPartner: null, workspace: { leads: [], partners: [] } });
  });
  store.getState().hydrate();
  await new Promise(setImmediate);
  store.getState().hydrate();
  await new Promise(setImmediate);
  finishOldBody({ full: true, workspace: { leads: [{ id: "MD-private" }], partners: [], notes: [{ text: "private" }] } });
  await new Promise(setImmediate);
  assert.equal(store.getState().serverOwner, false);
  assert.equal(store.getState().ownPartner, null);
  assert.deepEqual(store.getState().leads, []);
  assert.deepEqual(store.getState().notes, []);
  assert.equal(store.getState().remoteReady, true);
  assert.equal(caches.length, 1);
  assert.deepEqual(caches[0].leads, []);
});

const CUSTOMER = { email: "customer@example.nl", emailVerified: true };
const CUSTOMER_LEAD = {
  id: "MD-own", product: "Zonnepanelen", postcode: "4811 AB", city: "Breda", address: "Straat 1", term: "Binnen 3 maanden",
  name: "Klant", email: CUSTOMER.email, phone: "0612345678", consent: true, status: "Nieuw", createdAt: STAMP,
};

test("customer GET returns only verified own records without internal finance", async () => {
  const own = { ...CUSTOMER_LEAD, deal: { invoice: { totalCents: 40000 }, receipts: [{ amountCents: 40000 }] } };
  const route = workspaceRoute({ user: CUSTOMER, workspace: { leads: [own, { ...own, id: "MD-other", email: "other@example.nl" }, { ...own, id: "MD-deleted", deletedAt: STAMP }] } });
  const body = await (await route.get()).json();
  assert.equal(body.full, false);
  assert.deepEqual(body.workspace.leads.map((lead) => lead.id), [CUSTOMER_LEAD.id]);
  assert.equal(body.workspace.leads[0].deal, undefined);
});

test("server matching authenticates ownership and rejects unverified or unconsented requests", async () => {
  const company = partner({ status: "Actief", activatedAt: STAMP });
  for (const [user, lead, expected] of [
    [null, CUSTOMER_LEAD, 401],
    [{ ...CUSTOMER, emailVerified: false }, CUSTOMER_LEAD, 403],
    [{ email: "other@example.nl", emailVerified: true }, CUSTOMER_LEAD, 403],
    [CUSTOMER, { ...CUSTOMER_LEAD, consent: false }, 422],
  ]) {
    const route = workspaceRoute({ user, workspace: { leads: [lead], partners: [company] } });
    assert.equal((await route.post({ matchRequest: { id: lead.id } })).status, expected);
    assert.equal(route.state().writes, 0);
    assert.equal(route.state().notifications, 0);
  }
});

test("matching observes pause, region, product and valid available capacity", async () => {
  const company = partner({ status: "Actief", activatedAt: STAMP });
  for (const [matchingPaused, available] of [
    [true, company],
    [false, { ...company, prefixes: ["10"] }],
    [false, { ...company, products: ["Thuisbatterij"] }],
    [false, { ...company, capacity: 0 }],
    [false, { ...company, capacity: 1.5 }],
    [false, { ...company, status: "Gepauzeerd" }],
  ]) {
    const route = workspaceRoute({ user: CUSTOMER, workspace: { matchingPaused, leads: [CUSTOMER_LEAD], partners: [available] } });
    const response = await route.post({ matchRequest: { id: CUSTOMER_LEAD.id } });
    assert.equal(response.status, 409);
    assert.equal(route.state().writes, 0);
    assert.equal(route.state().workspace.leads[0].partnerId, undefined);
    assert.equal(route.state().notifications, 0);
  }
});

test("new matching reserves one capacity slot and retry neither rematches nor reserves twice", async () => {
  const company = partner({ status: "Actief", activatedAt: STAMP, capacity: 1 });
  const route = workspaceRoute({ user: CUSTOMER, workspace: { leads: [CUSTOMER_LEAD], partners: [company] } });
  const response = await route.post({ matchRequest: { id: CUSTOMER_LEAD.id } });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.lead.partnerId, company.id);
  assert.equal(body.remainingCapacity, 0);
  assert.equal(route.state().workspace.partners[0].capacity, 0);
  assert.equal(route.state().writes, 1);
  assert.equal(route.state().notifications, 1);
  assert.equal((await route.post({ matchRequest: { id: CUSTOMER_LEAD.id } })).status, 200);
  assert.equal(route.state().writes, 1);
  assert.equal(route.state().notifications, 1);
  const previouslyAssigned = workspaceRoute({ user: CUSTOMER, workspace: { leads: [{ ...CUSTOMER_LEAD, status: "Gematcht", partnerId: "P-old" }], partners: [company] } });
  const existing = await (await previouslyAssigned.post({ matchRequest: { id: CUSTOMER_LEAD.id } })).json();
  assert.equal(existing.lead.partnerId, "P-old");
  assert.equal(previouslyAssigned.state().writes, 0);
});

test("failed matching storage sends no notification and changes no capacity", async () => {
  const company = partner({ status: "Actief", activatedAt: STAMP, capacity: 1 });
  const route = workspaceRoute({ user: CUSTOMER, workspace: { leads: [CUSTOMER_LEAD], partners: [company] }, failWrite: true });
  const response = await route.post({ matchRequest: { id: CUSTOMER_LEAD.id } });
  assert.equal(response.status, 500);
  assert.equal((await response.json()).ok, false);
  assert.equal(route.state().workspace.partners[0].capacity, 1);
  assert.equal(route.state().workspace.leads[0].partnerId, undefined);
  assert.equal(route.state().notifications, 0);
});

test("a handled or malformed unassigned dossier cannot become a new match", async () => {
  const company = partner({ status: "Actief", activatedAt: STAMP });
  for (const [lead, status] of [
    [{ ...CUSTOMER_LEAD, status: "Afgerond" }, 409],
    [{ ...CUSTOMER_LEAD, postcode: "invalid" }, 422],
    [{ ...CUSTOMER_LEAD, product: "Unsupported" }, 422],
  ]) {
    const route = workspaceRoute({ user: CUSTOMER, workspace: { leads: [lead], partners: [company] } });
    assert.equal((await route.post({ matchRequest: { id: lead.id } })).status, status);
    assert.equal(route.state().writes, 0);
  }
});

test("client matching waits for a stored own lead and does not forge an assignment on rejection", async () => {
  const company = partner({ status: "Actief", capacity: 1 });
  const { store } = storeHarness(async () => Response.json({ ok: true, lead: { ...CUSTOMER_LEAD, status: "Gematcht", partnerId: company.id }, remainingCapacity: 0 }));
  store.setState({ leads: [CUSTOMER_LEAD], partners: [company] });
  assert.equal((await store.getState().requestMatch(CUSTOMER_LEAD.id)).ok, true);
  assert.equal(store.getState().leads[0].partnerId, company.id);
  assert.equal(store.getState().partners[0].capacity, 0);
  const failed = storeHarness(async () => Response.json({ ok: false, message: "Geen capaciteit" }, { status: 409 }));
  failed.store.setState({ leads: [CUSTOMER_LEAD], partners: [company] });
  assert.equal((await failed.store.getState().requestMatch(CUSTOMER_LEAD.id)).ok, false);
  assert.equal(failed.store.getState().leads[0].partnerId, undefined);
  assert.equal(failed.store.getState().partners[0].capacity, 1);
});
