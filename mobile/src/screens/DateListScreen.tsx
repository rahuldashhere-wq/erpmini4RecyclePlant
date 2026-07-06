import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, TextInput, Modal } from "react-native";
import { Calendar, Plus, Search, AlertTriangle } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import {
  listDatesForPlant, listGranuleDates, dateEntryExists, granuleDateExists,
  createBlankDateEntry, createBlankGranuleEntry,
} from "../api/firestore";
import { PLANT_LABEL } from "../api/schema";

type Props = NativeStackScreenProps<RootStackParamList, "DateList">;

export default function DateListScreen({ route, navigation }: Props) {
  const { plant } = route.params;
  const isGranules = plant === "granules";
  const label = isGranules ? "Granules Issue" : PLANT_LABEL[plant];

  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState("");
  const [dupError, setDupError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = isGranules ? await listGranuleDates() : await listDatesForPlant(plant as "oldRp" | "newRp");
    setDates(result);
    setLoading(false);
  }, [plant, isGranules]);

  useEffect(() => { load(); }, [load]);

  const filtered = dates.filter((d) => {
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const checkAndCreate = async () => {
    if (!pickedDate) return;
    const exists = isGranules ? await granuleDateExists(pickedDate) : await dateEntryExists(plant as any, pickedDate);
    if (exists) { setDupError(true); return; }
    try {
      if (isGranules) await createBlankGranuleEntry(pickedDate);
      else await createBlankDateEntry(plant as any, pickedDate);
      setModalOpen(false);
      setPickedDate("");
      setDupError(false);
      if (isGranules) navigation.navigate("GranulesEntry", { date: pickedDate });
      else navigation.navigate("DateDetail", { plant: plant as any, date: pickedDate });
    } catch (e: any) {
      Alert.alert("Couldn't create entry", e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title={label} onBack={() => navigation.goBack()} onSearch={() => setShowSearch((s) => !s)} />
      <View style={{ padding: 14, flex: 1 }}>
        {showSearch && (
          <View style={styles.searchBox}>
            <Text style={styles.searchLabel}>Search by date range</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput placeholder="From YYYY-MM-DD" value={from} onChangeText={setFrom} style={styles.dateInput} />
              <TextInput placeholder="To YYYY-MM-DD" value={to} onChangeText={setTo} style={styles.dateInput} />
            </View>
          </View>
        )}

        <TouchableOpacity onPress={() => { setModalOpen(true); setPickedDate(""); setDupError(false); }} style={styles.addBtn}>
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add new date entry</Text>
        </TouchableOpacity>

        <Text style={styles.countLabel}>{filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}</Text>

        <FlatList
          data={filtered}
          keyExtractor={(d) => d}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => isGranules
                ? navigation.navigate("GranulesEntry", { date: item })
                : navigation.navigate("DateDetail", { plant: plant as any, date: item })}
            >
              <View style={styles.iconBox}><Calendar size={16} color="#000" /></View>
              <Text style={styles.dateText}>{item}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>No dates match this range.</Text> : null}
        />
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New date entry</Text>
            <Text style={styles.modalHint}>Select the report date. Nothing loads until a date is chosen.</Text>
            <TextInput
              placeholder="YYYY-MM-DD" value={pickedDate}
              onChangeText={(t) => { setPickedDate(t); setDupError(false); }}
              style={[styles.dateInput, { width: "100%" }]}
            />
            {dupError && (
              <View style={styles.dupWarning}>
                <AlertTriangle size={14} color="#000" />
                <Text style={{ fontSize: 11.5, flex: 1 }}>Entry for this date already exists. Open it from the list instead.</Text>
              </View>
            )}
            <TouchableOpacity onPress={checkAndCreate} disabled={!pickedDate} style={[styles.primaryBtn, { opacity: pickedDate ? 1 : 0.4 }]}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={{ marginTop: 10, alignItems: "center" }}>
              <Text style={{ color: "#666" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: { borderWidth: 1, borderColor: "#000", borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: "#fafafa" },
  searchLabel: { fontSize: 10.5, fontWeight: "700", color: "#555", marginBottom: 6, textTransform: "uppercase" },
  dateInput: { flex: 1, borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 8, fontSize: 12.5, fontFamily: "Courier New" },
  addBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#000", borderRadius: 8, paddingVertical: 12 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  countLabel: { fontSize: 10.5, fontWeight: "700", color: "#888", marginVertical: 12, textTransform: "uppercase" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#000", borderRadius: 10, padding: 12, marginBottom: 8 },
  iconBox: { width: 38, height: 38, borderWidth: 1.5, borderColor: "#000", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  dateText: { fontWeight: "700", fontFamily: "Courier New" },
  empty: { textAlign: "center", color: "#999", padding: 24 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopWidth: 2, borderColor: "#000", borderRadius: 16, padding: 18 },
  modalTitle: { fontWeight: "700", fontSize: 15, marginBottom: 8 },
  modalHint: { fontSize: 11.5, color: "#666", marginBottom: 10 },
  dupWarning: { flexDirection: "row", gap: 6, backgroundColor: "#f4f4f4", borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 8, marginTop: 10 },
  primaryBtn: { backgroundColor: "#000", borderRadius: 8, paddingVertical: 13, alignItems: "center", marginTop: 14 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
