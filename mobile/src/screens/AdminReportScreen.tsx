import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Clipboard from "expo-clipboard";
import { Monitor, Copy, Settings as SettingsIcon } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { getAdminReport, adminPdfUrl, API_BASE } from "../api/adminFunctions";
import { PLANT_LABEL } from "../api/schema";
import { PlantKey, AdminReport as AdminReportType } from "../api/types";

type Props = NativeStackScreenProps<RootStackParamList, "AdminReport">;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-IN");
const fmtMoney = (n: number) => (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Same Cloud Functions power the standalone desktop portal at this URL —
// change once you've deployed web-admin to your own Firebase Hosting site.
// The desktop portal lives at the very same Vercel deployment as the API —
// change API_BASE in adminFunctions.ts once, and this stays correct too.
const DESKTOP_PORTAL_URL = API_BASE;

export default function AdminReportScreen({ route, navigation }: Props) {
  const { passcode } = route.params;
  const [plant, setPlant] = useState<PlantKey>("oldRp");
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);
  const [report, setReport] = useState<AdminReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminReport(passcode, plant, year, month)
      .then(setReport)
      .catch((e) => Alert.alert("Couldn't load report", e.message))
      .finally(() => setLoading(false));
  }, [plant, month, year]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(DESKTOP_PORTAL_URL);
    Alert.alert("Copied", "Desktop portal link copied.");
  };

  const onDownload = async () => {
    setDownloading(true);
    try {
      await Linking.openURL(adminPdfUrl(passcode, plant, year, month));
    } catch (e: any) {
      Alert.alert("Couldn't open PDF", e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Admin report" subtitle={`${MONTHS[month - 1]} ${year}`} onBack={() => navigation.goBack()} onDownload={onDownload} />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.portalCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Monitor size={14} color="#000" />
            <Text style={styles.portalLabel}>Desktop portal link</Text>
          </View>
          <Text style={styles.portalHint}>Open this on a computer — same passcode, same live data.</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TextInput value={DESKTOP_PORTAL_URL} editable={false} style={styles.portalUrl} />
            <TouchableOpacity onPress={copyLink} style={styles.smallBtn}><Copy size={14} color="#000" /></TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {(["oldRp", "newRp"] as const).map((p) => (
            <TouchableOpacity key={p} onPress={() => setPlant(p)} style={[styles.tab, plant === p && styles.tabActive]}>
              <Text style={[styles.tabText, plant === p && { color: "#fff" }]}>{PLANT_LABEL[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          <View style={[styles.pickerBox, { flex: 1 }]}>
            <Picker selectedValue={month} onValueChange={setMonth}>
              {MONTHS.map((m, i) => <Picker.Item key={m} label={m} value={i + 1} />)}
            </Picker>
          </View>
          <View style={[styles.pickerBox, { flex: 1 }]}>
            <Picker selectedValue={year} onValueChange={setYear}>
              {[2024, 2025, 2026, 2027].map((y) => <Picker.Item key={y} label={String(y)} value={y} />)}
            </Picker>
          </View>
        </View>

        {report && (
          <>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>{PLANT_LABEL[plant]} — Admin — {MONTHS[month - 1]} {year}</Text>
              <Text style={styles.summarySub}>
                Rate {report.rate.toFixed(2)}/kg · Both shifts {fmt(report.dedBoth)} · One shift {fmt(report.dedOne)}
                {downloading ? " · preparing PDF…" : ""}
              </Text>
            </View>

            <ScrollView horizontal style={{ marginTop: 10 }}>
              <View>
                <View style={styles.headerRow}>
                  {["Date", "Shift A", "Shift B", "Total Prod.", "Total Amount", "Balance"].map((h, i) => (
                    <Text key={h} style={[styles.th, { width: i === 0 ? 74 : 100 }]}>{h}</Text>
                  ))}
                </View>
                {report.rows.map((r, i) => (
                  <View key={r.day} style={[styles.row, { backgroundColor: i % 2 ? "#f7f7f5" : "#fff" }]}>
                    <Text style={[styles.td, { width: 74, fontWeight: "700" }]}>{r.date.slice(8)}</Text>
                    <Text style={[styles.td, { width: 100 }]}>{r.shiftA === null ? "—" : fmt(r.shiftA)}</Text>
                    <Text style={[styles.td, { width: 100 }]}>{r.shiftB === null ? "—" : fmt(r.shiftB)}</Text>
                    <Text style={[styles.td, { width: 100, fontWeight: "700" }]}>{fmt(r.totalProduction)}</Text>
                    <Text style={[styles.td, { width: 100 }]}>{fmtMoney(r.totalAmount)}</Text>
                    <Text style={[styles.td, { width: 100, fontWeight: "700", backgroundColor: "#f0efe9" }]}>{fmtMoney(r.balance)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.overallBox}>
              <Text style={styles.overallHead}>Overall total</Text>
              <View style={{ padding: 12, gap: 6 }}>
                <Row label="Total production" value={`${fmt(report.overall.production)} kg`} />
                <Row label="Total amount" value={`₹ ${fmtMoney(report.overall.amount)}`} />
                <Row label="Total balance" value={`₹ ${fmtMoney(report.overall.balance)}`} />
              </View>
            </View>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("AdminSettings")} style={styles.settingsBtn}>
          <SettingsIcon size={14} color="#000" />
          <Text style={{ fontWeight: "700", fontSize: 12.5 }}>Calculation & password settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: "#666", fontSize: 12.5 }}>{label}</Text>
      <Text style={{ fontWeight: "700", fontFamily: "Courier New" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  portalCard: { borderWidth: 1.5, borderColor: "#000", borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: "#f6f6f4" },
  portalLabel: { fontSize: 10.5, fontWeight: "700", color: "#555", textTransform: "uppercase" },
  portalHint: { fontSize: 11.5, color: "#666", marginBottom: 8 },
  portalUrl: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 8, fontFamily: "Courier New", fontSize: 11.5, backgroundColor: "#fff" },
  smallBtn: { width: 34, height: 34, borderWidth: 1, borderColor: "#000", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  tab: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, paddingVertical: 9, alignItems: "center" },
  tabActive: { backgroundColor: "#000" },
  tabText: { fontWeight: "700", fontSize: 12.5 },
  pickerBox: { borderWidth: 1, borderColor: "#000", borderRadius: 8 },
  summaryBox: { borderWidth: 1.5, borderColor: "#000", borderRadius: 8, padding: 12, backgroundColor: "#f6f6f4" },
  summaryTitle: { fontWeight: "700", fontSize: 13, textTransform: "uppercase" },
  summarySub: { fontSize: 10.5, color: "#666", fontFamily: "Courier New", marginTop: 2 },
  headerRow: { flexDirection: "row", backgroundColor: "#000" },
  th: { color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase", padding: 8, textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
  td: { fontSize: 11.5, fontFamily: "Courier New", padding: 7, textAlign: "right" },
  overallBox: { borderWidth: 1.5, borderColor: "#000", borderRadius: 8, marginTop: 14, overflow: "hidden" },
  overallHead: { backgroundColor: "#000", color: "#fff", padding: 10, fontWeight: "700", fontSize: 11.5, textTransform: "uppercase" },
  settingsBtn: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#000", borderStyle: "dashed", borderRadius: 8, padding: 10, marginTop: 16, marginBottom: 30 },
});
