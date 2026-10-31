import {
  LIBRARY_STATUSES,
  getLocale,
  priceRegionFor,
  t,
  type GameDetails,
  type GameEntry,
  type GamePrices,
  type LibraryStatus,
} from "@gametracker/shared";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StoreMark } from "@/components/StoreMark";
import { Body, Button, Label, Loading, Message, Panel, Title } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, formatMoney, formatShortDate } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

const LINK_LABEL: Partial<Record<string, string>> = {
  steam: "Steam",
  gog: "GOG",
  epic: "Epic Games",
  playstation: "PlayStation Store",
  xbox: "Xbox Store",
};

export default function GameScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setGame(null);
    setFailed(false);
    api<GameDetails>(`/games/${encodeURIComponent(slug)}`)
      .then(setGame)
      .catch(() => setFailed(true));
  }, [slug]);

  if (failed) return <Message text={t("game.notFound")} />;
  if (!game) return <Loading />;

  const scores = [
    { label: "GameTracker", value: game.community.average == null ? "—" : game.community.average.toFixed(1) },
    { label: "Metacritic", value: game.metacriticScore == null ? "—" : String(game.metacriticScore) },
    { label: "IGDB", value: game.igdbRating == null ? "—" : game.igdbRating.toFixed(1) },
  ];
  const stores = game.links.filter((link) => LINK_LABEL[link.kind]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: game.title }} />
      <View style={styles.head}>
        {game.coverUrl ? <Image source={game.coverUrl} style={styles.cover} contentFit="cover" /> : <View style={styles.cover} />}
        <View style={{ flex: 1, gap: 6 }}>
          {game.releaseDate ? <Body muted>{formatDate(game.releaseDate)}</Body> : null}
          <Title>{game.title}</Title>
          {game.developers.length ? <Body muted>{game.developers.join(", ")}</Body> : null}
        </View>
      </View>

      <View style={styles.scores}>
        {scores.map((score) => (
          <View key={score.label} style={styles.score}>
            <Text style={styles.scoreLabel}>{score.label}</Text>
            <Text style={styles.scoreValue}>{score.value}</Text>
          </View>
        ))}
      </View>

      <EntryPanel slug={game.slug} />
      <PricePanel slug={game.slug} />

      {game.summary ? (
        <View style={{ gap: 8 }}>
          <Label>{t("game.about")}</Label>
          <Body style={{ lineHeight: 24 }}>{game.summary}</Body>
        </View>
      ) : null}

      {stores.length ? (
        <View style={{ gap: 8 }}>
          <Label>{t("game.stores")}</Label>
          {stores.map((link) => (
            <Pressable key={link.kind} onPress={() => WebBrowser.openBrowserAsync(link.url)} style={styles.row}>
              <Text style={styles.rowText}>{LINK_LABEL[link.kind]}</Text>
              <Text style={{ color: colors.muted }}>↗</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

// The signed-in player's list, rating and review for this game.
function EntryPanel({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<GameEntry | null>(null);
  const [status, setStatus] = useState<LibraryStatus | null>(null);
  const [rating, setRating] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api<GameEntry>(`/games/${encodeURIComponent(slug)}/entry`)
      .then((next) => {
        setEntry(next);
        setStatus(next.status);
        setRating(next.rating == null ? "" : String(next.rating));
      })
      .catch(() => undefined);
  }, [slug, user]);

  if (!user) {
    return (
      <Panel style={{ gap: 12 }}>
        <Label>{t("library.list")}</Label>
        <Body muted>{t("library.signInToSave")}</Body>
        <Button label={t("nav.login")} onPress={() => router.push("/profile")} />
      </Panel>
    );
  }

  async function save() {
    if (!status) return setError(t("library.chooseSection"));
    const value = rating.trim().replace(",", ".");
    const number = value ? Number(value) : null;
    if (number != null && !(Number.isFinite(number) && ((number >= 0 && number <= 10) || number === 11))) {
      return setError(t("library.ratingInvalid"));
    }
    setBusy(true);
    setError(null);
    try {
      setEntry(await api<GameEntry>(`/games/${encodeURIComponent(slug)}/entry`, { method: "PUT", body: { status, rating: number, review: entry?.review ?? null } }));
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t("library.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await api(`/games/${encodeURIComponent(slug)}/entry`, { method: "DELETE" });
      setEntry(null);
      setStatus(null);
      setRating("");
    } catch {
      setError(t("library.removeFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel style={{ gap: 12 }}>
      <Label>{t("library.section")}</Label>
      <View style={styles.chips}>
        {LIBRARY_STATUSES.map((item) => {
          const on = status === item;
          return (
            <Pressable key={item} onPress={() => setStatus(item)} style={[styles.chip, on ? { backgroundColor: colors.accent, borderColor: colors.accent } : null]}>
              <Text style={[styles.chipText, on ? { color: colors.accentInk } : null]}>{t(`status.${item}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Label>{t("library.rate")}</Label>
      <TextInput
        value={rating}
        onChangeText={setRating}
        placeholder={t("library.noRating")}
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <Body muted style={{ fontSize: 13, lineHeight: 18 }}>
        {t("library.ratingHint")}
      </Body>
      {error ? <Body style={{ color: colors.danger }}>{error}</Body> : null}
      <Button label={entry?.status ? t("common.save") : t("library.add")} onPress={save} busy={busy} />
      {entry?.status ? <Button label={t("library.remove")} onPress={remove} kind="danger" /> : null}
    </Panel>
  );
}

// Current prices in the phone's region, with the lowest price GameTracker has seen.
function PricePanel({ slug }: { slug: string }) {
  const region = priceRegionFor(getLocale());
  const [prices, setPrices] = useState<GamePrices | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<GamePrices>(`/games/${encodeURIComponent(slug)}/prices?region=${region}`)
      .then(setPrices)
      .catch(() => setFailed(true));
  }, [slug, region]);

  if (failed) return null;
  return (
    <Panel style={{ gap: 10 }}>
      <Label>{t("prices.title")}</Label>
      <Body muted style={{ fontSize: 13 }}>
        {t(region === "us" ? "prices.regionUs" : "prices.regionUa")}
      </Body>
      {!prices ? (
        <Body muted>{t("prices.loading")}</Body>
      ) : prices.stores.length === 0 ? (
        <Body muted>{t("prices.none")}</Body>
      ) : (
        prices.stores.map((price) => (
          <Pressable key={price.store} onPress={() => WebBrowser.openBrowserAsync(price.url)} style={styles.priceRow}>
            <StoreMark store={price.store} size={32} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{t(`prices.${price.store}`)}</Text>
              <Text style={styles.priceHint}>
                {price.cut > 0 ? (price.endsAt ? t("prices.until", { date: formatShortDate(price.endsAt) }) : "") : t("prices.full")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={styles.priceValue}>{formatMoney(price.amount, price.currency)}</Text>
              {price.cut > 0 ? (
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                  <Text style={styles.cut}>−{price.cut}%</Text>
                  <Text style={styles.base}>{formatMoney(price.base, price.currency)}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))
      )}
      {prices?.lowest ? (
        <Text style={styles.lowest}>
          {t("prices.lowest", {
            price: formatMoney(prices.lowest.amount, prices.lowest.currency),
            store: t(`prices.${prices.lowest.store}`),
            date: formatShortDate(prices.lowest.seenOn),
          })}
        </Text>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 20, paddingBottom: 40 },
  head: { flexDirection: "row", gap: 16, alignItems: "flex-end" },
  cover: { width: 120, height: 160, borderRadius: 18, backgroundColor: colors.raised },
  scores: { flexDirection: "row", gap: 10 },
  score: { flex: 1, backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 12, gap: 4 },
  scoreLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  scoreValue: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.line, justifyContent: "center" },
  chipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
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
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  rowText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.raised, borderRadius: 14, padding: 10 },
  priceHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  priceValue: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  cut: { fontFamily: fonts.bold, fontSize: 12, color: colors.saleInk, backgroundColor: colors.sale, borderRadius: 6, paddingHorizontal: 5, overflow: "hidden" },
  base: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textDecorationLine: "line-through" },
  lowest: { fontFamily: fonts.bold, fontSize: 13, color: colors.amber, backgroundColor: "rgba(252,211,77,0.12)", borderRadius: 12, padding: 10 },
});
