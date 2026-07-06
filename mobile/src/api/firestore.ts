import {
  doc, getDoc, setDoc, collection, query, where, orderBy, getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { PlantKey, WastageEntry, ProductionEntry, GranuleIssueEntry } from "./types";
import { emptyWastageValues } from "./schema";

const wastageId = (plant: PlantKey, date: string) => `${plant}_${date}`;
const productionId = (plant: PlantKey, date: string) => `${plant}_${date}`;

/* ---------------- listing dates (for the Date List screen) ---------------- */

export async function listDatesForPlant(plant: PlantKey): Promise<string[]> {
  const q = query(collection(db, "productionEntries"), where("plant", "==", plant), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().date as string);
}

export async function listGranuleDates(): Promise<string[]> {
  const snap = await getDocs(query(collection(db, "granuleIssues"), orderBy("date", "desc")));
  return snap.docs.map((d) => d.id);
}

export async function dateEntryExists(plant: PlantKey, date: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "productionEntries", productionId(plant, date)));
  return snap.exists();
}

export async function granuleDateExists(date: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "granuleIssues", date));
  return snap.exists();
}

/* ---------------- creating a fresh date entry (blank, guarded) ------------ */

export async function createBlankDateEntry(plant: PlantKey, date: string) {
  const exists = await dateEntryExists(plant, date);
  if (exists) throw new Error("An entry for this date already exists.");

  await setDoc(doc(db, "wastageEntries", wastageId(plant, date)), {
    plant, date, values: emptyWastageValues(plant), notes: "", saved: false,
  });
  await setDoc(doc(db, "productionEntries", productionId(plant, date)), {
    plant, date,
    shiftA: { rows: [], lumps: 0, stopped: false },
    shiftB: { rows: [], lumps: 0, stopped: false },
    notes: "", saved: false,
  });
}

export async function createBlankGranuleEntry(date: string) {
  const exists = await granuleDateExists(date);
  if (exists) throw new Error("An entry for this date already exists.");
  await setDoc(doc(db, "granuleIssues", date), { date, rows: [], notes: "", saved: false });
}

/* ---------------- read / write a single day's wastage --------------------- */

export async function getWastageEntry(plant: PlantKey, date: string): Promise<WastageEntry | null> {
  const snap = await getDoc(doc(db, "wastageEntries", wastageId(plant, date)));
  return snap.exists() ? (snap.data() as WastageEntry) : null;
}

export async function saveWastageEntry(entry: WastageEntry) {
  await setDoc(doc(db, "wastageEntries", wastageId(entry.plant, entry.date)), { ...entry, saved: true });
}

/* ---------------- read / write a single day's production ------------------ */

export async function getProductionEntry(plant: PlantKey, date: string): Promise<ProductionEntry | null> {
  const snap = await getDoc(doc(db, "productionEntries", productionId(plant, date)));
  return snap.exists() ? (snap.data() as ProductionEntry) : null;
}

export async function saveProductionEntry(entry: ProductionEntry) {
  await setDoc(doc(db, "productionEntries", productionId(entry.plant, entry.date)), { ...entry, saved: true });
}

/* ---------------- read / write granule issue ------------------------------- */

export async function getGranuleEntry(date: string): Promise<GranuleIssueEntry | null> {
  const snap = await getDoc(doc(db, "granuleIssues", date));
  return snap.exists() ? (snap.data() as GranuleIssueEntry) : null;
}

export async function saveGranuleEntry(entry: GranuleIssueEntry) {
  await setDoc(doc(db, "granuleIssues", entry.date), { ...entry, saved: true });
}

/* ---------------- month sheet for the Wastage Report ----------------------- */

export async function getWastageMonth(plant: PlantKey, year: number, month: number) {
  const nDays = new Date(year, month, 0).getDate();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const dates = Array.from({ length: nDays }, (_, i) => `${year}-${pad2(month)}-${pad2(i + 1)}`);
  const results = await Promise.all(dates.map((d) => getWastageEntry(plant, d)));
  return dates.map((date, i) => ({ date, entry: results[i] }));
}
