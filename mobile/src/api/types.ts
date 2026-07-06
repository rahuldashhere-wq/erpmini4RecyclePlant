export type PlantKey = "oldRp" | "newRp";

export interface Department {
  name: string;
  items: string[];
}

export interface WastageValues {
  [department: string]: { [item: string]: number };
}

export interface WastageEntry {
  plant: PlantKey;
  date: string; // YYYY-MM-DD
  values: WastageValues;
  notes: string;
  saved: boolean;
}

export interface ProductionRow {
  id: string;
  name: string;
  qty: number;
}

export interface ShiftData {
  rows: ProductionRow[];
  lumps: number;
  stopped: boolean;
}

export interface ProductionEntry {
  plant: PlantKey;
  date: string;
  shiftA: ShiftData;
  shiftB: ShiftData;
  notes: string;
  saved: boolean;
}

export interface GranuleIssueEntry {
  date: string;
  rows: ProductionRow[];
  notes: string;
  saved: boolean;
}

export interface AdminRow {
  day: number;
  date: string;
  shiftA: number | null;
  shiftB: number | null;
  totalProduction: number;
  totalAmount: number;
  balance: number;
  shiftsRan: number;
}

export interface AdminOverall {
  production: number;
  amount: number;
  balance: number;
}

export interface AdminReport {
  rows: AdminRow[];
  overall: AdminOverall;
  rate: number;
  dedBoth: number;
  dedOne: number;
}
