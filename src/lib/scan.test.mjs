import assert from "node:assert/strict";
import test from "node:test";
import { runScan, findPartnerFor, netbeheerder, kwh, SAMPLE_LEAD } from "./matchdesk.ts";

test("postcode and annual usage never invent an engineered panel or battery size", () => {
  for (const postcode of ["1011 AB", "4811 AB", "9999 ZZ"]) {
    for (const product of ["Zonnepanelen", "Thuisbatterij", "Zonnepanelen + thuisbatterij"]) {
      for (const usageKwh of [undefined, 4200]) {
        const scan = runScan({ ...SAMPLE_LEAD, postcode, product, usageKwh });
        assert.equal(scan.panels, null);
        assert.equal(scan.yieldKwh, null);
        assert.equal(scan.batteryKwh, null);
        assert.equal(scan.suitability, "nader te bekijken");
      }
    }
  }
  assert.equal(kwh(null), "Nog te bepalen");
  assert.equal(kwh(0), "0 kWh");
  assert.equal(netbeheerder("4811 AB"), "Te controleren op het exacte adres");
});

test("no match is returned outside the partner area or product expertise", () => {
  const partner = { id: "P-1", name: "Installateur", email: "test@example.nl", kvk: "12345678", products: ["Zonnepanelen"], prefixes: ["48"], capacity: 1, status: "Actief", activatedAt: "2026-10-08T09:00:00Z", quality: 0 };
  assert.equal(findPartnerFor({ product: "Zonnepanelen", postcode: "1011 AB" }, [partner]), undefined);
  assert.equal(findPartnerFor({ product: "Thuisbatterij", postcode: "4811 AB" }, [partner]), undefined);
  assert.equal(findPartnerFor({ product: "Zonnepanelen", postcode: "4811 AB" }, [partner])?.id, "P-1");
});
