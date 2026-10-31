import { t } from "@gametracker/shared";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { colors, fonts } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("nav.catalog"), tabBarIcon: ({ color, size }) => <Ionicons name="game-controller-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("nav.library"), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
