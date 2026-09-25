import assert from "node:assert/strict";
import test from "node:test";
import { findPartnerFor } from "./matchdesk.ts";

const lead = { product: "Zonnepanelen", postcode: "4811 AB" };

function partner(patch = {}) {
  return {
    id: "P-1",
    name: "RD Solar Group",
    email: "info@rdsolargroup.nl",
    kvk: "12345678",
    products: ["Zonnepanelen"],
    prefixes: ["48"],
    capacity: 3,
    status: "Actief",
    quality: 0,
    ...patch,
  };
}

test("findPartnerFor skips capacity 0 even when Actief", () => {
  const full = partner({ id: "P-ZERO", capacity: 0 });
  assert.equal(findPartnerFor(lead, [full]), undefined);

  const other = partner({
    id: "P-LIVE",
    capacity: 2,
    email: "live@rdsolargroup.nl",
    prefixes: ["48"],
  });
  assert.equal(findPartnerFor(lead, [full, other])?.id, "P-LIVE");
});

test("findPartnerFor skips paused, archived, review, and examples", () => {
  const paused = partner({ id: "P-PAUSE", status: "Gepauzeerd" });
  const archived = partner({ id: "P-ARCH", status: "Gearchiveerd" });
  const review = partner({ id: "P-REV", status: "Te beoordelen" });
  const example = partner({ id: "P-EX", example: true, capacity: 9 });
  const live = partner({ id: "P-OK", prefixes: ["10"], products: ["Thuisbatterij"] });
  assert.equal(findPartnerFor(lead, [paused, archived, review, example]), undefined);
  assert.equal(findPartnerFor({ product: "Thuisbatterij", postcode: "1011 AB" }, [live])?.id, "P-OK");
});
