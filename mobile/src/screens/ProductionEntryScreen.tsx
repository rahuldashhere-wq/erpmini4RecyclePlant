import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, Switch } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Plus, X } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { getProductionEntry, saveProductionEntry } from "../api/firestore";
import { PLANT_LABEL } from "../api/schema";
import { buildProductionMessage } from "../api/whatsappFormat";
import { ShiftData } from "../api/types";

type Props = NativeStackScreenProps<RootStackParamList, "ProductionEntry">;
const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-IN");
const uid = () => Math.random().toString(36).slice(2, 8);
const blankShift = (): ShiftData => ({ rows: [], lumps: 0, stopped: false });

export default function ProductionEntryScreen({ route, navigation }: Props) {
  const { plant, date } = route.params;
  const [shift, setShift] = useState<"A" | "B">("A");
  const [shiftA, setShiftA] = useState<ShiftData>(blankShift());
  const [shiftB, setShiftB] = useState<ShiftData>(blankShift());
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProductionEntry(plant, date).then((entry) => {
      if (entry) { setShiftA(entry.shiftA); setShiftB(entry.shiftB); setNotes(entry.notes); }
      setLoaded(true);
    });
  }, [plant, date]);

  const data = shift === "A" ? shiftA : shiftB;
  const setData = shift === "A" ? setShiftA : setShiftB;
  const shiftTotal = data.rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
  const grandTotal = shiftA.rows.reduce((s, r) => s + (Number(r.qty) || 0), 0) + shiftB.rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);

  const addRow = () => setData((d) => ({ ...d, rows: [...d.rows, { id: uid(), name: "", qty: 0 }] }));
  const updRow = (id: string, patch: Partial<{ name: string; qty: number }>) =>
    setData((d) => ({ ...d, rows: d.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const delRow = (id: string) => setData((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== id) }));

  const onCopy = async () => {
    const msg = buildProductionMessage(PLANT_LABEL[plant], date, shiftA, shiftB, notes);
    await Clipboard.setStringAsync(msg);
    Alert.alert("Copied", "WhatsApp format copied to clipboard.");
  };

  const onSave = async () => {
    await saveProductionEntry({ plant, date, shiftA, shiftB, notes, saved: true });
    Alert.alert("Saved", "Production report saved.");
    navigation.goBack();
  };

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar
        title="Production report" subtitle={`${PLANT_LABEL[plant]} · ${date}`}
        onBack={() => navigation.goBack()}
        onCopy={grandTotal > 0 ? onCopy : undefined}
      />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total production (both shifts)</Text>
          <Text style={styles.totalValue}>{fmt(grandTotal)} kg</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginVertical: 14 }}>
          {(["A", "B"] as const).map((s) => (
            <TouchableOpacity key={s} onPress={() => setShift(s)} style={[styles.shiftTab, shift === s && styles.shiftTabActive]}>
              <Text style={[styles.shiftTabText, shift === s && { color: "#fff" }]}>Shift {s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.stoppedRow}>
          <Switch value={data.stopped} onValueChange={(v) => setData((d) => ({ ...d, stopped: v }))} />
          <Text style={{ fontSize: 12.5 }}>Plant stopped this shift</Text>
        </View>

        {!data.stopped && (
          <>
            <Text style={styles.notesLabel}>Granule type</Text>
            {data.rows.map((r) => (
              <View key={r.id} style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <TextInput placeholder="e.g. JK Pro" value={r.name} onChangeText={(t) => updRow(r.id, { name: t })} style={styles.textRowInput} />
                <TextInput
                  keyboardType="numeric" style={styles.numInput}
                  value={String(r.qty)} onChangeText={(t) => updRow(r.id, { qty: t === "" ? 0 : Number(t) })}
                />
                <TouchableOpacity onPress={() => delRow(r.id)} style={styles.smallBtn}><X size={14} color="#000" /></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addRow} style={styles.addItemBtn}>
              <Plus size={14} color="#000" /><Text style={{ fontWeight: "700", fontSize: 12.5 }}>Add granule type</Text>
            </TouchableOpacity>

            <View style={styles.lumpsRow}>
              <Text style={{ fontWeight: "700", fontSize: 12.5 }}>Lumps</Text>
              <TextInput
                keyboardType="numeric" style={styles.numInput}
                value={String(data.lumps)} onChangeText={(t) => setData((d) => ({ ...d, lumps: t === "" ? 0 : Number(t) }))}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: "#666", fontSize: 12.5 }}>Shift {shift} production</Text>
              <Text style={{ fontWeight: "700", fontFamily: "Courier New" }}>{fmt(shiftTotal)} kg</Text>
            </View>
          </>
        )}

        <Text style={styles.notesLabel}>Notes (optional)</Text>
        <TextInput multiline value={notes} onChangeText={setNotes} placeholder="Any remark..." style={styles.notesInput} />

        <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save production report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  totalBanner: { flexDirection: "row", justifyContent: "space-between", borderWidth: 1.5, borderColor: "#000", borderRadius: 8, padding: 12, backgroundColor: "#f6f6f4" },
  totalLabel: { fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  totalValue: { fontWeight: "700", fontSize: 15, fontFamily: "Courier New" },
  shiftTab: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, paddingVertical: 9, alignItems: "center" },
  shiftTabActive: { backgroundColor: "#000" },
  shiftTabText: { fontWeight: "700", fontSize: 12.5 },
  stoppedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  notesLabel: { fontSize: 10.5, fontWeight: "700", color: "#888", textTransform: "uppercase", marginTop: 16, marginBottom: 6 },
  textRowInput: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 7, fontSize: 12.5 },
  numInput: { borderWidth: 1, borderColor: "#000", borderRadius: 4, width: 80, textAlign: "right", fontFamily: "Courier New", fontWeight: "700", paddingVertical: 4, paddingHorizontal: 6 },
  smallBtn: { width: 28, height: 28, borderWidth: 1, borderColor: "#000", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  addItemBtn: { flexDirection: "row", gap: 6, alignItems: "center", borderWidth: 1, borderColor: "#000", borderStyle: "dashed", borderRadius: 8, padding: 8, alignSelf: "flex-start" },
  lumpsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderColor: "#999", borderStyle: "dashed" },
  notesInput: { borderWidth: 1, borderColor: "#000", borderRadius: 8, padding: 10, minHeight: 60, fontSize: 12.5, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#000", borderRadius: 8, paddingVertical: 13, alignItems: "center", marginTop: 16, marginBottom: 30 },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});
