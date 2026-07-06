import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";
import { hashPasscode } from "../../../lib/crypto";
import { computeAdminReport } from "../../../lib/adminReport";
import { PlantKey } from "../../../lib/schema";

export async function POST(req: NextRequest) {
  try {
    const { passcode, plant, year, month } = (await req.json()) as {
      passcode: string; plant: PlantKey; year: number; month: number;
    };
    const snap = await db.collection("adminSettings").doc("main").get();
    if (!snap.exists) return NextResponse.json({ error: "Admin settings not initialised." }, { status: 500 });
    const settings = snap.data() as any;

    if (hashPasscode(passcode) !== settings.passcodeHash) {
      return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
    }

    const { rate, dedBoth } = settings[plant];
    const report = await computeAdminReport(db, plant, year, month, rate, dedBoth);
    return NextResponse.json({ ...report, rate, dedBoth, dedOne: dedBoth / 2 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
