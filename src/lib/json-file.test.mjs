import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readJsonFile, writeJsonAtomic } from "./json-file.mjs";

test("missing store is empty, corrupt or invalid existing data is never silently empty", () => {
  const folder = mkdtempSync(join(tmpdir(), "matchdesk-json-test-"));
  const file = join(folder, "workspace.json");
  try {
    assert.deepEqual(readJsonFile(file, { leads: [] }), { leads: [] });
    for (const bad of ["{broken", "null", "[]"]) {
      writeFileSync(file, bad);
      assert.throws(() => readJsonFile(file, { leads: [] }));
      assert.equal(readFileSync(file, "utf8"), bad);
    }
  } finally { rmSync(folder, { recursive: true, force: true }); }
});

test("atomic writes round-trip privately and failed serialization leaves prior data intact", () => {
  const folder = mkdtempSync(join(tmpdir(), "matchdesk-json-test-"));
  const file = join(folder, "private", "workspace.json");
  try {
    writeJsonAtomic(file, { leads: [{ id: "MD-1" }] });
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.deepEqual(readJsonFile(file, {}), { leads: [{ id: "MD-1" }] });
    const circular = {}; circular.self = circular;
    assert.throws(() => writeJsonAtomic(file, circular));
    assert.deepEqual(readJsonFile(file, {}), { leads: [{ id: "MD-1" }] });
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
