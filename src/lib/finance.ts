/** @typedef {{ deal?: any, deletedAt?: string, id?: string }} LeadLike */

export const FINANCIAL_DELETE_BLOCKED =
  "Een dossier met een financiële registratie kan niet via deze knop worden verwijderd.";

/** True when the lead has quote/outcome/commission/invoice/receipts. */
export function hasFinancialRegistration(lead) {
  const deal = lead?.deal;
  if (!deal || typeof deal !== "object") return false;
  if (deal.outcome) return true;
  if (deal.quote) return true;
  if (deal.commission) return true;
  if (deal.invoice) return true;
  if (Array.isArray(deal.receipts) && deal.receipts.length > 0) return true;
  return false;
}

/** Visible cockpit rows: hide soft-deleted dossiers. */
export function visibleLeads(leads) {
  return (leads || []).filter((lead) => !lead.deletedAt);
}

/**
 * Owner workspace sync: financial dossiers may not disappear.
 * Soft-delete (deletedAt) is allowed; hard removal is restored from current.
 */
export function mergeProtectedLeads(current, incoming) {
  const nextById = new Map((incoming || []).map((lead) => [lead.id, lead]));
  const out = (incoming || []).map((lead) => ({ ...lead }));
  for (const prev of current || []) {
    if (!hasFinancialRegistration(prev)) continue;
    const next = nextById.get(prev.id);
    if (!next) {
      out.push({ ...prev });
      continue;
    }
    if (!next.deal && prev.deal) {
      const idx = out.findIndex((lead) => lead.id === prev.id);
      if (idx >= 0) out[idx] = { ...out[idx], deal: prev.deal };
    }
  }
  return out;
}
