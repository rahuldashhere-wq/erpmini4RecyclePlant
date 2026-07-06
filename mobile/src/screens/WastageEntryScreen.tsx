import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { ChevronDown, Plus, X, Check } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { getWastageEntry, saveWastageEntry } from "../api/firestore";
import { WASTAGE_SCHEMA, PLANT_LABEL, emptyWastageValues } from "../api/schema";
import { buildWastageMessage } from "../api/whatsappFormat";
import { WastageValues } from "../api/types";

type Props = NativeStackScreenProps<RootStackParamList, "WastageEntry">;

const fmt = (n: number) => Math.round(Number(n) || 0).toLocaleString("en-IN");

export default function WastageEntryScreen({ route, navigation }: Props) {
  const { plant, date } = route.params;
  const schema = WASTAGE_SCHEMA[plant];

  const [values, setValues] = useState<WastageValues>(emptyWastageValues(plant));
  const [notes, setNotes] = useState("");
  const [openDept, setOpenDept] = useState(schema[0].name);
  const [addingIn, setAddingIn] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getWastageEntry(plant, date).then((entry) => {
      if (entry) { setValues(entry.values); setNotes(entry.notes); }
      setLoaded(true);
    });
  }, [plant, date]);

  const total = Object.values(values).reduce(
    (s, dep) => s + Object.values(dep).reduce((a, b) => a + (Number(b) || 0), 0), 0
  );

  const setItem = (dep: string, item: string, val: string) => {
    setValues((prev) => ({ ...prev, [dep]: { ...prev[dep], [item]: val === "" ? 0 : Number(val) } }));
  };

  const addCustomItem = (dep: string) => {
    const name = newItemName.trim();
    if (!name) return;
    setValues((prev) => ({ ...prev, [dep]: { ...prev[dep], [name]: 0 } }));
    setNewItemName("");
    setAddingIn("");
  };

  const removeItem = (dep: string, item: string) => {
    setValues((prev) => {
      const copy = { ...prev[dep] };
      delete copy[item];
      return { ...prev, [dep]: copy };
    });
  };

  const onCopy = async () => {
    const msg = buildWastageMessage(PLANT_LABEL[plant], date, schema, values, notes, total);
    await Clipboard.setStringAsync(msg);
    Alert.alert("Copied", "WhatsApp format copied to clipboard.");
  };

  const onSave = async () => {
    await saveWastageEntry({ plant, date, values, notes, saved: true });
    Alert.alert("Saved", "Wastage report saved.");
    navigation.goBack();
  };

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar
        title="Wastage report" subtitle={`${PLANT_LABEL[plant]} · ${date}`}
        onBack={() => navigation.goBack()}
        onCopy={total > 0 ? onCopy : undefined}
      />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total wastage</Text>
          <Text style={styles.totalValue}>{fmt(total)} kg</Text>
        </View>

        {schema.map((dep) => {
          const isOpen = openDept === dep.name;
          const depTotal = Object.values(values[dep.name] || {}).reduce((a, b) => a + (Number(b) || 0), 0);
          const customKeys = Object.keys(values[dep.name] || {}).filter((k) => !dep.items.includes(k));
          return (
            <View key={dep.name} style={styles.deptCard}>
              <TouchableOpacity style={styles.deptHead} onPress={() => setOpenDept(isOpen ? "" : dep.name)}>
                <Text style={styles.deptName}>{dep.name}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.deptTotal}>{fmt(depTotal)} kg</Text>
                  <ChevronDown size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              {isOpen && (
                <View style={{ padding: 12 }}>
                  {dep.items.map((item) => (
                    <View key={item} style={styles.itemRow}>
                      <Text style={styles.itemLabel}>{item}</Text>
                      <TextInput
                        keyboardType="numeric" style={styles.numInput}
                        value={String(values[dep.name]?.[item] ?? 0)}
                        onChangeText={(t) => setItem(dep.name, item, t)}
                      />
                    </View>
                  ))}
                  {customKeys.map((item) => (
                    <View key={item} style={styles.itemRow}>
                      <Text style={styles.itemLabel}>{item}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <TextInput
                          keyboardType="numeric" style={styles.numInput}
                          value={String(values[dep.name]?.[item] ?? 0)}
                          onChangeText={(t) => setItem(dep.name, item, t)}
                        />
                        <TouchableOpacity onPress={() => removeItem(dep.name, item)} style={styles.smallBtn}>
                          <X size={12} color="#000" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {addingIn === dep.name ? (
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
                      <TextInput
                        placeholder="New wastage item name" value={newItemName} onChangeText={setNewItemName}
                        style={styles.textRowInput} autoFocus
                      />
                      <TouchableOpacity onPress={() => addCustomItem(dep.name)} style={styles.smallBtn}><Check size={14} color="#000" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setAddingIn(""); setNewItemName(""); }} style={styles.smallBtn}><X size={14} color="#000" /></TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setAddingIn(dep.name)} style={styles.addItemBtn}>
                      <Plus size={14} color="#000" />
                      <Text style={{ fontWeight: "700", fontSize: 12.5 }}>Add wastage item</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <Text style={styles.notesLabel}>Notes (optional)</Text>
        <TextInput
          multiline value={notes} onChangeText={setNotes} placeholder="Any remark for this report..."
          style={styles.notesInput}
        />

        <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save wastage report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  totalBanner: { flexDirection: "row", justifyContent: "space-between", borderWidth: 1.5, borderColor: "#000", borderRadius: 8, padding: 12, backgroundColor: "#f6f6f4" },
  totalLabel: { fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  totalValue: { fontWeight: "700", fontSize: 15, fontFamily: "Courier New" },
  deptCard: { borderWidth: 1, borderColor: "#000", borderRadius: 8, marginTop: 10, overflow: "hidden" },
  deptHead: { backgroundColor: "#000", padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deptName: { color: "#fff", fontWeight: "700", fontSize: 12.5, textTransform: "uppercase" },
  deptTotal: { color: "rgba(255,255,255,0.85)", fontFamily: "Courier New", fontSize: 12 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderColor: "#eee" },
  itemLabel: { fontSize: 12.5 },
  numInput: { borderWidth: 1, borderColor: "#000", borderRadius: 4, width: 80, textAlign: "right", fontFamily: "Courier New", fontWeight: "700", paddingVertical: 4, paddingHorizontal: 6 },
  smallBtn: { width: 28, height: 28, borderWidth: 1, borderColor: "#000", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  textRowInput: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 7, fontSize: 12.5 },
  addItemBtn: { flexDirection: "row", gap: 6, alignItems: "center", borderWidth: 1, borderColor: "#000", borderStyle: "dashed", borderRadius: 8, padding: 8, marginTop: 10, alignSelf: "flex-start" },
  notesLabel: { fontSize: 10.5, fontWeight: "700", color: "#888", textTransform: "uppercase", marginTop: 16, marginBottom: 6 },
  notesInput: { borderWidth: 1, borderColor: "#000", borderRadius: 8, padding: 10, minHeight: 60, fontSize: 12.5, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#000", borderRadius: 8, paddingVertical: 13, alignItems: "center", marginTop: 16, marginBottom: 30 },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});
