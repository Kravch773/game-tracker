import {
  getLocale,
  priceRegionFor,
  t,
  type LibraryGame,
  type LibraryPrices,
  type PriceRegion,
  type StorePrice,
  type UserLibrary,
} from "@gametracker/shared";
import { useEffect, useState, type ReactElement } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GameTile } from "@/components/GameTile";
import { Loading, Message, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

const LISTS = ["playing", "backlog", "finished", "dropped", "favorites"] as const;
type List = (typeof LISTS)[number];
const GAP = 14;
const PAD = 16;
const REGION_CURRENCY: Record<PriceRegion, string> = { ua: "UAH", us: "USD" };

// Someone's lists as on their profile page: a list at a time, each game with its rating and lowest price.
export function Library({ username, header }: { username: string; header?: ReactElement }) {
  const { width } = useWindowDimensions();
  const tile = (width - PAD * 2 - GAP) / 2;
  const region = priceRegionFor(getLocale());
  const [library, setLibrary] = useState<UserLibrary | null>(null);
  const [prices, setPrices] = useState<Record<string, StorePrice[]>>({});
  const [list, setList] = useState<List>("playing");
  const [failed, setFailed] = useState(false);

  function load() {
    setFailed(false);
    api<UserLibrary>(`/users/${encodeURIComponent(username)}`)
      .then(setLibrary)
      .catch(() => setFailed(true));
    api<LibraryPrices>(`/users/${encodeURIComponent(username)}/prices?region=${region}`)
      .then((payload) => setPrices(payload.games))
      .catch(() => undefined);
  }
  useEffect(load, [username, region]);

  if (failed) return <Message text={t("profile.notFound")} action={{ label: t("common.retry"), onPress: load }} />;
  if (!library) return <Loading />;
  const games = library[list];

  return (
    <FlatList
      data={games}
      keyExtractor={(game) => game.id}
      numColumns={2}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ padding: PAD, gap: 22, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          {header}
          <Title>{library.user.username}</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {LISTS.map((item) => {
              const on = item === list;
              return (
                <Pressable key={item} onPress={() => setList(item)} style={[styles.tab, on ? styles.tabOn : null]}>
                  <Text style={[styles.tabText, on ? { color: colors.bg } : null]}>
                    {item === "favorites" ? t("library.favorites") : t(`status.${item}`)} {library[item].length}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{t("library.empty")}</Text>}
      renderItem={({ item }) => <GameTile game={item} width={tile} rating={ratingOf(item, list)} price={lowest(prices[item.id], region)} />}
    />
  );
}

function ratingOf(game: LibraryGame, list: List): number | null {
  return list === "backlog" ? null : game.rating;
}

// The site's rule: the region's own currency first, then the lower price.
function lowest(prices: StorePrice[] | undefined, region: PriceRegion): StorePrice | null {
  if (!prices?.length) return null;
  const local = (price: StorePrice) => (price.currency === REGION_CURRENCY[region] ? 0 : 1);
  return [...prices].sort((a, b) => local(a) - local(b) || a.amount - b.amount)[0];
}

const styles = StyleSheet.create({
  tab: { height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, justifyContent: "center" },
  tabOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  empty: { fontFamily: fonts.body, color: colors.muted, paddingVertical: 24 },
});
