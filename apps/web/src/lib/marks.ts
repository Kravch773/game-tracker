import type { CatalogGenreId, CatalogPlatformId, HomeCollectionId, LibraryStatus } from "@gametracker/shared";
import type { IconName } from "@/components/Icon";

export type Mark = { icon: IconName; tone: string };

export const STATUS_MARK: Record<LibraryStatus | "favorites", Mark> = {
  playing: { icon: "gamepad", tone: "text-sky-300" },
  finished: { icon: "check", tone: "text-accent" },
  dropped: { icon: "close", tone: "text-rose-300" },
  backlog: { icon: "bookmark", tone: "text-amber-300" },
  favorites: { icon: "heart", tone: "text-pink-300" },
};

export const COLLECTION_MARK: Record<HomeCollectionId, Mark> = {
  popular: { icon: "flame", tone: "bg-orange-300/10 text-orange-300" },
  recent: { icon: "spark", tone: "bg-accent/10 text-accent" },
  upcoming: { icon: "calendar", tone: "bg-sky-300/10 text-sky-300" },
  rpg: { icon: "dice", tone: "bg-violet-300/10 text-violet-300" },
  shooter: { icon: "target", tone: "bg-rose-300/10 text-rose-300" },
  adventure: { icon: "compass", tone: "bg-emerald-300/10 text-emerald-300" },
  strategy: { icon: "flag", tone: "bg-amber-300/10 text-amber-300" },
  indie: { icon: "heart", tone: "bg-pink-300/10 text-pink-300" },
  racing: { icon: "wheel", tone: "bg-cyan-300/10 text-cyan-300" },
};

export const GENRE_MARK: Record<CatalogGenreId, Mark> = {
  rpg: COLLECTION_MARK.rpg,
  shooter: COLLECTION_MARK.shooter,
  adventure: COLLECTION_MARK.adventure,
  strategy: COLLECTION_MARK.strategy,
  indie: COLLECTION_MARK.indie,
  racing: COLLECTION_MARK.racing,
};

export const PLATFORM_MARK: Record<CatalogPlatformId, Mark> = {
  pc: { icon: "pc", tone: "bg-slate-300/10 text-slate-200" },
  ps5: { icon: "ps5", tone: "bg-sky-300/10 text-sky-300" },
  ps4: { icon: "ps4", tone: "bg-blue-300/10 text-blue-300" },
  "xbox-series": { icon: "xbox-series", tone: "bg-emerald-300/10 text-emerald-300" },
  "xbox-one": { icon: "xbox-one", tone: "bg-green-300/10 text-green-300" },
  switch: { icon: "switch", tone: "bg-red-300/10 text-red-300" },
};
