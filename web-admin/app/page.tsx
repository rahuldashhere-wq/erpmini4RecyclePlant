"use client";
import React, { useEffect, useState } from "react";

type PlantKey = "oldRp" | "newRp";
interface AdminRow {
  day: number; date: string; shiftA: number | null; shiftB: number | null;
  totalProduction: number; totalAmount: number; balance: number;
}
interface AdminReport {
  rows: AdminRow[];
  overall: { production: number; amount: number; balance: number };
  rate: number; dedBoth: number; dedOne: number;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PLANT_LABEL: Record<PlantKey, string> = { oldRp: "Old RP Plant", newRp: "New RP Plant" };
const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
const fmtMoney = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function AdminPortalPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const [plant, setPlant] = useState<PlantKey>("oldRp");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const submit = async () => {
    setChecking(true);
    setError("");
    try {
      const { ok } = await postJson("/api/verify-passcode", { passcode: code });
      if (ok) { setPasscode(code); setUnlocked(true); } else setError("Incorrect passcode. Try again.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    postJson("/api/admin-report", { passcode, plant, year, month })
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [unlocked, plant, month, year]);

  const downloadUrl = `/api/admin-pdf?passcode=${encodeURIComponent(passcode)}&plant=${plant}&year=${year}&month=${month}`;

  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f0", fontFamily: "system-ui" }}>
        <div style={{ width: 380, background: "#fff", border: "2px solid #000", borderRadius: 14, padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#888", fontWeight: 700 }}>ALLIANCE POLYSACKS</div>
          <div style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 18px" }}>Admin Report Portal</div>
          <div style={{ fontSize: 12.5, color: "#666", marginBottom: 18 }}>Enter the 6-digit admin passcode to view this report.</div>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            maxLength={6} placeholder="••••••"
            style={{ width: 180, textAlign: "center", letterSpacing: "0.5em", fontSize: 22, fontWeight: 700, fontFamily: "monospace", border: "1.5px solid #000", borderRadius: 8, padding: "10px 0" }}
          />
          {error && <div style={{ marginTop: 10, fontSize: 12, color: "#a30000" }}>{error}</div>}
          <button onClick={submit} disabled={checking} style={{ width: "100%", marginTop: 20, background: "#000", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            {checking ? "Checking…" : "Unlock report"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f2f2f0", fontFamily: "system-ui" }}>
      <div style={{ background: "#000", color: "#fff", padding: "16px 28px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#aaa", fontWeight: 700 }}>ALLIANCE POLYSACKS</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Admin Report Portal</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowSettings(true)} style={headerBtn}>Settings</button>
          <button onClick={() => { setUnlocked(false); setCode(""); }} style={headerBtn}>Lock</button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 28px" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <div style={labelStyle}>Month</div>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={selectStyle}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={labelStyle}>Year</div>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectStyle}>
              {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginLeft: 8 }}>
            {(["oldRp", "newRp"] as const).map((p) => (
              <button key={p} onClick={() => setPlant(p)} style={{ ...tabBtn, ...(plant === p ? tabBtnActive : {}) }}>{PLANT_LABEL[p]}</button>
            ))}
          </div>
          <a href={downloadUrl} style={{ ...tabBtn, marginLeft: "auto", textDecoration: "none", display: "inline-block" }}>Download landscape PDF</a>
        </div>

        {error && <div style={{ marginBottom: 12, fontSize: 12.5, color: "#a30000" }}>{error}</div>}
        {loading && <div style={{ marginBottom: 12, fontSize: 12.5, color: "#888" }}>Loading…</div>}

        {report && (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <StatCard label="Total Production" value={`${fmt(report.overall.production)} kg`} />
              <StatCard label="Total Amount" value={`₹ ${fmtMoney(report.overall.amount)}`} />
              <StatCard label="Total Balance" value={`₹ ${fmtMoney(report.overall.balance)}`} />
            </div>

            <div style={{ border: "1.5px solid #000", borderRadius: 10, padding: "12px 16px", marginBottom: 4, background: "#fff" }}>
              <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase" }}>{PLANT_LABEL[plant]} — {MONTHS[month - 1]} {year}</div>
              <div style={{ fontSize: 11.5, color: "#666", fontFamily: "monospace", marginTop: 2 }}>
                Rate {report.rate.toFixed(2)}/kg · Deduction — both shifts {fmt(report.dedBoth)}, one shift {fmt(report.dedOne)}
              </div>
            </div>

            <div style={{ border: "1px solid #000", borderRadius: 10, overflow: "hidden", marginTop: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["Date", "Shift A", "Shift B", "Total Production", "Total Amount", "Balance"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {report.rows.map((r, i) => (
                    <tr key={r.day} style={{ background: i % 2 ? "#f7f7f5" : "#fff" }}>
                      <td style={{ ...tdStyle, textAlign: "left", fontWeight: 700 }}>{r.date}</td>
                      <td style={tdStyle}>{r.shiftA === null ? "—" : fmt(r.shiftA)}</td>
                      <td style={tdStyle}>{r.shiftB === null ? "—" : fmt(r.shiftB)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{fmt(r.totalProduction)}</td>
                      <td style={tdStyle}>{fmtMoney(r.totalAmount)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, background: "#f0efe9" }}>{fmtMoney(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showSettings && (
        <SettingsPanel passcode={passcode} onClose={() => setShowSettings(false)} onPasscodeChanged={setPasscode} />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1.5px solid #000", borderRadius: 10, padding: "16px 20px", flex: 1, background: "#fff" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#888" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "monospace", marginTop: 6 }}>{value}</div>
    </div>
  );
}

function SettingsPanel({ passcode, onClose, onPasscodeChanged }: { passcode: string; onClose: () => void; onPasscodeChanged: (p: string) => void }) {
  const [oldRate, setOldRate] = useState("2.10");
  const [oldDed, setOldDed] = useState("4025");
  const [newRate, setNewRate] = useState("2.75");
  const [newDed, setNewDed] = useState("3760");
  const [curPass, setCurPass] = useState(passcode);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const saveCalc = async () => {
    try {
      await postJson("/api/update-settings", {
        currentPasscode: curPass,
        oldRp: { rate: Number(oldRate), dedBoth: Number(oldDed) },
        newRp: { rate: Number(newRate), dedBoth: Number(newDed) },
      });
      setMsg("Calculation rules updated ✓"); setErr("");
    } catch (e: any) { setErr(e.message); }
  };

  const savePassword = async () => {
    if (newPass !== confirmPass) { setErr("New password and confirm don't match."); return; }
    try {
      await postJson("/api/update-settings", { currentPasscode: curPass, newPasscode: newPass });
      onPasscodeChanged(newPass);
      setCurPass(newPass);
      setMsg("Password changed ✓"); setErr("");
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 440, maxHeight: "85vh", overflowY: "auto", background: "#fff", border: "2px solid #000", borderRadius: 12, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Admin settings</div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
        <div style={labelStyle}>Old RP — rate</div>
        <input value={oldRate} onChange={(e) => setOldRate(e.target.value)} style={inputStyle} />
        <div style={labelStyle}>Old RP — deduction (both shifts)</div>
        <input value={oldDed} onChange={(e) => setOldDed(e.target.value)} style={inputStyle} />
        <div style={labelStyle}>New RP — rate</div>
        <input value={newRate} onChange={(e) => setNewRate(e.target.value)} style={inputStyle} />
        <div style={labelStyle}>New RP — deduction (both shifts)</div>
        <input value={newDed} onChange={(e) => setNewDed(e.target.value)} style={inputStyle} />
        <button onClick={saveCalc} style={primaryBtnStyle}>Save calculation rules</button>

        <div style={{ borderTop: "1px dashed #999", margin: "18px 0 14px" }} />

        <div style={labelStyle}>Current password</div>
        <input value={curPass} onChange={(e) => setCurPass(e.target.value)} maxLength={6} style={inputStyle} />
        <div style={labelStyle}>New password (6 digits)</div>
        <input value={newPass} onChange={(e) => setNewPass(e.target.value)} maxLength={6} style={inputStyle} />
        <div style={labelStyle}>Confirm new password</div>
        <input value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} maxLength={6} style={inputStyle} />
        {err && <div style={{ color: "#a30000", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <button onClick={savePassword} style={primaryBtnStyle}>Save new password</button>
        {msg && <div style={{ marginTop: 10, fontWeight: 700, fontSize: 12.5, textAlign: "center" }}>{msg}</div>}
      </div>
    </div>
  );
}

const headerBtn: React.CSSProperties = { background: "transparent", border: "1px solid #555", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
const labelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#888", marginBottom: 6 };
const selectStyle: React.CSSProperties = { border: "1px solid #000", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 700, background: "#fff", minWidth: 140 };
const tabBtn: React.CSSProperties = { border: "1px solid #000", borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, background: "#fff", cursor: "pointer" };
const tabBtnActive: React.CSSProperties = { background: "#000", color: "#fff" };
const thStyle: React.CSSProperties = { background: "#000", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "10px 12px", textAlign: "right" };
const tdStyle: React.CSSProperties = { fontSize: 12.5, fontFamily: "monospace", padding: "8px 12px", textAlign: "right", borderBottom: "1px solid #eee" };
const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #000", borderRadius: 6, padding: "8px 8px", fontSize: 13, fontWeight: 700, marginBottom: 10 };
const primaryBtnStyle: React.CSSProperties = { width: "100%", background: "#000", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 700, cursor: "pointer" };
