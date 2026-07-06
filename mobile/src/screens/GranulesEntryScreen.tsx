import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Plus, X } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { getGranuleEntry, saveGranuleEntry } from "../api/firestore";
import { buildGranulesMessage } from "../api/whatsappFormat";
import { ProductionRow } from "../api/types";

type Props = NativeStackScreenProps<RootStackParamList, "GranulesEntry">;
const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-IN");
const uid = () => Math.random().toString(36).slice(2, 8);

export default function GranulesEntryScreen({ route, navigation }: Props) {
  const { date } = route.params;
  const [rows, setRows] = useState<ProductionRow[]>([]);
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getGranuleEntry(date).then((entry) => {
      if (entry) { setRows(entry.rows); setNotes(entry.notes); }
      setLoaded(true);
    });
  }, [date]);

  const total = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
  const addRow = () => setRows((r) => [...r, { id: uid(), name: "", qty: 0 }]);
  const updRow = (id: string, patch: Partial<ProductionRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const delRow = (id: string) => setRows((r) => r.filter((x) => x.id !== id));

  const onCopy = async () => {
    await Clipboard.setStringAsync(buildGranulesMessage(date, rows, notes, total));
    Alert.alert("Copied", "WhatsApp format copied to clipboard.");
  };

  const onSave = async () => {
    await saveGranuleEntry({ date, rows, notes, saved: true });
    Alert.alert("Saved", "Granules issue saved.");
    navigation.goBack();
  };

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Granules issue" subtitle={date} onBack={() => navigation.goBack()} onCopy={total > 0 ? onCopy : undefined} />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total granules issued</Text>
          <Text style={styles.totalValue}>{fmt(total)} kg</Text>
        </View>

        <Text style={styles.notesLabel}>Material issued</Text>
        {rows.map((r) => (
          <View key={r.id} style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <TextInput placeholder="e.g. White Dana" value={r.name} onChangeText={(t) => updRow(r.id, { name: t })} style={styles.textRowInput} />
            <TextInput
              keyboardType="numeric" style={styles.numInput}
              value={String(r.qty)} onChangeText={(t) => updRow(r.id, { qty: t === "" ? 0 : Number(t) })}
            />
            <TouchableOpacity onPress={() => delRow(r.id)} style={styles.smallBtn}><X size={14} color="#000" /></TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={addRow} style={styles.addItemBtn}>
          <Plus size={14} color="#000" /><Text style={{ fontWeight: "700", fontSize: 12.5 }}>Add material</Text>
        </TouchableOpacity>

        <Text style={styles.notesLabel}>Notes (optional)</Text>
        <TextInput multiline value={notes} onChangeText={setNotes} placeholder="Any remark..." style={styles.notesInput} />

        <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  totalBanner: { flexDirection: "row", justifyContent: "space-between", borderWidth: 1.5, borderColor: "#000", borderRadius: 8, padding: 12, backgroundColor: "#f6f6f4" },
  totalLabel: { fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  totalValue: { fontWeight: "700", fontSize: 15, fontFamily: "Courier New" },
  notesLabel: { fontSize: 10.5, fontWeight: "700", color: "#888", textTransform: "uppercase", marginTop: 16, marginBottom: 6 },
  textRowInput: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 7, fontSize: 12.5 },
  numInput: { borderWidth: 1, borderColor: "#000", borderRadius: 4, width: 80, textAlign: "right", fontFamily: "Courier New", fontWeight: "700", paddingVertical: 4, paddingHorizontal: 6 },
  smallBtn: { width: 28, height: 28, borderWidth: 1, borderColor: "#000", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  addItemBtn: { flexDirection: "row", gap: 6, alignItems: "center", borderWidth: 1, borderColor: "#000", borderStyle: "dashed", borderRadius: 8, padding: 8, alignSelf: "flex-start" },
  notesInput: { borderWidth: 1, borderColor: "#000", borderRadius: 8, padding: 10, minHeight: 60, fontSize: 12.5, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#000", borderRadius: 8, paddingVertical: 13, alignItems: "center", marginTop: 16, marginBottom: 30 },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});
