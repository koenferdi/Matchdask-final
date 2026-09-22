import assert from "node:assert/strict";
import test from "node:test";
import {
  FINANCIAL_DELETE_BLOCKED,
  hasFinancialRegistration,
  mergeProtectedLeads,
  visibleLeads,
} from "./finance.ts";

test("hasFinancialRegistration herkent deal-uitkomst en offerte", () => {
  assert.equal(hasFinancialRegistration({}), false);
  assert.equal(hasFinancialRegistration({ deal: {} }), false);
  assert.equal(hasFinancialRegistration({ deal: { contactedAt: "2026-01-01" } }), false);
  assert.equal(hasFinancialRegistration({ deal: { outcome: "Gewonnen" } }), true);
  assert.equal(
    hasFinancialRegistration({
      deal: { quote: { reference: "OFF-1", amountCents: 10000, basis: "test" } },
    }),
    true,
  );
});

test("visibleLeads verbergt soft-deleted dossiers", () => {
  const rows = visibleLeads([{ id: "a" }, { id: "b", deletedAt: "2026-09-22T10:00:00.000Z" }]);
  assert.deepEqual(
    rows.map((r) => r.id),
    ["a"],
  );
});

test("mergeProtectedLeads herstelt hard-verwijderde financiële dossiers", () => {
  const current = [
    { id: "MD-1", name: "Test", deal: { outcome: "Gewonnen" } },
    { id: "MD-2", name: "Gewoon" },
  ];
  const incoming = [{ id: "MD-2", name: "Gewoon" }];
  const merged = mergeProtectedLeads(current, incoming);
  assert.equal(merged.length, 2);
  assert.ok(merged.some((l) => l.id === "MD-1" && l.deal?.outcome === "Gewonnen"));
});

test("mergeProtectedLeads staat soft-delete toe", () => {
  const current = [{ id: "MD-1", name: "Test", deal: { outcome: "Gewonnen" } }];
  const incoming = [
    {
      id: "MD-1",
      name: "Test",
      deal: { outcome: "Gewonnen" },
      deletedAt: "2026-09-22T12:00:00.000Z",
    },
  ];
  const merged = mergeProtectedLeads(current, incoming);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].deletedAt, "2026-09-22T12:00:00.000Z");
  assert.equal(FINANCIAL_DELETE_BLOCKED.includes("financiële registratie"), true);
});
