import { t, type GameSearchResponse, type GameSummary, type HomeResponse } from "@gametracker/shared";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GameTile } from "@/components/GameTile";
import { Body, Label, Loading, Message, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

const GAP = 14;
const PAD = 16;

// The catalog: a search over the whole catalog, and the site's home collections while nothing is typed.
export default function CatalogScreen() {
  const [query, setQuery] = useState("");
  const typed = query.trim();
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("home.queryLabel")}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {query ? <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => setQuery("")} /> : null}
      </View>
      {typed.length >= 2 ? <Results query={typed} /> : <Collections />}
    </SafeAreaView>
  );
}

function Results({ query }: { query: string }) {
  const { width } = useWindowDimensions();
  const tile = (width - PAD * 2 - GAP) / 2;
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [more, setMore] = useState(false);
  const latest = useRef(query);

  // Typing settles for a moment before the catalog is asked.
  useEffect(() => {
    latest.current = query;
    setFailed(false);
    const timer = setTimeout(() => {
      api<GameSearchResponse>(`/games?q=${encodeURIComponent(query)}`)
        .then((payload) => {
          if (latest.current !== query) return;
          setGames(payload.games);
          setHasMore(payload.hasMore);
        })
        .catch(() => latest.current === query && setFailed(true));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  function loadMore() {
    if (!games || more || !hasMore) return;
    setMore(true);
    api<GameSearchResponse>(`/games?q=${encodeURIComponent(query)}&offset=${games.length}`)
      .then((payload) => {
        if (latest.current !== query) return;
        const seen = new Set(games.map((game) => game.id));
        setGames([...games, ...payload.games.filter((game) => !seen.has(game.id))]);
        setHasMore(payload.hasMore);
      })
      .catch(() => undefined)
      .finally(() => setMore(false));
  }

  if (failed) return <Message text={t("home.apiFailed")} />;
  if (!games) return <Loading />;
  if (games.length === 0) return <Message text={t("home.nothing")} />;
  return (
    <FlatList
      data={games}
      keyExtractor={(game) => game.id}
      numColumns={2}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ padding: PAD, gap: 22 }}
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => <GameTile game={item} width={tile} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
      ListFooterComponent={more ? <Loading /> : null}
    />
  );
}

function Collections() {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [failed, setFailed] = useState(false);

  function load() {
    setFailed(false);
    api<HomeResponse>("/collections")
      .then(setHome)
      .catch(() => setFailed(true));
  }
  useEffect(load, []);

  if (failed) return <Message text={t("home.unavailable")} action={{ label: t("common.retry"), onPress: load }} />;
  if (!home) return <Loading />;
  const rows = [
    ...(home.playing?.length ? [{ id: "playing", title: t("status.playing"), games: home.playing }] : []),
    ...home.collections.map((collection) => ({ id: collection.id, title: t(`collections.${collection.id}`), games: collection.games })),
  ];
  return (
    <ScrollView contentContainerStyle={{ paddingVertical: PAD, gap: 28 }} keyboardDismissMode="on-drag">
      <View style={{ paddingHorizontal: PAD, gap: 6 }}>
        <Label style={{ color: colors.accent }}>{t("home.eyebrow")}</Label>
        <Title>{t("home.title")}</Title>
        <Body muted>{t("home.lead")}</Body>
      </View>
      {rows.map((row) => (
        <View key={row.id} style={{ gap: 12 }}>
          <Label style={{ paddingHorizontal: PAD }}>{row.title}</Label>
          <FlatList
            horizontal
            data={row.games}
            keyExtractor={(game) => game.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: PAD, gap: 12 }}
            renderItem={({ item }) => <GameTile game={item} width={128} />}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: PAD,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 16 },
});

