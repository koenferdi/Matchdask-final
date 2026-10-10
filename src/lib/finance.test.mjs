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

test("agreement-only and completion/payment evidence dossiers cannot disappear", () => {
  for (const deal of [
    { commercial: { version: "fixed-fees-v1", agreementId: "A-1" } },
    { completedAt: "2026-10-08T10:00:00Z" },
    { customerPaidAt: "2026-10-08T10:00:00Z" },
    { cancelled: true },
  ]) {
    assert.equal(hasFinancialRegistration({ deal }), true);
    assert.deepEqual(mergeProtectedLeads([{ id: "MD-1", deal }], []), [{ id: "MD-1", deal }]);
  }
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

test("an empty or partial deal cannot erase invoice, agreement or receipts", () => {
  const deal = {
    outcome: "Gewonnen",
    invoice: { reference: "INV-1", totalCents: 17500, dueOn: "2026-10-15" },
    commercial: { version: "legacy", agreementId: "A-1" },
    receipts: [{ reference: "BANK-1", receivedOn: "2026-10-08", amountCents: 17500 }],
  };
  for (const incoming of [{}, { invoice: { reference: "INV-1" }, receipts: [] }, { invoice: null, commercial: {} }]) {
    const [merged] = mergeProtectedLeads([{ id: "MD-1", deal }], [{ id: "MD-1", deal: incoming }]);
    assert.deepEqual(merged.deal, deal);
  }
});

test("receipts append once and existing receipt references keep their recorded amount", () => {
  const [merged] = mergeProtectedLeads(
    [{ id: "MD-1", deal: { receipts: [{ reference: "BANK-1", amountCents: 10000 }] } }],
    [{ id: "MD-1", deal: { receipts: [{ reference: "BANK-1", amountCents: 20000 }, { reference: "BANK-2", amountCents: 7500 }, { reference: "BANK-2", amountCents: 7500 }] } }],
  );
  assert.equal(merged.deal.receipts.length, 2);
  assert.equal(merged.deal.receipts.reduce((sum, row) => sum + row.amountCents, 0), 17500);
});
