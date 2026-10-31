import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, muted ? { color: colors.muted } : null, style]}>{children}</Text>;
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  kind = "primary",
  busy = false,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "quiet" | "danger";
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const primary = kind === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={busy ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? { backgroundColor: colors.accent } : { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
        pressed ? { opacity: 0.8 } : null,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? colors.accentInk : colors.ink} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? colors.accentInk : kind === "danger" ? colors.danger : colors.ink }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function Message({ text, action }: { text: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.center}>
      <Body muted style={{ textAlign: "center" }}>
        {text}
      </Body>
      {action ? <Button label={action.label} onPress={action.onPress} kind="quiet" style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.5, color: colors.muted, textTransform: "uppercase" },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  panel: { backgroundColor: colors.panel, borderRadius: 20, borderWidth: 1, borderColor: colors.line, padding: 16 },
  button: { minHeight: 48, borderRadius: 999, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: fonts.bold, fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});
