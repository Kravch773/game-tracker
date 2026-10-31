import type { GameSummary, StorePrice } from "@gametracker/shared";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StoreMark } from "@/components/StoreMark";
import { formatMoney, ratingText } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";

// A cover with the title under it, like the site's cards; a rating sits on the top left and a price strip along
// the bottom, with the sale's cut on its corner.
export function GameTile({
  game,
  width,
  rating,
  price,
}: {
  game: GameSummary;
  width: number;
  rating?: number | null;
  price?: StorePrice | null;
}) {
  return (
    <Pressable onPress={() => router.push(`/game/${encodeURIComponent(game.slug)}`)} style={{ width }}>
      {({ pressed }) => (
        <>
          <View style={[styles.cover, { width, height: width * (4 / 3) }, pressed ? { opacity: 0.85 } : null]}>
            {game.coverUrl ? <Image source={game.coverUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : null}
            {rating != null ? (
              <View style={styles.rating}>
                <Text style={styles.ratingText}>{ratingText(rating)}</Text>
              </View>
            ) : null}
            {price ? (
              <View style={styles.strip}>
                <StoreMark store={price.store} size={22} />
                <Text numberOfLines={1} style={styles.price}>
                  {formatMoney(price.amount, price.currency)}
                </Text>
                {price.cut > 0 ? (
                  <View style={styles.cut}>
                    <Text style={styles.cutText}>−{price.cut}%</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
          <Text numberOfLines={2} style={styles.title}>
            {game.title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: { borderRadius: 16, overflow: "hidden", backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.line },
  rating: { position: "absolute", top: 8, left: 8, backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  ratingText: { fontFamily: fonts.bold, fontSize: 12, color: colors.accentInk },
  strip: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  price: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13, color: "#fff" },
  cut: { position: "absolute", top: -10, right: 6, backgroundColor: colors.sale, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  cutText: { fontFamily: fonts.bold, fontSize: 11, color: colors.saleInk },
  title: { marginTop: 8, fontFamily: fonts.bold, fontSize: 14, lineHeight: 19, color: colors.ink },
});
