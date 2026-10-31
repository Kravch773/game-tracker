import { BRAND_PATHS, type BrandName, type PriceStore } from "@gametracker/shared";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

// The same marks as the site's price list: each store's logo in white, filling a badge of its own colour.
export const STORE_MARK: Record<PriceStore, { brand: BrandName; color: string }> = {
  steam: { brand: "steam", color: "#1b2838" },
  gog: { brand: "gog", color: "#86328a" },
  playstation: { brand: "ps5", color: "#0070d1" },
  xbox: { brand: "xbox-series", color: "#107c10" },
  xboxpc: { brand: "pc", color: "#0078d4" },
};

export function StoreMark({ store, size = 24 }: { store: PriceStore; size?: number }) {
  const mark = STORE_MARK[store];
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: mark.color, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24">
        <Path fill="#ffffff" d={BRAND_PATHS[mark.brand]} />
      </Svg>
    </View>
  );
}
