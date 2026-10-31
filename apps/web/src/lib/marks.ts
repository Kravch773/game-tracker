import type { CatalogGenreId, CatalogPlatformId, HomeCollectionId, LibraryStatus, SearchGenreId } from "@gametracker/shared";
import type { IconName } from "@/components/Icon";

export type Mark = { icon: IconName; tone: string };

export const STATUS_MARK: Record<LibraryStatus | "favorites", Mark> = {
  playing: { icon: "gamepad", tone: "text-sky-700 dark:text-sky-300" },
  finished: { icon: "check", tone: "text-accent-fg" },
  dropped: { icon: "close", tone: "text-rose-700 dark:text-rose-300" },
  backlog: { icon: "bookmark", tone: "text-amber-700 dark:text-amber-300" },
  favorites: { icon: "heart", tone: "text-pink-700 dark:text-pink-300" },
};

export const COLLECTION_MARK: Record<HomeCollectionId, Mark> = {
  popular: { icon: "flame", tone: "bg-orange-300/10 text-orange-700 dark:text-orange-300" },
  recent: { icon: "spark", tone: "bg-accent/10 text-accent-fg" },
  upcoming: { icon: "calendar", tone: "bg-sky-300/10 text-sky-700 dark:text-sky-300" },
  rpg: { icon: "dice", tone: "bg-violet-300/10 text-violet-700 dark:text-violet-300" },
  shooter: { icon: "target", tone: "bg-rose-300/10 text-rose-700 dark:text-rose-300" },
  adventure: { icon: "compass", tone: "bg-emerald-300/10 text-emerald-700 dark:text-emerald-300" },
  strategy: { icon: "flag", tone: "bg-amber-300/10 text-amber-700 dark:text-amber-300" },
  indie: { icon: "heart", tone: "bg-pink-300/10 text-pink-700 dark:text-pink-300" },
  racing: { icon: "wheel", tone: "bg-cyan-300/10 text-cyan-700 dark:text-cyan-300" },
};

export const GENRE_MARK: Record<CatalogGenreId, Mark> = {
  rpg: COLLECTION_MARK.rpg,
  shooter: COLLECTION_MARK.shooter,
  adventure: COLLECTION_MARK.adventure,
  strategy: COLLECTION_MARK.strategy,
  indie: COLLECTION_MARK.indie,
  racing: COLLECTION_MARK.racing,
};

export const SEARCH_GENRE_ICON: Record<SearchGenreId, IconName> = {
  rpg: "dice",
  shooter: "target",
  adventure: "compass",
  strategy: "flag",
  indie: "heart",
  racing: "wheel",
  fighting: "fighting",
  platform: "platform",
  puzzle: "puzzle",
  sport: "sport",
  simulator: "simulator",
  "hack-and-slash": "hack-and-slash",
  tactical: "tactical",
  rts: "rts",
  tbs: "tbs",
  music: "music",
  arcade: "arcade",
  "visual-novel": "visual-novel",
  moba: "moba",
  card: "card",
  "point-and-click": "point-and-click",
  quiz: "quiz",
  pinball: "pinball",
};

const GENRE_NAME_ICON: Record<string, IconName> = {
  "Role-playing (RPG)": "dice",
  Shooter: "target",
  Adventure: "compass",
  Strategy: "flag",
  Indie: "heart",
  Racing: "wheel",
  Fighting: "fighting",
  Platform: "platform",
  Puzzle: "puzzle",
  Sport: "sport",
  Simulator: "simulator",
  "Hack and slash/Beat 'em up": "hack-and-slash",
  Tactical: "tactical",
  "Real Time Strategy (RTS)": "rts",
  "Turn-based strategy (TBS)": "tbs",
  Music: "music",
  Arcade: "arcade",
  "Visual Novel": "visual-novel",
  MOBA: "moba",
  "Card & Board Game": "card",
  "Point-and-click": "point-and-click",
  "Quiz/Trivia": "quiz",
  Pinball: "pinball",
};

export function genreIcon(name: string): IconName | null {
  return GENRE_NAME_ICON[name] ?? null;
}

export const PLATFORM_MARK: Record<CatalogPlatformId, Mark> = {
  pc: { icon: "pc", tone: "bg-slate-300/10 text-slate-700 dark:text-slate-200" },
  ps5: { icon: "ps5", tone: "bg-sky-300/10 text-sky-700 dark:text-sky-300" },
  ps4: { icon: "ps4", tone: "bg-blue-300/10 text-blue-700 dark:text-blue-300" },
  "xbox-series": { icon: "xbox-series", tone: "bg-emerald-300/10 text-emerald-700 dark:text-emerald-300" },
  "xbox-one": { icon: "xbox-one", tone: "bg-green-300/10 text-green-700 dark:text-green-300" },
  switch: { icon: "switch", tone: "bg-red-300/10 text-red-700 dark:text-red-300" },
};
