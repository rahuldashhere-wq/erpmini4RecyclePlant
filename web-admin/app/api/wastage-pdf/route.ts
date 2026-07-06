import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { db } from "../../../lib/firebaseAdmin";
import { WASTAGE_SCHEMA, PLANT_LABEL, PlantKey } from "../../../lib/schema";

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plant = searchParams.get("plant") as PlantKey;
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    if (!plant || !year || !month) {
      return NextResponse.json({ error: "plant, year and month are required." }, { status: 400 });
    }

    const schema = WASTAGE_SCHEMA[plant];
    const nDays = new Date(year, month, 0).getDate();
    const dates = Array.from({ length: nDays }, (_, i) => `${year}-${pad2(month)}-${pad2(i + 1)}`);
    const refs = dates.map((d) => db.collection("wastageEntries").doc(`${plant}_${d}`));
    const snaps = await db.getAll(...refs);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
    const pageW = 842, pageH = 595;
    let page = pdfDoc.addPage([pageW, pageH]);
    let y = pageH - 50;

    page.drawText(`ALLIANCE POLYSACKS — WASTAGE REPORT — ${PLANT_LABEL[plant]} — ${month}/${year}`, { x: 40, y, size: 12, font: fontBold });
    y -= 22;

    const deptNames = schema.map((d) => d.name);
    const colX = [40, ...deptNames.map((_, i) => 110 + i * 78), 110 + deptNames.length * 78];

    const drawRow = (cells: string[], bold = false) => {
      cells.forEach((c, i) => page.drawText(c, { x: colX[i], y, size: 8, font: bold ? fontBold : font }));
      y -= 14;
      if (y < 40) { page = pdfDoc.addPage([pageW, pageH]); y = pageH - 40; }
    };

    drawRow(["Date", ...deptNames, "Total"], true);

    const colTotals = new Array(deptNames.length).fill(0);
    let grand = 0;
    dates.forEach((date, i) => {
      const data = snaps[i].exists ? (snaps[i].data() as any).values : null;
      const cells = [date];
      let rowTotal = 0;
      deptNames.forEach((dep, di) => {
        const val = data ? Object.values(data[dep] || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0) : 0;
        colTotals[di] += val;
        rowTotal += val;
        cells.push(fmt(val));
      });
      grand += rowTotal;
      cells.push(fmt(rowTotal));
      drawRow(cells);
    });

    drawRow(["TOTAL", ...colTotals.map(fmt), fmt(grand)], true);

    const bytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="wastage_${plant}_${year}-${pad2(month)}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
