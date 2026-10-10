import assert from "node:assert/strict";
import test from "node:test";
import { clearWorkspaceCache } from "./session-cache.mjs";

test("changing identity removes only the Matchdesk workspace cache", () => {
  const removed = [];
  clearWorkspaceCache({ removeItem: (key) => removed.push(key) });
  assert.deepEqual(removed, ["matchdesk-workspace-v1", "matchdesk-workspace-v2"]);
});

test("storage denial does not prevent confirmed sign-out", () => {
  assert.doesNotThrow(() => clearWorkspaceCache({ removeItem() { throw new Error("denied"); } }));
});
