import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import DateListScreen from "../screens/DateListScreen";
import DateDetailScreen from "../screens/DateDetailScreen";
import WastageEntryScreen from "../screens/WastageEntryScreen";
import ProductionEntryScreen from "../screens/ProductionEntryScreen";
import GranulesEntryScreen from "../screens/GranulesEntryScreen";
import WastageReportSetupScreen from "../screens/WastageReportSetupScreen";
import WastageReportSheetScreen from "../screens/WastageReportSheetScreen";
import AdminPasscodeScreen from "../screens/AdminPasscodeScreen";
import AdminReportScreen from "../screens/AdminReportScreen";
import AdminSettingsScreen from "../screens/AdminSettingsScreen";

export type RootStackParamList = {
  Home: undefined;
  DateList: { plant: "oldRp" | "newRp" | "granules" };
  DateDetail: { plant: "oldRp" | "newRp"; date: string };
  WastageEntry: { plant: "oldRp" | "newRp"; date: string };
  ProductionEntry: { plant: "oldRp" | "newRp"; date: string };
  GranulesEntry: { date: string };
  WastageReportSetup: undefined;
  WastageReportSheet: { year: number; month: number; plant: "oldRp" | "newRp" };
  AdminPasscode: undefined;
  AdminReport: { passcode: string };
  AdminSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DateList" component={DateListScreen} />
        <Stack.Screen name="DateDetail" component={DateDetailScreen} />
        <Stack.Screen name="WastageEntry" component={WastageEntryScreen} />
        <Stack.Screen name="ProductionEntry" component={ProductionEntryScreen} />
        <Stack.Screen name="GranulesEntry" component={GranulesEntryScreen} />
        <Stack.Screen name="WastageReportSetup" component={WastageReportSetupScreen} />
        <Stack.Screen name="WastageReportSheet" component={WastageReportSheetScreen} />
        <Stack.Screen name="AdminPasscode" component={AdminPasscodeScreen} />
        <Stack.Screen name="AdminReport" component={AdminReportScreen} />
        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
