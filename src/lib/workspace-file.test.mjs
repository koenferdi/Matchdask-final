import assert from "node:assert/strict";
import test from "node:test";
import { publicPartners } from "./workspace-file.ts";

test("public partner projection excludes contract and future private fields", () => {
  const partner = {
    id: "P-1", name: "Installateur", email: "private@example.nl",
    contactName: "Privé", kvk: "12345678", products: ["Zonnepanelen"],
    prefixes: ["35"], capacity: 2, status: "Actief", quality: 0,
    activatedAt: "2026-10-08", commercialAgreement: { agreementId: "PRIVATE-A-1" },
    internalNote: "must never be public",
  };
  const [publicPartner] = publicPartners([partner]);
  assert.equal(publicPartner.email, "");
  assert.equal(publicPartner.kvk, "1234****");
  for (const key of ["contactName", "activatedAt", "commercialAgreement", "internalNote"]) {
    assert.equal(Object.hasOwn(publicPartner, key), false);
  }
  assert.deepEqual(publicPartners([{ ...partner, status: "Te beoordelen" }]), []);
});
