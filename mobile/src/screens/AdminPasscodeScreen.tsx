import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Lock } from "lucide-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import TopBar from "../components/TopBar";
import { verifyAdminPasscode } from "../api/adminFunctions";

type Props = NativeStackScreenProps<RootStackParamList, "AdminPasscode">;

export default function AdminPasscodeScreen({ navigation }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    setChecking(true);
    try {
      const ok = await verifyAdminPasscode(code);
      if (ok) navigation.replace("AdminReport", { passcode: code });
      else setError("Incorrect passcode. Try again.");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TopBar title="Admin report" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.iconBox}><Lock size={20} color="#000" /></View>
        <Text style={styles.title}>This report is protected</Text>
        <Text style={styles.subtitle}>Enter the 6-digit admin passcode to continue.</Text>
        <TextInput
          value={code}
          onChangeText={(t) => { setCode(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          keyboardType="number-pad" maxLength={6} secureTextEntry
          style={styles.codeInput}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity onPress={submit} disabled={checking || code.length !== 6} style={[styles.btn, { opacity: checking || code.length !== 6 ? 0.5 : 1 }]}>
          <Text style={styles.btnText}>{checking ? "Checking…" : "Unlock"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 28, alignItems: "center" },
  iconBox: { width: 46, height: 46, borderWidth: 1.5, borderColor: "#000", borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontWeight: "700", fontSize: 14, marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 18, textAlign: "center" },
  codeInput: { width: 160, textAlign: "center", letterSpacing: 10, fontSize: 20, fontWeight: "700", fontFamily: "Courier New", borderWidth: 1.5, borderColor: "#000", borderRadius: 8, paddingVertical: 10 },
  error: { marginTop: 10, fontSize: 12, color: "#a30000" },
  btn: { backgroundColor: "#000", borderRadius: 8, paddingVertical: 13, paddingHorizontal: 40, marginTop: 20 },
  btnText: { color: "#fff", fontWeight: "700" },
});
