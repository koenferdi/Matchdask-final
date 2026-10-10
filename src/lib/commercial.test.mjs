import assert from "node:assert/strict";
import test from "node:test";
import { COMMERCIAL, COMMERCIAL_VERSION, createCommercialSnapshot, commissionEligibility, successFeeForProduct, opvolgdeskPaymentSchedule } from "./commercial.mjs";

const acceptedAt = "2026-10-08T09:00:00.000Z";
const completedAt = "2026-10-20T09:00:00.000Z";
const customerPaidAt = "2026-10-22T09:00:00.000Z";
const asOf = "2026-11-01T09:00:00.000Z";
const snapshot = createCommercialSnapshot({ product: "Zonnepanelen", acceptedAt, agreementId: "SIGNED-P-1" });

test("new tariffs are fixed per original job, combination charged once", () => {
  assert.equal(successFeeForProduct("Zonnepanelen"), 17500);
  assert.equal(successFeeForProduct("Thuisbatterij"), 22500);
  assert.equal(successFeeForProduct("Zonnepanelen + thuisbatterij"), 22500);
  assert.throws(() => successFeeForProduct("Warmtepomp"));
  assert.throws(() => successFeeForProduct(["Zonnepanelen"]));
});
test("a won quote or deposit alone is insufficient for new successfee", () => {
  assert.equal(commissionEligibility({ asOf, snapshot }).reason, "not-completed");
  assert.equal(commissionEligibility({ asOf, snapshot, completedAt }).reason, "customer-not-paid");
  assert.equal(commissionEligibility({ asOf, snapshot, customerPaidAt }).eligible, false);
  assert.deepEqual(commissionEligibility({ asOf, snapshot, completedAt, customerPaidAt }), { eligible: true, amountCents: 17500, reason: "completed-and-customer-paid" });
});
test("cancellation and documented free promises never invoice automatically", () => {
  assert.equal(commissionEligibility({ asOf, snapshot, completedAt, customerPaidAt, cancelled: true }).reason, "cancelled");
  assert.equal(commissionEligibility({ asOf, snapshot, completedAt, customerPaidAt, legacyFreePromise: true }).amountCents, 0);
});
test("historical agreements need explicit review, not automatic fee migration", () => {
  assert.equal(commissionEligibility({ asOf, completedAt, customerPaidAt }).reason, "legacy-review-required");
  assert.equal(commissionEligibility({ asOf, legacyCommission: { amountCents: 40000 } }).eligible, false);
  assert.deepEqual(commissionEligibility({ asOf, legacyCommission: { approved: true, dueConfirmed: true, agreementId: "OLD-AGREEMENT", amountCents: 40000 } }), { eligible: true, amountCents: 40000, reason: "confirmed-legacy-agreement" });
});
test("snapshot requires written acceptance and fixes amount and version", () => {
  assert.throws(() => createCommercialSnapshot({ product: "Zonnepanelen", acceptedAt }));
  assert.throws(() => createCommercialSnapshot({ product: "Zonnepanelen", acceptedAt: "bad", agreementId: "X" }));
  assert.throws(() => createCommercialSnapshot({ product: "Zonnepanelen", acceptedAt: "2026-02-31", agreementId: "X" }));
  assert.equal(snapshot.version, COMMERCIAL_VERSION);
  assert.equal(Object.isFrozen(snapshot), true);
  for (const change of [{ amountCents: 22500 }, { version: "unknown" }, { invoiceDays: 30 }, { vatRate: 0 }, { product: "unknown" }, { product: "unknown", amountCents: undefined }, { product: "toString", amountCents: undefined }]) {
    assert.equal(commissionEligibility({ asOf, snapshot: { ...snapshot, ...change }, completedAt, customerPaidAt }).reason, "invalid-snapshot");
  }
});
test("evidence before contract cannot create a retroactive new fee", () => {
  assert.equal(commissionEligibility({ asOf, snapshot, completedAt: "2026-10-01T09:00:00Z", customerPaidAt }).reason, "evidence-before-agreement");
});
test("pilot advances and balances add up without an extra matchingfee", () => {
  assert.equal(COMMERCIAL.opvolgdesk.depositCents + COMMERCIAL.opvolgdesk.balanceCents, COMMERCIAL.opvolgdesk.priceCents);
  assert.equal(COMMERCIAL.opvolgdesk.priceCents, 14900);
  assert.equal(COMMERCIAL.opvolgdesk.maxDeliveryHours, 4);
  const schedule = opvolgdeskPaymentSchedule();
  assert.equal(schedule.totalGrossCents, 18029);
  assert.equal(schedule.depositGrossCents, 9015);
  assert.equal(schedule.balanceGrossCents, 9014);
  assert.equal(schedule.depositGrossCents + schedule.balanceGrossCents, schedule.totalGrossCents);
});

test("both Opvolgdesk tariffs reconcile to one invoice with exact VAT and instalments", () => {
  assert.equal(COMMERCIAL.opvolgdesk.introductoryPilots, 3);
  assert.deepEqual(opvolgdeskPaymentSchedule(), opvolgdeskPaymentSchedule("pilot"));
  for (const [tier, expected] of [
    ["pilot", { totalExVatCents: 14900, totalVatCents: 3129, totalGrossCents: 18029, depositExVatCents: 7450, depositGrossCents: 9015, balanceExVatCents: 7450, balanceGrossCents: 9014 }],
    ["standard", { totalExVatCents: 34900, totalVatCents: 7329, totalGrossCents: 42229, depositExVatCents: 17450, depositGrossCents: 21115, balanceExVatCents: 17450, balanceGrossCents: 21114 }],
  ]) {
    const actual = opvolgdeskPaymentSchedule(tier);
    assert.deepEqual(actual, expected);
    assert.equal(actual.depositExVatCents + actual.balanceExVatCents, actual.totalExVatCents);
    assert.equal(actual.depositGrossCents + actual.balanceGrossCents, actual.totalGrossCents);
    assert.equal(Object.isFrozen(actual), true);
  }
});

test("unsupported Opvolgdesk tariffs cannot silently use the pilot price", () => {
  for (const tier of ["", "Standard", "toString", "unknown", null, false, 34900, ["standard"], { tier: "standard" }]) {
    assert.throws(() => opvolgdeskPaymentSchedule(tier), TypeError);
  }
});


test("future acceptance, completion and customer payment do not become due early", () => {
  assert.equal(commissionEligibility({ snapshot, completedAt, customerPaidAt, asOf: "2026-10-07T09:00:00Z" }).reason, "future-agreement");
  assert.equal(commissionEligibility({ snapshot, completedAt, customerPaidAt, asOf: "2026-10-19T09:00:00Z" }).reason, "future-evidence");
  assert.equal(commissionEligibility({ snapshot, completedAt, customerPaidAt, asOf: "2026-10-21T09:00:00Z" }).reason, "future-evidence");
  assert.equal(commissionEligibility({ snapshot, completedAt, customerPaidAt, asOf: "bad" }).reason, "invalid-as-of");
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const future = createCommercialSnapshot({ product: "Zonnepanelen", acceptedAt: tomorrow, agreementId: "FUTURE" });
  assert.equal(commissionEligibility({ snapshot: future, completedAt: tomorrow, customerPaidAt: tomorrow }).reason, "future-agreement");
});
