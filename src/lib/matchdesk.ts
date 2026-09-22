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
  woningscan: "https://buy.stripe.com/7sY00kbJl3tg9a1fTJa7C00",
  exclusief: "https://buy.stripe.com/4gMaEY4gTfbY71TcHxa7C01",
} as const;

export const CONTACT = {
  email: "info@getmatchdesk.nl",
  whatsapp: "https://wa.me/31643610083",
  kvk: "88532496",
} as const;

export type RoofType = "Hellend dak" | "Plat dak" | "Deels plat / deels hellend" | "Weet ik niet";
export type RoofDir = "Zuid" | "Zuidwest" | "Zuidoost" | "Oost" | "West" | "Noord / anders" | "Weet ik niet";
export type Shade = "Weinig" | "Deels (dakkapel, schoorsteen, boom)" | "Veel" | "Weet ik niet";
export type Meter = "1-fase" | "3-fase" | "Weet ik niet";

export const ROOF_TYPES: RoofType[] = ["Hellend dak", "Plat dak", "Deels plat / deels hellend", "Weet ik niet"];
export const ROOF_DIRS: RoofDir[] = ["Zuid", "Zuidwest", "Zuidoost", "Oost", "West", "Noord / anders", "Weet ik niet"];
export const SHADES: Shade[] = ["Weinig", "Deels (dakkapel, schoorsteen, boom)", "Veel", "Weet ik niet"];
export const METERS: Meter[] = ["1-fase", "3-fase", "Weet ik niet"];

/** Opdracht & commissie (deal-workflow op productie / toekomstige cockpit). */
export type LeadDeal = {
  contactedAt?: string;
  quote?: { reference: string; amountCents: number; basis: string };
  outcome?: "Gewonnen" | "Verloren";
  reason?: string;
  commission?: { amountCents: number; firstWin?: boolean; capCents?: number };
  invoice?: {
    reference: string;
    issuedOn: string;
    dueOn: string;
    totalCents: number;
    taxNote: string;
  };
  receipts?: Array<{ reference: string; receivedOn: string; amountCents: number }>;
};

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
  usageKwh?: number;
  roofType?: RoofType;
  roofDir?: RoofDir;
  shade?: Shade;
  meter?: Meter;
  hasSolar?: boolean;
  note?: string;
  /** Opdracht & commissie (vastgelegd in de deal-workflow). */
  deal?: LeadDeal;
  /** Soft-delete door admin force-verwijderen van een financieel dossier. */
  deletedAt?: string;
};

export const SAMPLE_LEAD: Lead = {
  id: "MD-VOORBEELD-1328",
  product: "Zonnepanelen",
  postcode: "1328 LE",
  city: "Almere",
  address: "Chagallweg 38",
  term: "Binnen 3 maanden",
  name: "Fleur de Vries",
  email: "fleur@voorbeeld.getmatchdesk.nl",
  phone: "06 1234 5678",
  consent: true,
  status: "Nieuw",
  createdAt: "2026-09-17T10:00:00.000Z",
  usageKwh: 4200,
  roofType: "Hellend dak",
  roofDir: "Zuidwest",
  shade: "Deels (dakkapel, schoorsteen, boom)",
  meter: "3-fase",
  hasSolar: false,
  note: "Wil eerst een schouwing voordat er een offerte komt. Auto laadt thuis.",
};

export type Partner = {
  id: string;
  name: string;
  email: string;
  /** Voornaam of contactpersoon, gebruikt in de activatiemail. */
  contactName?: string;
  kvk: string;
  products: Product[];
  prefixes: string[];
  capacity: number;
  status: "Te beoordelen" | "Actief" | "Gepauzeerd" | "Gearchiveerd";
  quality: number;
  example?: boolean;
  exclusivePaid?: boolean;
  /** Gezet door de activatiepagina, niet door het aanmeldformulier. */
  activatedAt?: string;
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
  exclusivePaid?: boolean;
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
  return { leads: [], partners: [], subscribers: [], notes: [] };
}

export function loadWorkspace(): Workspace {
  if (typeof window === "undefined") return emptyWorkspace();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWorkspace();
    const parsed = JSON.parse(raw) as Workspace;
    const fake = new Set(["P-UT-01", "P-NH-02", "P-ZL-03"]);
    const partners = (Array.isArray(parsed.partners) ? parsed.partners : []).filter(
      (p) => !p.example && !fake.has(p.id) && !String(p.email || "").endsWith(".example"),
    );
    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      partners,
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      activeLeadId: parsed.activeLeadId,
      reportPaid: parsed.reportPaid,
      exclusivePaid: parsed.exclusivePaid,
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
  const active = partners.filter((p) => p.status === "Actief" && !p.example);
  const regional = active.filter(
    (p) => p.prefixes.includes(prefix) && p.products.includes(lead.product),
  );
  if (regional[0]) return regional[0];
  const productFit = active.find((p) => p.products.includes(lead.product));
  return productFit ?? active[0];
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

export function netbeheerder(postcode: string) {
  const n = Number(postcode.replace(/\D/g, "").slice(0, 2));
  if (n >= 10 && n <= 19) return "Liander";
  if (n >= 20 && n <= 29) return "Stedin";
  if (n >= 30 && n <= 39) return "Stedin";
  if (n >= 40 && n <= 49) return "Stedin";
  if (n >= 50 && n <= 59) return "Enexis";
  if (n >= 60 && n <= 69) return "Enexis";
  if (n >= 70 && n <= 79) return "Liander";
  if (n >= 80 && n <= 89) return "Enexis / Liander";
  if (n >= 90) return "Enexis / Liander";
  return "netbeheerder ter plaatse";
}

const ORIENT: Record<RoofDir, number> = {
  Zuid: 1,
  Zuidwest: 0.93,
  Zuidoost: 0.93,
  Oost: 0.78,
  West: 0.78,
  "Noord / anders": 0.48,
  "Weet ik niet": 0.86,
};

const SHADE_F: Record<Shade, number> = {
  Weinig: 1,
  "Deels (dakkapel, schoorsteen, boom)": 0.82,
  Veel: 0.58,
  "Weet ik niet": 0.88,
};

export function runScan(lead: Lead): ScanResult {
  const digits = Number(lead.postcode.replace(/\D/g, "").slice(0, 4)) || 3500;
  const orient = ORIENT[lead.roofDir ?? "Weet ik niet"];
  const shade = SHADE_F[lead.shade ?? "Weet ik niet"];
  const usage = lead.usageKwh && lead.usageKwh > 400 ? lead.usageKwh : 0;
  const panels =
    lead.product === "Thuisbatterij"
      ? 0
      : usage
        ? Math.max(6, Math.min(20, Math.round((usage * 0.85) / 350)))
        : 8 + (digits % 8);
  const yieldKwh =
    lead.product === "Thuisbatterij" ? 0 : Math.round(panels * 350 * orient * shade);
  const batteryKwh =
    lead.product === "Zonnepanelen" ? 0 : usage ? Math.max(5, Math.min(15, Math.round(usage / 900))) : 5 + (digits % 6);
  const suitability: ScanResult["suitability"] =
    lead.roofDir === "Noord / anders" || lead.shade === "Veel"
      ? "nader te bekijken"
      : orient * shade > 0.85
        ? "sterk"
        : orient * shade > 0.7
          ? "kansrijk"
          : "nader te bekijken";
  const region = regionLabel(lead.postcode);
  const matchHint =
    lead.product === "Thuisbatterij"
      ? `In ${region} (${netbeheerder(lead.postcode)}) kijken we naar partners met batterij-ervaring en vrije capaciteit.`
      : `In ${region} (${netbeheerder(lead.postcode)}) zoeken we één partner voor dak, omvormer en netaansluiting.`;
  return {
    leadId: lead.id,
    region,
    suitability,
    yieldKwh,
    panels,
    batteryKwh,
    matchHint,
    nextSteps: [
      "Dit rapport is de start — geen schouwing en geen offerte.",
      "De installateur rekent na op jouw dak, meter en net.",
      "Plan daarna een gesprek vanuit je portaal.",
    ],
  };
}

export type FitReport = {
  scan: ScanResult;
  operator: string;
  installerAsk: string[];
  risks: string[];
  brief: string[];
  missing: string[];
};

export function buildFitReport(lead: Lead): FitReport {
  const scan = runScan(lead);
  const operator = netbeheerder(lead.postcode);
  const missing: string[] = [];
  if (!lead.usageKwh) missing.push("jaarverbruik");
  if (!lead.roofType || lead.roofType === "Weet ik niet") missing.push("daktype");
  if (!lead.roofDir || lead.roofDir === "Weet ik niet") missing.push("dakrichting");
  if (!lead.shade || lead.shade === "Weet ik niet") missing.push("schaduw");
  if (!lead.meter || lead.meter === "Weet ik niet") missing.push("meterkast");

  const installerAsk = [
    "Foto’s van dakvlakken, meterkast en (indien aanwezig) bestaande omvormer.",
    `Netaansluiting bij ${operator}: teruglevercapaciteit en eventuele congestie op ${lead.postcode}.`,
    lead.meter === "1-fase"
      ? "1-fase aansluiting: max. omvormervermogen en eventuele 3-fase upgrade."
      : "Bevestig 1- of 3-fase en vrije groepen in de meterkast.",
    lead.product.includes("batterij") || lead.product.includes("Batterij")
      ? "Batterij: hybrid/AC-coupled, backup-wens, dynamisch contract."
      : "Past het paneelveld bij het jaarverbruik, of is er overdimensionering?",
    "Schouwing ter plaatse vóór bindende offerte (nok, ballast, kabelweg, schaduwuren).",
  ];

  const risks: string[] = [];
  if (lead.shade === "Veel" || lead.shade?.startsWith("Deels")) {
    risks.push("Schaduw op het dakvlak. Optimizer of herverdeling van strings is waarschijnlijk nodig.");
  }
  if (lead.roofDir === "Noord / anders") {
    risks.push("Noordelijk of afwijkend dakvlak: lagere opbrengst, extra uitleg richting klant.");
  }
  if (lead.roofType === "Plat dak") {
    risks.push("Plat dak: ballastframe, windzone en dakbedekking meenemen in de schouwing.");
  }
  if (lead.hasSolar) {
    risks.push("Bestaande installatie: omvormer, garantie en uitbreiding vs. vervanging checken.");
  }
  if (lead.meter === "1-fase" && scan.panels >= 12) {
    risks.push("Groot veld op 1-fase: begrensd vermogen of 3-fase upgrade bespreken.");
  }
  risks.push(`Net: ${operator} in ${scan.region}. Terugleveren is geen zekerheid — installer checkt de aansluiting.`);
  if (lead.term === "Zo snel mogelijk") {
    risks.push("Krappe planning: materiaallevering en netwerkmelding bepalen de startdatum, niet alleen de wens.");
  }

  const brief = [
    `${lead.product} · ${lead.address}, ${lead.postcode} ${lead.city}`,
    `Klant ${lead.name} · ${lead.email} · ${lead.phone}`,
    `Termijn: ${lead.term}. Dossier ${lead.id}.`,
    lead.usageKwh ? `Opgegeven jaarverbruik ${kwh(lead.usageKwh)}.` : "Jaarverbruik nog niet opgegeven.",
    lead.roofType && lead.roofDir
      ? `Dak: ${lead.roofType}, richting ${lead.roofDir}, schaduw: ${lead.shade ?? "onbekend"}.`
      : "Dakgegevens deels onbekend — schouwing is leidend.",
    lead.meter ? `Meterkast: ${lead.meter}.` : "Meterkast onbekend.",
    lead.hasSolar ? "Er liggen al panelen." : "Geen bestaande panelen opgegeven.",
    lead.product === "Thuisbatterij"
      ? `Richtgrootte batterij ${scan.batteryKwh} kWh — ter discussie, geen bestelling.`
      : `Richtgrootte ${scan.panels} panelen / ${kwh(scan.yieldKwh)} — postcode + dakantwoorden, geen opbrengstgarantie.`,
    scan.matchHint,
  ];
  if (lead.note?.trim()) brief.push(`Toelichting klant: ${lead.note.trim()}`);

  return { scan, operator, installerAsk, risks, brief, missing };
}
