import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { type AdminNote, type Lead, type Partner, type Subscriber } from "@/lib/matchdesk";

export type WorkspaceFile = {
  leads: Lead[];
  partners: Partner[];
  subscribers: Subscriber[];
  notes: AdminNote[];
  activeLeadId?: string;
  reportPaid?: boolean;
  exclusivePaid?: boolean;
  siteNotice?: string;
  matchingPaused?: boolean;
};

const FILE =
  (process.env.MATCHDESK_DATA?.trim() || "/opt/matchdesk/data") + "/workspace.json";

const FAKE_IDS = new Set(["P-UT-01", "P-NH-02", "P-ZL-03"]);

function empty(): WorkspaceFile {
  return { leads: [], partners: [], subscribers: [], notes: [] };
}

export function realPartners(partners: Partner[]): Partner[] {
  return partners.filter(
    (p) =>
      !p.example &&
      !FAKE_IDS.has(p.id) &&
      !String(p.email || "").endsWith(".example"),
  );
}

function clean(ws: WorkspaceFile): WorkspaceFile {
  return { ...ws, partners: realPartners(ws.partners ?? []) };
}

export function readWorkspaceFile(): WorkspaceFile {
  try {
    const raw = readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw) as WorkspaceFile;
    return clean({
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      partners: Array.isArray(parsed.partners) ? parsed.partners : [],
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      activeLeadId: parsed.activeLeadId,
      reportPaid: parsed.reportPaid,
      exclusivePaid: parsed.exclusivePaid,
      siteNotice: parsed.siteNotice ?? "",
      matchingPaused: Boolean(parsed.matchingPaused),
    });
  } catch {
    return empty();
  }
}

export function writeWorkspaceFile(ws: WorkspaceFile) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(clean(ws), null, 2));
}

export function publicPartners(partners: Partner[]): Partner[] {
  return realPartners(partners)
    .filter((p) => p.status === "Actief")
    .map((p) => ({
      ...p,
      email: "",
      kvk: p.kvk ? `${p.kvk.slice(0, 4)}****` : "",
    }));
}
