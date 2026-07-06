import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ArrowLeft, Search, Download, Copy } from "lucide-react-native";

export default function TopBar({
  title, subtitle, onBack, onSearch, onDownload, onCopy,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSearch?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
}) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ArrowLeft size={18} color="#fff" />
        </TouchableOpacity>
      ) : <View style={{ width: 32 }} />}

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {onCopy && (
        <TouchableOpacity onPress={onCopy} style={styles.iconBtn}><Copy size={16} color="#fff" /></TouchableOpacity>
      )}
      {onSearch && (
        <TouchableOpacity onPress={onSearch} style={styles.iconBtn}><Search size={17} color="#fff" /></TouchableOpacity>
      )}
      {onDownload && (
        <TouchableOpacity onPress={onDownload} style={styles.iconBtn}><Download size={17} color="#fff" /></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: "#000", paddingTop: 50, paddingBottom: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: "#444", alignItems: "center", justifyContent: "center", marginLeft: 6 },
  title: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" },
  subtitle: { color: "#aaa", fontSize: 11, fontFamily: "Courier New", marginTop: 2 },
});
