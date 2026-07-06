import { PlantKey, AdminReport } from "./types";

// Set this once, right after you deploy web-admin to Vercel (step 3 in the
// README). Every admin feature in the app — report, settings, PDFs — talks
// to this one URL. The desktop portal (web-admin itself) uses the exact same
// API routes, so a password/rate change from either place is instantly true
// on both.
export const API_BASE = "https://erpmini4-recycle-plant.vercel.app";

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function verifyAdminPasscode(passcode: string): Promise<boolean> {
  const data = await postJson("/api/verify-passcode", { passcode });
  return data.ok as boolean;
}

export async function getAdminReport(
  passcode: string, plant: PlantKey, year: number, month: number
): Promise<AdminReport> {
  return postJson("/api/admin-report", { passcode, plant, year, month }) as Promise<AdminReport>;
}

export async function updateAdminSettings(input: {
  currentPasscode: string;
  newPasscode?: string;
  oldRp?: { rate: number; dedBoth: number };
  newRp?: { rate: number; dedBoth: number };
}): Promise<void> {
  await postJson("/api/update-settings", input);
}

/** Build-and-open URLs — no async call needed, just point Linking.openURL at these. */
export function wastagePdfUrl(plant: PlantKey, year: number, month: number): string {
  return `${API_BASE}/api/wastage-pdf?plant=${plant}&year=${year}&month=${month}`;
}

export function adminPdfUrl(passcode: string, plant: PlantKey, year: number, month: number): string {
  return `${API_BASE}/api/admin-pdf?passcode=${encodeURIComponent(passcode)}&plant=${plant}&year=${year}&month=${month}`;
}
