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
  SEED_PARTNERS,
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
  siteNotice: string;
  matchingPaused: boolean;
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
  subscribe: (email: string, name: string) => void;
};

function persistNow(get: () => Store) {
  const s = get();
  saveWorkspace({
    leads: s.leads,
    partners: s.partners,
    subscribers: s.subscribers,
    notes: s.notes,
    activeLeadId: s.activeLeadId,
    reportPaid: s.reportPaid,
    siteNotice: s.siteNotice,
    matchingPaused: s.matchingPaused,
  });
}

export const useMatchdesk = create<Store>((set, get) => ({
  ready: false,
  leads: [],
  partners: SEED_PARTNERS,
  subscribers: [],
  notes: [],
  reportPaid: false,
  siteNotice: "",
  matchingPaused: false,
  draft: emptyDraft(),
  hydrate: () => {
    const ws = loadWorkspace();
    set({
      ready: true,
      leads: ws.leads,
      partners: ws.partners,
      subscribers: ws.subscribers,
      notes: ws.notes ?? [],
      activeLeadId: ws.activeLeadId,
      reportPaid: Boolean(ws.reportPaid),
      siteNotice: ws.siteNotice ?? "",
      matchingPaused: Boolean(ws.matchingPaused),
    });
  },
  persist: () => persistNow(get),
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
    persistNow(get);
    return lead;
  },
  patchLead: (id, patch) => {
    set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    persistNow(get);
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
    persistNow(get);
  },
  bookAppointment: (leadId, date, time) => {
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId
          ? { ...l, appointment: { date, time, status: "Aangevraagd" } }
          : l,
      ),
    }));
    persistNow(get);
  },
  cancelAppointment: (leadId) => {
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId && l.appointment
          ? { ...l, appointment: { ...l.appointment, status: "Geannuleerd" } }
          : l,
      ),
    }));
    persistNow(get);
  },
  confirmAppointment: (leadId) => {
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId && l.appointment
          ? { ...l, appointment: { ...l.appointment, status: "Bevestigd" } }
          : l,
      ),
    }));
    persistNow(get);
  },
  submitPartner: (partner) => {
    const next: Partner = {
      ...partner,
      id: newId("P"),
      status: "Te beoordelen",
      quality: 0,
    };
    set((s) => ({ partners: [next, ...s.partners] }));
    persistNow(get);
    return next;
  },
  setPartnerStatus: (id, status) => {
    set((s) => ({
      partners: s.partners.map((p) => (p.id === id ? { ...p, status } : p)),
    }));
    persistNow(get);
  },
  setLeadStatus: (id, status) => {
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
    persistNow(get);
  },
  deleteLead: (id) => {
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
    persistNow(get);
  },
  deletePartner: (id) => {
    set((s) => ({ partners: s.partners.filter((p) => p.id !== id) }));
    persistNow(get);
  },
  deleteSubscriber: (email) => {
    set((s) => ({ subscribers: s.subscribers.filter((x) => x.email !== email) }));
    persistNow(get);
  },
  addNote: (text) => {
    const clean = text.trim();
    if (!clean) return;
    set((s) => ({
      notes: [{ id: newId("N"), text: clean, createdAt: new Date().toISOString() }, ...s.notes],
    }));
    persistNow(get);
  },
  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    persistNow(get);
  },
  setSiteNotice: (notice) => {
    set({ siteNotice: notice });
    persistNow(get);
  },
  setMatchingPaused: (paused) => {
    set({ matchingPaused: paused });
    persistNow(get);
  },
  markReportPaid: () => {
    set({ reportPaid: true });
    persistNow(get);
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
    persistNow(get);
  },
}));
