import { Manrope_500Medium, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { Unbounded_600SemiBold } from "@expo-google-fonts/unbounded";
import { setLocale } from "@gametracker/shared";
import { useFonts } from "expo-font";
import { getLocales } from "expo-localization";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth";
import { colors, fonts } from "@/lib/theme";

// English for phones set to English, Ukrainian for everyone else, as on the site; prices follow the language.
setLocale(getLocales()[0]?.languageCode === "en" ? "en" : "uk");
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ Manrope_500Medium, Manrope_700Bold, Unbounded_600SemiBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.bold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/[slug]" options={{ title: "" }} />
        <Stack.Screen name="user/[username]" options={{ title: "" }} />
      </Stack>
    </AuthProvider>
  );
}
