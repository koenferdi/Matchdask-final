/** Contract facts for new written agreements. Historical agreements are never migrated. */
export const COMMERCIAL_VERSION = "fixed-fee-2026-10-08";
export const COMMERCIAL = Object.freeze({
  version: COMMERCIAL_VERSION,
  vatRate: 0.21,
  successFeeCents: Object.freeze({
    Zonnepanelen: 17500,
    Thuisbatterij: 22500,
    "Zonnepanelen + thuisbatterij": 22500,
  }),
  invoiceDays: 7,
  acceptanceWorkingDays: 1,
  firstContactWorkingDays: 2,
  opvolgdesk: Object.freeze({ priceCents: 14900, depositCents: 7450, balanceCents: 7450, introductoryPilots: 3, standardPriceCents: 34900, days: 14, maxCases: 10, maxAttemptsPerCase: 2, maxDeliveryHours: 4 }),
});

export const COMMISSION_TEXT = "Voor nieuwe schriftelijke afspraken: vaste succesfee €175 voor zonnepanelen of €225 voor een thuisbatterij of de oorspronkelijke combinatie, exclusief btw. Pas verschuldigd na oplevering én ontvangen klantbetaling; factuurtermijn 7 dagen. Eén oorspronkelijke opdracht, één fee; later meerwerk telt niet mee. Bestaande afspraken en eerder toegezegde gratis opdrachten blijven gelden. Geen automatische gratis eerste opdracht voor nieuwe partners.";
export const COMMISSION_HTML = "Voor nieuwe schriftelijke afspraken: vaste succesfee <strong>€175</strong> voor zonnepanelen of <strong>€225</strong> voor een thuisbatterij of de oorspronkelijke combinatie, <strong>exclusief btw</strong>. Pas verschuldigd na <strong>oplevering én ontvangen klantbetaling</strong>; factuurtermijn 7 dagen. Eén oorspronkelijke opdracht, één fee; later meerwerk telt niet mee. Bestaande afspraken en eerder toegezegde gratis opdrachten blijven gelden. Geen automatische gratis eerste opdracht voor nieuwe partners.";
export const MATCH_SLA_TEXT = "Voor nieuwe schriftelijke afspraken: accepteer of weiger binnen één werkdag na de matchmelding. Doe na acceptatie binnen twee werkdagen een eerste contactpoging. De aanvraag wordt aan één partner tegelijk aangeboden; opnieuw matchen kan pas na vrijgave en met toestemming van de klant. Geen territoriaal alleenrecht of garantie op aanvragen.";
export const PAUSED_OFFERS_TEXT = "Nieuwe verkoop van het betaalde woningrapport en de badgekeuring is gepauzeerd. Bestaande aankopen en schriftelijke afspraken blijven gelden; Matchdesk helpt bestaande klanten met toegang en levering.";

export function euroExVat(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new TypeError("Bedrag moet een niet-negatief geheel aantal centen zijn.");
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

/** One invoice, two instalments; the final instalment carries the VAT rounding remainder. No pilot availability check. */
export function opvolgdeskPaymentSchedule(tier = "pilot") {
  if (tier !== "pilot" && tier !== "standard") throw new TypeError("Onbekend Opvolgdesk-tarief: kies pilot of standard.");
  const priceCents = tier === "pilot" ? COMMERCIAL.opvolgdesk.priceCents : COMMERCIAL.opvolgdesk.standardPriceCents;
  const depositExVatCents = priceCents / 2;
  const totalGrossCents = Math.round(priceCents * (1 + COMMERCIAL.vatRate));
  const depositGrossCents = Math.round(totalGrossCents / 2);
  return Object.freeze({
    totalExVatCents: priceCents,
    totalVatCents: totalGrossCents - priceCents,
    totalGrossCents,
    depositExVatCents,
    depositGrossCents,
    balanceExVatCents: priceCents - depositExVatCents,
    balanceGrossCents: totalGrossCents - depositGrossCents,
  });
}

export function successFeeForProduct(product) {
  if (typeof product !== "string" || !Object.hasOwn(COMMERCIAL.successFeeCents, product)) throw new TypeError("Onbekend product: geen fee vastleggen.");
  const cents = COMMERCIAL.successFeeCents[product];
  if (!Number.isSafeInteger(cents)) throw new TypeError("Onbekend product: geen fee vastleggen.");
  return cents;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const datePart = value.slice(0, 10);
  return new Date(`${datePart}T00:00:00Z`).toISOString().slice(0, 10) === datePart;
}

/** Save this alongside the new deal only AFTER written acceptance; never infer acceptance from signup. */
export function createCommercialSnapshot({ product, acceptedAt, agreementId }) {
  if (!validDate(acceptedAt) || typeof agreementId !== "string" || !agreementId.trim()) {
    throw new TypeError("Een geaccepteerde schriftelijke overeenkomst met datum en referentie is vereist.");
  }
  return Object.freeze({
    version: COMMERCIAL_VERSION,
    agreementId: agreementId.trim(),
    acceptedAt: new Date(acceptedAt).toISOString(),
    product,
    amountCents: successFeeForProduct(product),
    vatRate: COMMERCIAL.vatRate,
    invoiceDays: COMMERCIAL.invoiceDays,
    basis: "original-job-only",
    payableAfter: "completed-and-customer-paid",
  });
}

/** Server callers must authenticate the writer and verify evidence; this pure function does not do that. */
export function commissionEligibility({ snapshot, completedAt, customerPaidAt, cancelled = false, legacyFreePromise = false, legacyCommission, asOf = new Date().toISOString() } = {}) {
  const blocked = (reason) => ({ eligible: false, amountCents: 0, reason });
  if (!validDate(asOf)) return blocked("invalid-as-of");
  if (cancelled) return blocked("cancelled");
  if (legacyFreePromise) return blocked("legacy-free-promise");
  if (!snapshot) {
    // Existing contracts keep their recorded terms. Only an explicit, checked manual determination can invoice them.
    if (legacyCommission?.approved === true && legacyCommission?.dueConfirmed === true && typeof legacyCommission?.agreementId === "string" && legacyCommission.agreementId.trim() && Number.isSafeInteger(legacyCommission.amountCents) && legacyCommission.amountCents > 0) {
      return { eligible: true, amountCents: legacyCommission.amountCents, reason: "confirmed-legacy-agreement" };
    }
    return blocked("legacy-review-required");
  }
  if (snapshot.version !== COMMERCIAL_VERSION || !validDate(snapshot.acceptedAt) || typeof snapshot.agreementId !== "string" || !snapshot.agreementId.trim() || typeof snapshot.product !== "string" || !Object.hasOwn(COMMERCIAL.successFeeCents, snapshot.product) || !Number.isSafeInteger(snapshot.amountCents) || snapshot.amountCents <= 0 || snapshot.amountCents !== COMMERCIAL.successFeeCents[snapshot.product] || snapshot.basis !== "original-job-only" || snapshot.payableAfter !== "completed-and-customer-paid" || snapshot.invoiceDays !== 7 || snapshot.vatRate !== 0.21) {
    return blocked("invalid-snapshot");
  }
  if (Date.parse(snapshot.acceptedAt) > Date.parse(asOf)) return blocked("future-agreement");
  if (!validDate(completedAt)) return blocked("not-completed");
  if (!validDate(customerPaidAt)) return blocked("customer-not-paid");
  if (Date.parse(completedAt) > Date.parse(asOf) || Date.parse(customerPaidAt) > Date.parse(asOf)) return blocked("future-evidence");
  if (Date.parse(completedAt) < Date.parse(snapshot.acceptedAt) || Date.parse(customerPaidAt) < Date.parse(snapshot.acceptedAt)) return blocked("evidence-before-agreement");
  return { eligible: true, amountCents: snapshot.amountCents, reason: "completed-and-customer-paid" };
}
