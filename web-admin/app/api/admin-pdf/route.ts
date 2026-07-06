import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { db } from "../../../lib/firebaseAdmin";
import { hashPasscode } from "../../../lib/crypto";
import { computeAdminReport } from "../../../lib/adminReport";
import { PLANT_LABEL, PlantKey } from "../../../lib/schema";

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
const fmtMoney = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const passcode = searchParams.get("passcode") || "";
    const plant = searchParams.get("plant") as PlantKey;
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    if (!plant || !year || !month) {
      return NextResponse.json({ error: "plant, year and month are required." }, { status: 400 });
    }

    const snap = await db.collection("adminSettings").doc("main").get();
    if (!snap.exists) return NextResponse.json({ error: "Admin settings not initialised." }, { status: 500 });
    const settings = snap.data() as any;
    if (hashPasscode(passcode) !== settings.passcodeHash) {
      return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
    }

    const { rate, dedBoth } = settings[plant];
    const { rows, overall } = await computeAdminReport(db, plant, year, month, rate, dedBoth);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
    const pageW = 842, pageH = 595;
    let page = pdfDoc.addPage([pageW, pageH]);
    let y = pageH - 50;

    page.drawText(`ALLIANCE POLYSACKS — ADMIN REPORT — ${PLANT_LABEL[plant]} — ${month}/${year}`, { x: 40, y, size: 12, font: fontBold });
    y -= 22;

    const colX = [40, 140, 220, 300, 400, 520];
    const drawRow = (cells: string[], bold = false) => {
      cells.forEach((c, i) => page.drawText(c, { x: colX[i], y, size: 9, font: bold ? fontBold : font }));
      y -= 15;
      if (y < 40) { page = pdfDoc.addPage([pageW, pageH]); y = pageH - 40; }
    };
    drawRow(["Date", "Shift A", "Shift B", "Total Prod.", "Total Amount", "Balance"], true);
    rows.forEach((r) => drawRow([
      r.date, r.shiftA === null ? "-" : fmt(r.shiftA), r.shiftB === null ? "-" : fmt(r.shiftB),
      fmt(r.totalProduction), fmtMoney(r.totalAmount), fmtMoney(r.balance),
    ]));
    drawRow(["TOTAL", "", "", fmt(overall.production), fmtMoney(overall.amount), fmtMoney(overall.balance)], true);

    const bytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="admin_${plant}_${year}-${pad2(month)}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// NOTE: on the zero-cost path this PDF is NOT password-locked when opened —
// true in-file PDF encryption needs a native `qpdf` binary, which free
// serverless platforms (Vercel/Netlify Functions) don't let you install.
// The real protection here is the passcode gate above: nobody gets a PDF
// without it. If you later want the file itself to also prompt for a
// password, that needs a small paid Cloud Run container (a few cents/month)
// — ask and we can wire that in as an optional upgrade.
