export const PRODUCTS = [
  "Zonnepanelen",
  "Thuisbatterij",
  "Zonnepanelen + thuisbatterij",
] as const;

export type Product = (typeof PRODUCTS)[number];

export const TERMS = [
  "Zo snel mogelijk",
  "Binnen 3 maanden",
  "Binnen 6 maanden",
  "Ik oriënteer me nog",
] as const;

export type Term = (typeof TERMS)[number];

export const STAGES = [
  "Nieuw",
  "Gematcht",
  "Offerte",
  "In uitvoering",
  "Afgerond",
] as const;

export type Stage = (typeof STAGES)[number];

export const STRIPE = {
  woningscan: "https://buy.stripe.com/7sY6oIdRt1l80Dv22Ta7C02",
  exclusief: "https://buy.stripe.com/4gMaEY4gTfbY71TcHxa7C01",
} as const;

export const CONTACT = {
  email: "info@getmatchdesk.nl",
  whatsapp: "https://wa.me/31643610083",
  kvk: "88532496",
} as const;

export type Lead = {
  id: string;
  product: Product;
  postcode: string;
  city: string;
  address: string;
  term: Term;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  status: Stage;
  createdAt: string;
  partnerId?: string;
  appointment?: { date: string; time: string; status: "Aangevraagd" | "Bevestigd" | "Geannuleerd" };
};

export type Partner = {
  id: string;
  name: string;
  email: string;
  kvk: string;
  products: Product[];
  prefixes: string[];
  capacity: number;
  status: "Te beoordelen" | "Actief" | "Gepauzeerd" | "Gearchiveerd";
  quality: number;
  example?: boolean;
};

export type Subscriber = {
  email: string;
  name: string;
  createdAt: string;
};

export type ScanResult = {
  leadId: string;
  region: string;
  suitability: "sterk" | "kansrijk" | "nader te bekijken";
  yieldKwh: number;
  panels: number;
  batteryKwh: number;
  matchHint: string;
  nextSteps: string[];
};

const STORAGE_KEY = "matchdesk-workspace-v1";

export type AdminNote = { id: string; text: string; createdAt: string };

type Workspace = {
  leads: Lead[];
  partners: Partner[];
  subscribers: Subscriber[];
  notes?: AdminNote[];
  activeLeadId?: string;
  reportPaid?: boolean;
  siteNotice?: string;
  matchingPaused?: boolean;
};

export const SEED_PARTNERS: Partner[] = [
  {
    id: "P-UT-01",
    name: "Helderdak Utrecht",
    email: "planning@helderdak.example",
    kvk: "81234567",
    products: ["Zonnepanelen", "Zonnepanelen + thuisbatterij"],
    prefixes: ["35", "34", "39"],
    capacity: 4,
    status: "Actief",
    quality: 4.7,
    example: true,
  },
  {
    id: "P-NH-02",
    name: "Noordstroom Installatie",
    email: "aanvragen@noordstroom.example",
    kvk: "82345678",
    products: ["Thuisbatterij", "Zonnepanelen + thuisbatterij"],
    prefixes: ["10", "11", "15", "20"],
    capacity: 3,
    status: "Actief",
    quality: 4.5,
    example: true,
  },
  {
    id: "P-ZL-03",
    name: "Zuidlijn Energie",
    email: "match@zuidlijn.example",
    kvk: "83456789",
    products: ["Zonnepanelen", "Thuisbatterij", "Zonnepanelen + thuisbatterij"],
    prefixes: ["50", "51", "56", "62"],
    capacity: 5,
    status: "Actief",
    quality: 4.6,
    example: true,
  },
];

function emptyWorkspace(): Workspace {
  return { leads: [], partners: SEED_PARTNERS, subscribers: [], notes: [] };
}

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return emptyWorkspace();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    const parsed = JSON.parse(raw) as Workspace;
    return {
      leads: parsed.leads ?? [],
      partners: parsed.partners?.length ? parsed.partners : SEED_PARTNERS,
      subscribers: parsed.subscribers ?? [],
      notes: parsed.notes ?? [],
      activeLeadId: parsed.activeLeadId,
      reportPaid: parsed.reportPaid,
      siteNotice: parsed.siteNotice ?? "",
      matchingPaused: Boolean(parsed.matchingPaused),
    };
  } catch {
    return emptyWorkspace();
  }
}

export function saveWorkspace(ws: Workspace) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function normalizePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, " ").trim();
}

export function postcodePrefix(postcode: string) {
  const digits = postcode.replace(/\D/g, "");
  return digits.slice(0, 2);
}

export function regionLabel(postcode: string) {
  const n = Number(postcode.replace(/\D/g, "").slice(0, 2));
  if (n === 13) return "Flevoland";
  if (n >= 10 && n < 20) return "Noord-Holland";
  if (n >= 20 && n < 30) return "Zuid-Holland";
  if (n >= 30 && n < 40) return "Utrecht / Midden";
  if (n >= 40 && n < 50) return "Zeeland / West-Brabant";
  if (n >= 50 && n < 60) return "Noord-Brabant";
  if (n >= 60 && n < 70) return "Limburg";
  if (n >= 70 && n < 80) return "Gelderland";
  if (n >= 80 && n < 90) return "Overijssel / Flevoland";
  if (n >= 90) return "Groningen / Friesland / Drenthe";
  return "Nederland";
}

export function findPartnerFor(lead: Pick<Lead, "product" | "postcode">, partners: Partner[]) {
  const prefix = postcodePrefix(lead.postcode);
  const active = partners.filter((p) => p.status === "Actief");
  const regional = active.filter(
    (p) => p.prefixes.includes(prefix) && p.products.includes(lead.product),
  );
  if (regional[0]) return regional[0];
  const productFit = active.find((p) => p.products.includes(lead.product));
  return productFit ?? active[0];
}

export function runScan(lead: Lead): ScanResult {
  const digits = Number(lead.postcode.replace(/\D/g, "").slice(0, 4)) || 3500;
  const solarBias = 0.82 + ((digits % 17) / 100);
  const panels = lead.product === "Thuisbatterij" ? 0 : 8 + (digits % 8);
  const yieldKwh = lead.product === "Thuisbatterij" ? 0 : Math.round(panels * 350 * solarBias);
  const batteryKwh = lead.product === "Zonnepanelen" ? 0 : 5 + (digits % 6);
  const suitability: ScanResult["suitability"] =
    solarBias > 0.9 ? "sterk" : solarBias > 0.86 ? "kansrijk" : "nader te bekijken";
  const region = regionLabel(lead.postcode);
  const matchHint =
    lead.product === "Thuisbatterij"
      ? `In ${region} kijken we naar partners met batterij-ervaring en vrije capaciteit.`
      : `In ${region} zoeken we één partner met dak- en netwerkaansluiting in jouw postcodegebied.`;
  return {
    leadId: lead.id,
    region,
    suitability,
    yieldKwh,
    panels,
    batteryKwh,
    matchHint,
    nextSteps: [
      "Bekijk je basisresultaat en bewaar het bij je aanvraag.",
      "Vraag in het klantportaal een match aan — dan gaat je dossier naar één installateur.",
      "Plan desgewenst een telefonisch gesprek vanuit je portaal.",
    ],
  };
}

export function money(n: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function kwh(n: number) {
  return `${new Intl.NumberFormat("nl-NL").format(n)} kWh`;
}
