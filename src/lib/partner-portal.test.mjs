import assert from "node:assert/strict";
import test from "node:test";
import {
  applyPartnerSelfServe,
  findOwnPartner,
  GATE_MESSAGE,
  isMatchablePartner,
  resolveSelfServeTarget,
  selfServeView,
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

test("own partner is the login e-mail, preferring Actief", () => {
  const review = partner({ id: "P-1", status: "Te beoordelen" });
  const live = partner({ id: "P-2", status: "Actief", activatedAt: STAMP });
  const other = partner({ id: "P-3", email: "ander@bedrijf.nl", status: "Actief" });
  assert.equal(findOwnPartner([review, other, live], "INFO@rdsolargroup.nl").id, "P-2");
  assert.equal(resolveSelfServeTarget([live], "info@rdsolargroup.nl", "P-9").ok, false);
  assert.equal(resolveSelfServeTarget([live], "info@rdsolargroup.nl", "P-2").partner.id, "P-2");
  assert.equal(resolveSelfServeTarget([other], "info@rdsolargroup.nl").ok, false);
});
