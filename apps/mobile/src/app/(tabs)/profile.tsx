import { t } from "@gametracker/shared";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Library } from "@/components/Library";
import { Body, Button, Label, Loading, Panel, Title } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/lib/theme";

export default function ProfileScreen() {
  const { user, ready, logout } = useAuth();
  if (!ready) return <Loading />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      {user ? (
        <Library
          username={user.username}
          header={<Button label={t("nav.logout")} onPress={logout} kind="quiet" style={{ alignSelf: "flex-end", minHeight: 40 }} />}
        />
      ) : (
        <LoginForm />
      )}
    </SafeAreaView>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login(name.trim(), password);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t("auth.loginFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Label style={{ color: colors.accent }}>{t("auth.eyebrow")}</Label>
          <Title>{t("auth.loginTitle")}</Title>
          <Body muted>{t("auth.pointLists")}</Body>
        </View>
        <Panel style={{ gap: 12 }}>
          <Label>{t("auth.loginOrUsername")}</Label>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            style={styles.input}
          />
          <Label>{t("auth.password")}</Label>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={submit}
            style={styles.input}
          />
          {error ? <Body style={{ color: colors.danger }}>{error}</Body> : null}
          <Button label={busy ? t("auth.signingIn") : t("nav.login")} onPress={submit} busy={busy} />
        </Panel>
        <Body muted style={{ textAlign: "center" }}>
          {t("auth.noProfile")}
        </Body>
        {/* Signing up asks for an emailed code, which the site already handles. */}
        <Button label={t("nav.register")} onPress={() => WebBrowser.openBrowserAsync("https://gametracker.site/register")} kind="quiet" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 20, paddingTop: 24 },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.raised,
    paddingHorizontal: 14,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
  },
});
