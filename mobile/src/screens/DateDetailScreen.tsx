import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ClipboardList, Package, Check } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { getWastageEntry, getProductionEntry } from "../api/firestore";
import { PLANT_LABEL } from "../api/schema";

type Props = NativeStackScreenProps<RootStackParamList, "DateDetail">;

export default function DateDetailScreen({ route, navigation }: Props) {
  const { plant, date } = route.params;
  const [wastageSaved, setWastageSaved] = useState(false);
  const [productionSaved, setProductionSaved] = useState(false);

  useEffect(() => {
    getWastageEntry(plant, date).then((e) => setWastageSaved(!!e?.saved));
    getProductionEntry(plant, date).then((e) => setProductionSaved(!!e?.saved));
  }, [plant, date]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title={PLANT_LABEL[plant]} subtitle={date} onBack={() => navigation.goBack()} />
      <View style={{ padding: 14, gap: 10 }}>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("WastageEntry", { plant, date })}>
          <View style={styles.iconBox}><ClipboardList size={17} color="#000" /></View>
          <Text style={styles.label}>Wastage report</Text>
          {wastageSaved && <View style={styles.stamp}><Check size={11} color="#000" /><Text style={styles.stampText}>LOGGED</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("ProductionEntry", { plant, date })}>
          <View style={styles.iconBox}><Package size={17} color="#000" /></View>
          <Text style={styles.label}>Production report</Text>
          {productionSaved && <View style={styles.stamp}><Check size={11} color="#000" /><Text style={styles.stampText}>LOGGED</Text></View>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#000", borderRadius: 10, padding: 12 },
  iconBox: { width: 38, height: 38, borderWidth: 1.5, borderColor: "#000", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontWeight: "700", fontSize: 14 },
  stamp: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: "#000", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  stampText: { fontSize: 10, fontWeight: "700", fontFamily: "Courier New" },
});
