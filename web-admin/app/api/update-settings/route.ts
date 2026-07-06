import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebaseAdmin";
import { hashPasscode } from "../../../lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { currentPasscode, newPasscode, oldRp, newRp } = (await req.json()) as {
      currentPasscode: string;
      newPasscode?: string;
      oldRp?: { rate: number; dedBoth: number };
      newRp?: { rate: number; dedBoth: number };
    };

    const ref = db.collection("adminSettings").doc("main");
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Admin settings not initialised." }, { status: 500 });
    const settings = snap.data() as any;

    if (hashPasscode(currentPasscode) !== settings.passcodeHash) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }

    const update: Record<string, unknown> = {};

    if (newPasscode !== undefined) {
      if (!/^\d{6}$/.test(newPasscode)) {
        return NextResponse.json({ error: "New password must be exactly 6 digits." }, { status: 400 });
      }
      update.passcodeHash = hashPasscode(newPasscode);
    }
    if (oldRp) {
      if (typeof oldRp.rate !== "number" || typeof oldRp.dedBoth !== "number") {
        return NextResponse.json({ error: "oldRp.rate and oldRp.dedBoth must be numbers." }, { status: 400 });
      }
      update.oldRp = oldRp;
    }
    if (newRp) {
      if (typeof newRp.rate !== "number" || typeof newRp.dedBoth !== "number") {
        return NextResponse.json({ error: "newRp.rate and newRp.dedBoth must be numbers." }, { status: 400 });
      }
      update.newRp = newRp;
    }

    await ref.set(update, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
