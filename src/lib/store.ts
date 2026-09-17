import { create } from "zustand";
import {
  type Lead,
  type Partner,
  type Product,
  type Term,
  loadWorkspace,
  saveWorkspace,
  newId,
  findPartnerFor,
  type Subscriber,
  type AdminNote,
  type RoofType,
  type RoofDir,
  type Shade,
  type Meter,
} from "./matchdesk";

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
  draft: Draft;
  hydrate: () => void;
  persist: () => void;
  setDraft: (patch: Partial<Draft>) => void;
  resetDraft: () => void;
  submitLead: () => Lead;
  patchLead: (id: string, patch: Partial<Lead>) => void;
  requestMatch: (leadId: string) => void;
  bookAppointment: (leadId: string, date: string, time: string) => void;
  cancelAppointment: (leadId: string) => void;
  confirmAppointment: (leadId: string) => void;
  submitPartner: (partner: Omit<Partner, "id" | "status" | "quality">) => Partner;
  setPartnerStatus: (id: string, status: Partner["status"]) => void;
  setLeadStatus: (id: string, status: Lead["status"]) => void;
  deleteLead: (id: string) => void;
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

function persistNow(get: () => Store, set: (patch: Partial<Store>) => void) {
  const s = get();
  saveWorkspace({
    leads: s.leads,
    partners: s.partners,
    subscribers: s.subscribers,
    notes: s.notes,
    activeLeadId: s.activeLeadId,
    reportPaid: s.reportPaid,
    exclusivePaid: s.exclusivePaid,
    siteNotice: s.siteNotice,
    matchingPaused: s.matchingPaused,
  });
  if (typeof window !== "undefined") {
    void fetch("/api/workspace", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leads: s.leads,
        partners: s.partners,
        subscribers: s.subscribers,
        notes: s.notes,
        activeLeadId: s.activeLeadId,
        reportPaid: s.reportPaid,
        exclusivePaid: s.exclusivePaid,
        siteNotice: s.siteNotice,
        matchingPaused: s.matchingPaused,
      }),
    }).then((r) => (r.ok ? r.json() : null))
      .then((data: { full?: boolean } | null) => {
        if (data && typeof data.full === "boolean") set({ serverOwner: data.full });
      })
      .catch(() => {});
  }
}

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
  draft: emptyDraft(),
  hydrate: () => {
    const local = loadWorkspace();
    set({
      ready: true,
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
    void fetch("/api/workspace", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { full?: boolean; workspace?: ReturnType<typeof loadWorkspace> } | null) => {
        if (!data?.workspace) return;
        const remote = data.workspace;
        if (data.full) {
          set({
            leads: remote.leads ?? [],
            partners: Array.isArray(remote.partners) ? remote.partners : [],
            subscribers: remote.subscribers ?? [],
            notes: remote.notes ?? [],
            activeLeadId: remote.activeLeadId,
            reportPaid: Boolean(remote.reportPaid),
            exclusivePaid: Boolean(remote.exclusivePaid),
            siteNotice: remote.siteNotice ?? "",
            matchingPaused: Boolean(remote.matchingPaused),
            serverOwner: true,
          });
          saveWorkspace({
            leads: remote.leads ?? [],
            partners: Array.isArray(remote.partners) ? remote.partners : [],
            subscribers: remote.subscribers ?? [],
            notes: remote.notes ?? [],
            activeLeadId: remote.activeLeadId,
            reportPaid: remote.reportPaid,
            exclusivePaid: remote.exclusivePaid,
            siteNotice: remote.siteNotice,
            matchingPaused: remote.matchingPaused,
          });
          return;
        }
        set((s) => ({
          serverOwner: false,
          siteNotice: remote.siteNotice ?? s.siteNotice,
          matchingPaused: Boolean(remote.matchingPaused),
          partners: s.partners.length ? s.partners : remote.partners ?? [],
        }));
      })
      .catch(() => {});
  },
  persist: () => persistNow(get, set),
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: () => set({ draft: emptyDraft() }),
  submitLead: () => {
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
    set((s) => ({ leads: [lead, ...s.leads], activeLeadId: lead.id }));
    persistNow(get, set);
    return lead;
  },
  patchLead: (id, patch) => {
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    persistNow(get, set);
  },
  requestMatch: (leadId) => {
    const { leads, partners } = get();
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const partner = findPartnerFor(lead, partners);
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId
          ? { ...l, status: partner ? "Gematcht" : "Nieuw", partnerId: partner?.id }
          : l,
      ),
    }));
    persistNow(get, set);
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
  submitPartner: (partner) => {
    const next: Partner = {
      ...partner,
      id: newId("P"),
      status: "Te beoordelen",
      quality: 0,
    };
    set((s) => ({ partners: [next, ...s.partners] }));
    persistNow(get, set);
    return next;
  },
  setPartnerStatus: (id, status) => {
    set((s) => ({
      partners: s.partners.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
    persistNow(get, set);
  },
  setLeadStatus: (id, status) => {
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
    persistNow(get, set);
  },
  deleteLead: (id) => {
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
    persistNow(get, set);
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
