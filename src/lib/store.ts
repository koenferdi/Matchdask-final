import { create } from "zustand";
import {
  type Lead,
  type Partner,
  type Product,
  type Term,
  loadWorkspace,
  saveWorkspace,
  newId,
  type Subscriber,
  type AdminNote,
  type RoofType,
  type RoofDir,
  type Shade,
  type Meter,
} from "./matchdesk";
import { FINANCIAL_DELETE_BLOCKED, hasFinancialRegistration } from "./finance";

export type Draft = {
  product: Product;
  postcode: string;
  city: string;
  address: string;
  term: Term | "";
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  usageKwh: string;
  roofType: RoofType | "";
  roofDir: RoofDir | "";
  shade: Shade | "";
  meter: Meter | "";
  hasSolar: boolean;
  note: string;
};

const emptyDraft = (): Draft => ({
  product: "Zonnepanelen",
  postcode: "",
  city: "",
  address: "",
  term: "",
  name: "",
  email: "",
  phone: "",
  consent: false,
  usageKwh: "",
  roofType: "",
  roofDir: "",
  shade: "",
  meter: "",
  hasSolar: false,
  note: "",
});

type Store = {
  ready: boolean;
  leads: Lead[];
  partners: Partner[];
  subscribers: Subscriber[];
  notes: AdminNote[];
  activeLeadId?: string;
  reportPaid: boolean;
  exclusivePaid: boolean;
  siteNotice: string;
  matchingPaused: boolean;
  serverOwner: boolean | null;
  remoteReady: boolean;
  ownPartner: Partner | null;
  remoteError: string;
  draft: Draft;
  hydrate: () => void;
  persist: () => void;
  setDraft: (patch: Partial<Draft>) => void;
  resetDraft: () => void;
  submitLead: () => Promise<Lead>;
  patchLead: (id: string, patch: Partial<Lead>) => void;
  requestMatch: (leadId: string) => Promise<{ ok: boolean; message: string }>;
  bookAppointment: (leadId: string, date: string, time: string) => void;
  cancelAppointment: (leadId: string) => void;
  confirmAppointment: (leadId: string) => void;
  submitPartner: (partner: Omit<Partner, "id" | "status" | "quality">) => Promise<Partner>;
  setPartnerStatus: (id: string, status: Partner["status"]) => void;
  saveOwnAvailability: (patch: {
    id?: string;
    status?: "Actief" | "Gepauzeerd";
    capacity?: number;
  }) => Promise<{ ok: boolean; message?: string; partner?: Partner }>;
  setLeadStatus: (id: string, status: Lead["status"]) => void;
  deleteLead: (id: string, opts?: { force?: boolean }) => { ok: boolean; blocked?: boolean; message?: string };
  deletePartner: (id: string) => void;
  deleteSubscriber: (email: string) => void;
  addNote: (text: string) => void;
  deleteNote: (id: string) => void;
  setSiteNotice: (notice: string) => void;
  setMatchingPaused: (paused: boolean) => void;
  markReportPaid: () => void;
  markExclusivePaid: () => void;
  setPartnerExclusive: (id: string, paid: boolean) => void;
  subscribe: (email: string, name: string) => void;
};

function workspaceSnapshot(s: Store) {
  return {
    leads: s.leads,
    partners: s.partners,
    subscribers: s.subscribers,
    notes: s.notes,
    activeLeadId: s.activeLeadId,
    reportPaid: s.reportPaid,
    exclusivePaid: s.exclusivePaid,
    siteNotice: s.siteNotice,
    matchingPaused: s.matchingPaused,
  };
}

function withOwnPartner(partners: Partner[], own?: Partner | null) {
  if (!own?.id) return partners;
  return [own, ...partners.filter((partner) => partner.id !== own.id)];
}

function persistLocal(get: () => Store) {
  try {
    const state = get();
    const snapshot = workspaceSnapshot(state);
    saveWorkspace(state.serverOwner === true ? {
      ...snapshot, leads: [], partners: [], subscribers: [], notes: [], activeLeadId: undefined,
      reportPaid: false, exclusivePaid: false,
    } : snapshot);
  } catch {
    // A browser cache failure must not prevent or contradict confirmed server storage.
  }
}

async function persistIntake(kind: "leads" | "partners", record: Lead | Partner) {
  let res: Response;
  try {
    res = await fetch("/api/workspace", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intake: true, [kind]: [record] }),
    });
  } catch {
    throw new Error("Je aanmelding is niet ontvangen door een verbindingsfout. Probeer het opnieuw.");
  }
  const data = await res.json().catch(() => ({})) as {
    ok?: boolean; message?: string; createdLeadIds?: string[]; createdPartnerIds?: string[];
  };
  const receivedIds = kind === "leads" ? data.createdLeadIds : data.createdPartnerIds;
  if (!res.ok || data.ok !== true || !Array.isArray(receivedIds) || !receivedIds.includes(record.id)) {
    throw new Error(typeof data.message === "string" ? data.message : "Je aanmelding is niet bevestigd door de server. Probeer het opnieuw.");
  }
}

function persistNow(get: () => Store, set: (patch: Partial<Store>) => void) {
  persistLocal(get);
  if (typeof window !== "undefined") {
    const s = get();
    void fetch("/api/workspace", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(workspaceSnapshot(s)),
    }).then((r) => (r.ok ? r.json() : null))
      .then((data: { full?: boolean } | null) => {
        if (data && typeof data.full === "boolean") set({ serverOwner: data.full });
      })
      .catch(() => {});
  }
}

let hydrationGeneration = 0;
let hydrationController: AbortController | null = null;

export const useMatchdesk = create<Store>((set, get) => ({
  ready: false,
  leads: [],
  partners: [],
  subscribers: [],
  notes: [],
  reportPaid: false,
  exclusivePaid: false,
  siteNotice: "",
  matchingPaused: false,
  serverOwner: null,
  remoteReady: false,
  ownPartner: null,
  remoteError: "",
  draft: emptyDraft(),
  hydrate: () => {
    const generation = ++hydrationGeneration;
    hydrationController?.abort();
    hydrationController = null;
    const local = loadWorkspace();
    set({
      ready: true,
      remoteReady: typeof window === "undefined",
      serverOwner: null,
      ownPartner: null,
      remoteError: "",
      leads: local.leads,
      partners: local.partners,
      subscribers: local.subscribers,
      notes: local.notes ?? [],
      activeLeadId: local.activeLeadId,
      reportPaid: Boolean(local.reportPaid),
      exclusivePaid: Boolean(local.exclusivePaid),
      siteNotice: local.siteNotice ?? "",
      matchingPaused: Boolean(local.matchingPaused),
    });
    if (typeof window === "undefined") return;
    const controller = new AbortController();
    hydrationController = controller;
    const isCurrent = () => generation === hydrationGeneration && !controller.signal.aborted;
    void fetch("/api/workspace", { credentials: "include", signal: controller.signal })
      .then((r) => {
        if (!isCurrent()) return null;
        if (!r.ok) throw new Error("workspace-load");
        return r.json();
      })
      .then((data: { full?: boolean; workspace?: ReturnType<typeof loadWorkspace>; ownPartner?: Partner | null; accessMessage?: string } | null) => {
        if (!isCurrent()) return;
        if (!data?.workspace || typeof data.full !== "boolean") throw new Error("workspace-load");
        const remote = data.workspace;
        if (data.full) {
          const partners = withOwnPartner(Array.isArray(remote.partners) ? remote.partners : [], data.ownPartner);
          set({
            leads: remote.leads ?? [],
            partners,
            subscribers: remote.subscribers ?? [],
            notes: remote.notes ?? [],
            activeLeadId: remote.activeLeadId,
            reportPaid: Boolean(remote.reportPaid),
            exclusivePaid: Boolean(remote.exclusivePaid),
            siteNotice: remote.siteNotice ?? "",
            matchingPaused: Boolean(remote.matchingPaused),
            serverOwner: true,
            ownPartner: data.ownPartner ?? null,
          });
          persistLocal(get);
          return;
        }
        set((s) => ({
          serverOwner: false,
          leads: remote.leads ?? [],
          activeLeadId: remote.leads?.some((lead) => lead.id === s.activeLeadId) ? s.activeLeadId : remote.leads?.[0]?.id,
          reportPaid: false,
          exclusivePaid: false,
          siteNotice: remote.siteNotice ?? s.siteNotice,
          matchingPaused: Boolean(remote.matchingPaused),
          partners: withOwnPartner(remote.partners ?? [], data.ownPartner),
          subscribers: [],
          notes: [],
          ownPartner: data.ownPartner ?? null,
          remoteError: typeof data.accessMessage === "string" ? data.accessMessage : "",
        }));
        persistLocal(get);
      })
      .catch(() => {
        if (isCurrent()) set({ ownPartner: null, remoteError: "Je bedrijfsgegevens konden niet van de server worden geladen. Probeer het opnieuw." });
      })
      .finally(() => {
        if (!isCurrent()) return;
        hydrationController = null;
        set({ remoteReady: true });
      });
  },
  persist: () => persistNow(get, set),
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: () => set({ draft: emptyDraft() }),
  submitLead: async () => {
    const d = get().draft;
    const lead: Lead = {
      id: newId("MD"),
      product: d.product,
      postcode: d.postcode,
      city: d.city,
      address: d.address,
      term: (d.term || "Ik oriënteer me nog") as Term,
      name: d.name,
      email: d.email,
      phone: d.phone,
      consent: d.consent,
      status: "Nieuw",
      createdAt: new Date().toISOString(),
      usageKwh: d.usageKwh ? Number(d.usageKwh) : undefined,
      roofType: d.roofType || undefined,
      roofDir: d.roofDir || undefined,
      shade: d.shade || undefined,
      meter: d.meter || undefined,
      hasSolar: d.hasSolar,
      note: d.note.trim() || undefined,
    };
    await persistIntake("leads", lead);
    set((s) => ({ leads: [lead, ...s.leads], activeLeadId: lead.id }));
    persistLocal(get);
    return lead;
  },
  patchLead: (id, patch) => {
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    persistNow(get, set);
  },
  requestMatch: async (leadId) => {
    try {
      const response = await fetch("/api/workspace", {
        method: "POST", credentials: "include", headers: { "content-type": "application/json" },
        body: JSON.stringify({ matchRequest: { id: leadId } }),
      });
      const data = await response.json().catch(() => ({})) as { ok?: boolean; message?: string; lead?: Lead; remainingCapacity?: number };
      if (!response.ok || data.ok !== true || data.lead?.id !== leadId || !data.lead.partnerId) {
        return { ok: false, message: typeof data.message === "string" ? data.message : "Toewijzing is niet bevestigd door de server." };
      }
      const saved = data.lead;
      set((state) => ({
        leads: state.leads.map((lead) => lead.id === saved.id ? saved : lead),
        partners: state.partners.map((partner) => partner.id === saved.partnerId && typeof data.remainingCapacity === "number" ? { ...partner, capacity: data.remainingCapacity } : partner),
        ownPartner: state.ownPartner?.id === saved.partnerId && typeof data.remainingCapacity === "number" ? { ...state.ownPartner, capacity: data.remainingCapacity } : state.ownPartner,
      }));
      persistLocal(get);
      return { ok: true, message: typeof data.message === "string" ? data.message : "De toewijzing is opgeslagen." };
    } catch {
      return { ok: false, message: "Toewijzing is niet bevestigd door een verbindingsfout. Probeer opnieuw." };
    }
  },
  bookAppointment: (leadId, date, time) => {
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId
          ? { ...l, appointment: { date, time, status: "Aangevraagd" } }
          : l,
      ),
    }));
    persistNow(get, set);
  },
  cancelAppointment: (leadId) => {
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId && l.appointment
          ? { ...l, appointment: { ...l.appointment, status: "Geannuleerd" } }
          : l,
      ),
    }));
    persistNow(get, set);
  },
  confirmAppointment: (leadId) => {
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId && l.appointment
          ? { ...l, appointment: { ...l.appointment, status: "Bevestigd" } }
          : l,
      ),
    }));
    persistNow(get, set);
  },
  submitPartner: async (partner) => {
    const next: Partner = {
      ...partner,
      id: newId("P"),
      status: "Te beoordelen",
      quality: 0,
    };
    await persistIntake("partners", next);
    set((s) => ({ partners: [next, ...s.partners] }));
    persistLocal(get);
    return next;
  },
  setPartnerStatus: (id, status) => {
    set((s) => ({
      partners: s.partners.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
    persistNow(get, set);
  },
  saveOwnAvailability: async (patch) => {
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ partnerSelfServe: patch }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; partner?: Partner };
      if (!res.ok || data.ok !== true || !data.partner?.id || (patch.id && data.partner.id !== patch.id)) {
        return { ok: false, message: typeof data.message === "string" ? data.message : "Opslaan lukte niet." };
      }
      const saved = data.partner;
      set((s) => ({ partners: withOwnPartner(s.partners, saved), ownPartner: saved }));
      persistLocal(get);
      return { ok: true, message: data.message, partner: saved };
    } catch {
      return { ok: false, message: "Opslaan lukte niet door een verbindingsfout." };
    }
  },
  setLeadStatus: (id, status) => {
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
    persistNow(get, set);
  },
  deleteLead: (id, opts) => {
    const lead = get().leads.find((l) => l.id === id);
    if (!lead) return { ok: false, message: "Dossier niet gevonden." };
    if (hasFinancialRegistration(lead) && !opts?.force) {
      return { ok: false, blocked: true, message: FINANCIAL_DELETE_BLOCKED };
    }
    if (hasFinancialRegistration(lead) && opts?.force) {
      // Soft-delete: keep deal data on disk, hide from cockpit.
      set((s) => ({
        leads: s.leads.map((l) =>
          l.id === id ? { ...l, deletedAt: new Date().toISOString() } : l,
        ),
      }));
    } else {
      set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
    }
    persistNow(get, set);
    return { ok: true };
  },
  deletePartner: (id) => {
    set((s) => ({ partners: s.partners.filter((p) => p.id !== id) }));
    persistNow(get, set);
  },
  deleteSubscriber: (email) => {
    set((s) => ({ subscribers: s.subscribers.filter((x) => x.email !== email) }));
    persistNow(get, set);
  },
  addNote: (text) => {
    const clean = text.trim();
    if (!clean) return;
    set((s) => ({
      notes: [{ id: newId("N"), text: clean, createdAt: new Date().toISOString() }, ...s.notes],
    }));
    persistNow(get, set);
  },
  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    persistNow(get, set);
  },
  setSiteNotice: (notice) => {
    set({ siteNotice: notice });
    persistNow(get, set);
  },
  setMatchingPaused: (paused) => {
    set({ matchingPaused: paused });
    persistNow(get, set);
  },
  markReportPaid: () => {
    set({ reportPaid: true });
    persistNow(get, set);
  },
  markExclusivePaid: () => {
    set({ exclusivePaid: true });
    persistNow(get, set);
  },
  setPartnerExclusive: (id, paid) => {
    set((s) => ({ partners: s.partners.map((p) => (p.id === id ? { ...p, exclusivePaid: paid } : p)) }));
    persistNow(get, set);
  },
  subscribe: (email, name) => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    set((s) => {
      if (s.subscribers.some((x) => x.email === clean)) return s;
      return {
        subscribers: [
          { email: clean, name: name.trim(), createdAt: new Date().toISOString() },
          ...s.subscribers,
        ],
      };
    });
    persistNow(get, set);
  },
}));
