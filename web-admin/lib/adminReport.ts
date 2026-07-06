import type { Firestore } from "firebase-admin/firestore";
import { PlantKey } from "./schema";

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
export interface AdminOverall { production: number; amount: number; balance: number }

const pad2 = (n: number) => String(n).padStart(2, "0");

export async function computeAdminReport(
  db: Firestore, plant: PlantKey, year: number, month: number, rate: number, dedBoth: number
): Promise<{ rows: AdminRow[]; overall: AdminOverall }> {
  const dedOne = dedBoth / 2;
  const nDays = new Date(year, month, 0).getDate();
  const dates = Array.from({ length: nDays }, (_, i) => `${year}-${pad2(month)}-${pad2(i + 1)}`);

  const refs = dates.map((date) => db.collection("productionEntries").doc(`${plant}_${date}`));
  const snaps = await db.getAll(...refs);

  const rows: AdminRow[] = snaps.map((snap, i) => {
    const day = i + 1;
    const date = dates[i];
    const data = snap.exists ? (snap.data() as any) : null;

    const shiftA = data && !data.shiftA?.stopped
      ? (data.shiftA?.rows ?? []).reduce((s: number, r: any) => s + (Number(r.qty) || 0), 0)
      : null;
    const shiftB = data && !data.shiftB?.stopped
      ? (data.shiftB?.rows ?? []).reduce((s: number, r: any) => s + (Number(r.qty) || 0), 0)
      : null;

    const shiftsRan = (shiftA !== null ? 1 : 0) + (shiftB !== null ? 1 : 0);
    const totalProduction = (shiftA || 0) + (shiftB || 0);
    const totalAmount = totalProduction * rate;
    const deduction = shiftsRan === 2 ? dedBoth : shiftsRan === 1 ? dedOne : 0;
    const balance = totalAmount - deduction;

    return { day, date, shiftA, shiftB, totalProduction, totalAmount, balance, shiftsRan };
  });

  const overall = rows.reduce(
    (acc, r) => ({
      production: acc.production + r.totalProduction,
      amount: acc.amount + r.totalAmount,
      balance: acc.balance + r.balance,
    }),
    { production: 0, amount: 0, balance: 0 }
  );

  return { rows, overall };
}
