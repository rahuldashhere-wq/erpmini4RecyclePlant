import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";

type Props = NativeStackScreenProps<RootStackParamList, "WastageReportSetup">;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function WastageReportSetupScreen({ navigation }: Props) {
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Wastage report" onBack={() => navigation.goBack()} />
      <View style={{ padding: 14 }}>
        <Text style={styles.hint}>
          Pick the month to generate a consolidated, department-wise wastage sheet — separate for Old and New RP Plant.
        </Text>
        <Text style={styles.label}>Month</Text>
        <View style={styles.pickerBox}>
          <Picker selectedValue={month} onValueChange={setMonth}>
            {MONTHS.map((m, i) => <Picker.Item key={m} label={m} value={i + 1} />)}
          </Picker>
        </View>
        <Text style={styles.label}>Year</Text>
        <View style={styles.pickerBox}>
          <Picker selectedValue={year} onValueChange={setYear}>
            {[2024, 2025, 2026, 2027].map((y) => <Picker.Item key={y} label={String(y)} value={y} />)}
          </Picker>
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("WastageReportSheet", { year, month, plant: "oldRp" })}
        >
          <Text style={styles.primaryBtnText}>Generate sheet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 11.5, color: "#666", marginBottom: 14 },
  label: { fontSize: 10.5, fontWeight: "700", color: "#888", textTransform: "uppercase", marginBottom: 6, marginTop: 10 },
  pickerBox: { borderWidth: 1, borderColor: "#000", borderRadius: 8 },
  primaryBtn: { backgroundColor: "#000", borderRadius: 8, paddingVertical: 13, alignItems: "center", marginTop: 20 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
