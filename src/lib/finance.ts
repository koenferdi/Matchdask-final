/** @typedef {{ deal?: any, deletedAt?: string, id?: string }} LeadLike */

export const FINANCIAL_DELETE_BLOCKED =
  "Een dossier met een financiële registratie kan niet via deze knop worden verwijderd.";

/** Commercial agreements and evidence belong to the protected financial dossier. */
export function hasFinancialRegistration(lead) {
  const deal = lead?.deal;
  if (!deal || typeof deal !== "object") return false;
  if (deal.outcome) return true;
  if (deal.quote) return true;
  if (deal.commission) return true;
  if (deal.invoice) return true;
  if (deal.commercial) return true;
  if (deal.completedAt || deal.customerPaidAt || deal.cancelled === true) return true;
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
    if (prev.deal) {
      const idx = out.findIndex((lead) => lead.id === prev.id);
      if (idx >= 0) out[idx] = { ...out[idx], deal: mergeFinancialDeal(prev.deal, next.deal) };
    }
  }
  return out;
}

/** A partial workspace snapshot cannot erase an existing financial record. */
function mergeFinancialDeal(previous, incoming) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return { ...previous };
  const result = { ...previous };
  for (const [key, value] of Object.entries(incoming)) {
    if (value == null) continue;
    if (["quote", "commission", "invoice", "commercial"].includes(key)) {
      if (typeof value !== "object" || Array.isArray(value)) continue;
      result[key] = { ...(previous[key] || {}), ...Object.fromEntries(Object.entries(value).filter(([, entry]) => entry != null)) };
    } else if (key === "receipts") {
      if (!Array.isArray(value)) continue;
      // Receipts already recorded survive an empty/partial snapshot. A reference
      // is the identity of a receipt, so a repeated row cannot double-count it.
      const rows = [...(Array.isArray(previous.receipts) ? previous.receipts : [])];
      const seen = new Set(rows.map((row) => row.reference));
      for (const row of value) {
        if (!row || typeof row.reference !== "string" || !row.reference.trim() || seen.has(row.reference)) continue;
        seen.add(row.reference);
        rows.push({ ...row });
      }
      result.receipts = rows;
    } else {
      result[key] = value;
    }
  }
  return result;
}
