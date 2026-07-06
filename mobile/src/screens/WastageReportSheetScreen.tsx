import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { getWastageMonth } from "../api/firestore";
import { wastagePdfUrl } from "../api/adminFunctions";
import { WASTAGE_SCHEMA, PLANT_LABEL } from "../api/schema";
import { PlantKey } from "../api/types";

type Props = NativeStackScreenProps<RootStackParamList, "WastageReportSheet">;
const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-IN");

export default function WastageReportSheetScreen({ route, navigation }: Props) {
  const { year, month } = route.params;
  const [plant, setPlant] = useState<PlantKey>(route.params.plant);
  const [rows, setRows] = useState<{ date: string; deptTotals: number[]; rowTotal: number }[]>([]);
  const [downloading, setDownloading] = useState(false);
  const schema = WASTAGE_SCHEMA[plant];

  useEffect(() => {
    getWastageMonth(plant, year, month).then((data) => {
      setRows(data.map(({ date, entry }) => {
        const deptTotals = schema.map((dep) =>
          Object.values(entry?.values?.[dep.name] || {}).reduce((s, v) => s + (Number(v) || 0), 0)
        );
        return { date, deptTotals, rowTotal: deptTotals.reduce((a, b) => a + b, 0) };
      }));
    });
  }, [plant, year, month]);

  const grandTotal = rows.reduce((s, r) => s + r.rowTotal, 0);

  const onDownload = async () => {
    setDownloading(true);
    try {
      await Linking.openURL(wastagePdfUrl(plant, year, month));
    } catch (e: any) {
      Alert.alert("Couldn't open PDF", e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Wastage report" subtitle={`${month}/${year}`} onBack={() => navigation.goBack()} onDownload={onDownload} />
      <View style={{ padding: 14, flex: 1 }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {(["oldRp", "newRp"] as const).map((p) => (
            <TouchableOpacity key={p} onPress={() => setPlant(p)} style={[styles.tab, plant === p && styles.tabActive]}>
              <Text style={[styles.tabText, plant === p && { color: "#fff" }]}>{PLANT_LABEL[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{PLANT_LABEL[plant]} — Wastage — {month}/{year}</Text>
          <Text style={styles.summarySub}>Month total {fmt(grandTotal)} kg{downloading ? " · preparing PDF…" : ""}</Text>
        </View>

        <ScrollView horizontal style={{ marginTop: 10 }}>
          <View>
            <View style={styles.headerRow}>
              <Text style={[styles.th, { width: 78 }]}>Date</Text>
              {schema.map((d) => <Text key={d.name} style={[styles.th, { width: 84 }]}>{d.name}</Text>)}
              <Text style={[styles.th, { width: 90, backgroundColor: "#222" }]}>Total</Text>
            </View>
            <ScrollView style={{ maxHeight: 480 }}>
              {rows.map((r, i) => (
                <View key={r.date} style={[styles.row, { backgroundColor: i % 2 ? "#f7f7f5" : "#fff" }]}>
                  <Text style={[styles.td, { width: 78, fontWeight: "700" }]}>{r.date.slice(8)}</Text>
                  {r.deptTotals.map((v, di) => <Text key={di} style={[styles.td, { width: 84 }]}>{fmt(v)}</Text>)}
                  <Text style={[styles.td, { width: 90, fontWeight: "700", backgroundColor: "#f0efe9" }]}>{fmt(r.rowTotal)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, paddingVertical: 9, alignItems: "center" },
  tabActive: { backgroundColor: "#000" },
  tabText: { fontWeight: "700", fontSize: 12.5 },
  summaryBox: { borderWidth: 1.5, borderColor: "#000", borderRadius: 8, padding: 12, backgroundColor: "#f6f6f4" },
  summaryTitle: { fontWeight: "700", fontSize: 13, textTransform: "uppercase" },
  summarySub: { fontSize: 11, color: "#666", fontFamily: "Courier New", marginTop: 2 },
  headerRow: { flexDirection: "row", backgroundColor: "#000" },
  th: { color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase", padding: 8, textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
  td: { fontSize: 11.5, fontFamily: "Courier New", padding: 7, textAlign: "right" },
});
