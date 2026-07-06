import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { updateAdminSettings } from "../api/adminFunctions";

type Props = NativeStackScreenProps<RootStackParamList, "AdminSettings">;
const fmt = (n: number) => (Number(n) || 0).toLocaleString("en-IN");

export default function AdminSettingsScreen({ navigation }: Props) {
  const [oldRate, setOldRate] = useState("2.10");
  const [oldDed, setOldDed] = useState("4025");
  const [newRate, setNewRate] = useState("2.75");
  const [newDed, setNewDed] = useState("3760");
  const [calcPass, setCalcPass] = useState("");

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passErr, setPassErr] = useState("");

  const saveCalc = async () => {
    if (!calcPass) { Alert.alert("Current password required", "Enter the current admin passcode to save changes."); return; }
    try {
      await updateAdminSettings({
        currentPasscode: calcPass,
        oldRp: { rate: Number(oldRate) || 0, dedBoth: Number(oldDed) || 0 },
        newRp: { rate: Number(newRate) || 0, dedBoth: Number(newDed) || 0 },
      });
      Alert.alert("Saved", "Calculation rules updated — reflected in the app and the desktop portal immediately.");
      setCalcPass("");
    } catch (e: any) {
      Alert.alert("Couldn't save", e.message);
    }
  };

  const savePassword = async () => {
    if (newPass.length !== 6) { setPassErr("New password must be exactly 6 digits."); return; }
    if (newPass !== confirmPass) { setPassErr("New password and confirm password don't match."); return; }
    try {
      await updateAdminSettings({ currentPasscode: curPass, newPasscode: newPass });
      setPassErr("");
      setCurPass(""); setNewPass(""); setConfirmPass("");
      Alert.alert("Password changed", "Updated for both the app and the desktop portal.");
    } catch (e: any) {
      setPassErr(e.message ?? "Current password is incorrect.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Admin settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <Text style={styles.sectionLabel}>Calculation rules</Text>

        <View style={styles.plantBox}>
          <Text style={styles.plantTitle}>Old RP Plant</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Rate (× Total Production)</Text>
              <TextInput keyboardType="numeric" value={oldRate} onChangeText={setOldRate} style={styles.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Deduction — both shifts</Text>
              <TextInput keyboardType="numeric" value={oldDed} onChangeText={setOldDed} style={styles.input} />
            </View>
          </View>
          <Text style={styles.autoNote}>One-shift deduction (auto = half): {fmt(Number(oldDed) / 2)}</Text>
        </View>

        <View style={styles.plantBox}>
          <Text style={styles.plantTitle}>New RP Plant</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Rate (× Total Production)</Text>
              <TextInput keyboardType="numeric" value={newRate} onChangeText={setNewRate} style={styles.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Deduction — both shifts</Text>
              <TextInput keyboardType="numeric" value={newDed} onChangeText={setNewDed} style={styles.input} />
            </View>
          </View>
          <Text style={styles.autoNote}>One-shift deduction (auto = half): {fmt(Number(newDed) / 2)}</Text>
        </View>

        <Text style={styles.fieldLabel}>Current admin password (to confirm this change)</Text>
        <TextInput
          value={calcPass} onChangeText={setCalcPass} keyboardType="number-pad" maxLength={6} secureTextEntry
          style={[styles.input, { width: "100%", marginBottom: 12 }]}
        />
        <TouchableOpacity onPress={saveCalc} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Save calculation rules</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Change admin password</Text>
        <Text style={styles.hint}>Enter your current 6-digit password, then set a new one. Updates access for the app and the desktop portal at once.</Text>

        <Text style={styles.fieldLabel}>Current password</Text>
        <TextInput value={curPass} onChangeText={(t) => { setCurPass(t.replace(/\D/g, "").slice(0, 6)); setPassErr(""); }} keyboardType="number-pad" maxLength={6} secureTextEntry style={[styles.input, { width: "100%", marginBottom: 10 }]} />
        <Text style={styles.fieldLabel}>New password (6 digits)</Text>
        <TextInput value={newPass} onChangeText={(t) => { setNewPass(t.replace(/\D/g, "").slice(0, 6)); setPassErr(""); }} keyboardType="number-pad" maxLength={6} secureTextEntry style={[styles.input, { width: "100%", marginBottom: 10 }]} />
        <Text style={styles.fieldLabel}>Confirm new password</Text>
        <TextInput value={confirmPass} onChangeText={(t) => { setConfirmPass(t.replace(/\D/g, "").slice(0, 6)); setPassErr(""); }} keyboardType="number-pad" maxLength={6} secureTextEntry style={[styles.input, { width: "100%", marginBottom: 10 }]} />
        {!!passErr && <Text style={styles.error}>{passErr}</Text>}
        <TouchableOpacity onPress={savePassword} style={[styles.primaryBtn, { marginBottom: 30 }]}>
          <Text style={styles.primaryBtnText}>Save new password</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 10.5, fontWeight: "700", color: "#888", textTransform: "uppercase", marginBottom: 8 },
  hint: { fontSize: 11.5, color: "#666", marginBottom: 10 },
  plantBox: { borderWidth: 1, borderColor: "#000", borderRadius: 8, padding: 12, marginBottom: 10 },
  plantTitle: { fontWeight: "700", fontSize: 12.5, marginBottom: 8 },
  fieldLabel: { fontSize: 10.5, fontWeight: "700", color: "#888", textTransform: "uppercase", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#000", borderRadius: 6, padding: 8, fontSize: 13, fontWeight: "700" },
  autoNote: { fontSize: 11, color: "#888" },
  primaryBtn: { backgroundColor: "#000", borderRadius: 8, paddingVertical: 13, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  divider: { borderTopWidth: 1, borderColor: "#999", borderStyle: "dashed", marginVertical: 22 },
  error: { fontSize: 11.5, color: "#a30000", marginBottom: 10 },
});
