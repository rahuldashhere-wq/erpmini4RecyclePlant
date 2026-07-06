import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";
import { hashPasscode } from "../../../lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    const snap = await db.collection("adminSettings").doc("main").get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Admin settings not initialised — run scripts/seed-admin-settings.js once." }, { status: 500 });
    }
    const { passcodeHash } = snap.data() as any;
    return NextResponse.json({ ok: hashPasscode(passcode) === passcodeHash });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
