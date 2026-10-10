import { isMatchablePartner } from "./partner-portal.mjs";
export { COMMERCIAL, COMMERCIAL_VERSION, COMMISSION_TEXT, MATCH_SLA_TEXT, PAUSED_OFFERS_TEXT, createCommercialSnapshot, commissionEligibility, successFeeForProduct } from "./commercial.mjs";

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
  /** New written agreement only. Existing dossiers without it retain their historical agreement. */
  commercial?: {
    version: string;
    agreementId: string;
    acceptedAt: string;
    product: Product;
    amountCents: number;
    vatRate: number;
    invoiceDays: number;
    basis: "original-job-only";
    payableAfter: "completed-and-customer-paid";
  };
  /** Verified actual completion and customer payment, distinct from a won quotation. */
  completedAt?: string;
  customerPaidAt?: string;
  cancelled?: boolean;
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
  /** Reference to a written agreement; signup/activation never implies acceptance of new prices. */
  commercialAgreement?: { version: string; acceptedAt: string; agreementId: string };
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
  /** Not inferable from a postcode or annual usage alone. Null until an installer calculates. */
  yieldKwh: number | null;
  panels: number | null;
  batteryKwh: number | null;
  matchHint: string;
  nextSteps: string[];
};

const STORAGE_KEY = "matchdesk-workspace-v2";

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
    // Do not import potentially owner-wide datasets or unverified payment flags from the previous cache.
    localStorage.removeItem("matchdesk-workspace-v1");
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
  const active = partners.filter((p) => isMatchablePartner(p));
  const regional = active.filter(
    (p) => p.prefixes.includes(prefix) && p.products.includes(lead.product),
  );
  return regional[0];
}

export function money(n: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function kwh(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "Nog te bepalen";
  return `${new Intl.NumberFormat("nl-NL").format(n)} kWh`;
}

export function netbeheerder(_postcode: string) {
  // Two postcode digits cannot identify the actual connection/operator reliably.
  return "Te controleren op het exacte adres";
}

export function runScan(lead: Lead): ScanResult {
  const panels = null;
  const yieldKwh = null;
  const batteryKwh = null;
  const suitability: ScanResult["suitability"] = "nader te bekijken";
  const region = regionLabel(lead.postcode);
  const matchHint =
    lead.product === "Thuisbatterij"
      ? `We zoeken voor ${lead.postcode} een partner met batterij-ervaring en vrije capaciteit. Grootte, aansluiting en geschiktheid moeten nog worden beoordeeld.`
      : `We zoeken voor ${lead.postcode} één partner voor je woning en wensen. Paneelaantal, opwek en aansluiting zijn nog niet vastgesteld.`;
  return {
    leadId: lead.id,
    region,
    suitability,
    yieldKwh,
    panels,
    batteryKwh,
    matchHint,
    nextSteps: [
      "Deze intake is voorbereiding op een gesprek; geen technische berekening of offerte.",
      "De installateur rekent na op jouw dak, meter en net.",
      "Bespreek een moment met Matchdesk; een verzoek is nog geen bevestigde afspraak.",
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
    `Controleer netbeheerder en netaansluiting op het exacte adres ${lead.postcode}; beoordeel ook terugleverbeperkingen.`,
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
    risks.push("Schaduw op het dakvlak: beoordeel opbrengst en ontwerp ter plaatse; deze intake schrijft geen optimizer of stringindeling voor.");
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
  if (lead.meter === "1-fase") {
    risks.push("1-fase aansluiting: beoordeel passend vermogen en eventuele aanpassing met de installateur.");
  }
  risks.push("Netbeheerder en mogelijkheden voor teruglevering zijn nog niet geverifieerd; de installateur controleert de concrete aansluiting.");
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
      ? "Batterijcapaciteit nog te bepalen op basis van verbruiksprofiel, bestaande installatie en wensen; geen automatisch advies uit de postcode."
      : "Paneelaantal en opwek nog te bepalen na dakbeoordeling en technisch ontwerp; niet afgeleid uit een postcode of jaarverbruik alleen.",
    scan.matchHint,
  ];
  if (lead.note?.trim()) brief.push(`Toelichting klant: ${lead.note.trim()}`);

  return { scan, operator, installerAsk, risks, brief, missing };
}
