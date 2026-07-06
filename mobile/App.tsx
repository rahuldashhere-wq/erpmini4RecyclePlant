import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ensureSignedIn } from "./src/firebase";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSignedIn().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator color="#000" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#000" />
      <RootNavigator />
    </>
  );
}
