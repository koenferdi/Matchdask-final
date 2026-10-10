import assert from "node:assert/strict";
import test from "node:test";
import { isOwner, isOwnerEmail } from "./owner.ts";

test("only explicit owner addresses grant admin identity", () => {
  assert.equal(isOwnerEmail(" KOENFERDI@GMAIL.COM "), true);
  assert.equal(isOwnerEmail("support@getmatchdesk.nl"), false);
  assert.equal(isOwnerEmail("koen@getmatchdesk.nl.attacker.example"), false);
  assert.equal(isOwnerEmail(""), false);
});

test("a display name cannot promote a customer to owner", () => {
  assert.equal(isOwner({ primaryEmail: "customer@example.test", displayName: "Koen Weijand" }), false);
  assert.equal(isOwner({ primaryEmail: "info@getmatchdesk.nl", displayName: "Matchdesk" }), true);
  assert.equal(isOwner(null), false);
});
