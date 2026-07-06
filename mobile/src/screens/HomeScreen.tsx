import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Factory, Boxes, FileText, BarChart3, ChevronRight, Lock } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Alliance Polysacks" subtitle="RP PLANT · DAILY REPORTING" />
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        <Row icon={<Factory size={18} color="#000" />} label="Old RP Plant" sub="Wastage & production entries"
          onPress={() => navigation.navigate("DateList", { plant: "oldRp" })} />
        <Row icon={<Factory size={18} color="#000" />} label="New RP Plant" sub="Wastage & production entries"
          onPress={() => navigation.navigate("DateList", { plant: "newRp" })} />
        <Row icon={<Boxes size={18} color="#000" />} label="Granules Issue" sub="Daily material issued"
          onPress={() => navigation.navigate("DateList", { plant: "granules" })} />

        <Text style={styles.sectionLabel}>Reports</Text>

        <Row icon={<FileText size={18} color="#000" />} label="Wastage Report" sub="Month-wise, plant-wise sheet"
          onPress={() => navigation.navigate("WastageReportSetup")} />
        <Row icon={<BarChart3 size={18} color="#000" />} label="Admin Report" sub="Owner-level · value & balance" lock
          onPress={() => navigation.navigate("AdminPasscode")} />
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, sub, onPress, lock }: { icon: React.ReactNode; label: string; sub: string; onPress: () => void; lock?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      {lock && <Lock size={15} color="#999" style={{ marginRight: 4 }} />}
      <ChevronRight size={18} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#000", borderRadius: 10, padding: 12 },
  iconBox: { width: 38, height: 38, borderWidth: 1.5, borderColor: "#000", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontWeight: "700", fontSize: 14 },
  rowSub: { fontSize: 11.5, color: "#666", marginTop: 1 },
  sectionLabel: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#888", marginTop: 6 },
});
