"use client";

import { t, type LibraryGame, type UserLibrary } from "@gametracker/shared";
import { useEffect, useState, type ReactNode } from "react";
import { BacklogWheel } from "@/components/BacklogWheel";
import { FollowButton } from "@/components/FollowButton";
import { FollowList } from "@/components/FollowList";
import { Icon } from "@/components/Icon";
import { ImportDialog } from "@/components/ImportDialog";
import { SeriesBoard } from "@/components/SeriesBoard";
import { STATUS_MARK } from "@/lib/marks";
import type { IconName } from "@/components/Icon";
import { formatShortDate } from "@/lib/format";
import { PROFILE_SECTIONS, STATUS_LABELS, ratingLabel } from "@/lib/library";
import type { Design } from "@/lib/look-cookie";
import { myGamesListCsv } from "@/lib/mygameslist";

const TABS = [...PROFILE_SECTIONS, "favorites"] as const;
const SCALE_KEY = "gt-profile-scale";
const SCALES = [
  "grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4",
  "grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6",
  "grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 md:grid-cols-8",
  "grid-cols-5 gap-x-2 gap-y-4 sm:grid-cols-7 lg:grid-cols-10",
] as const;

type Tab = (typeof TABS)[number] | "steamWishlist" | "series";
type Sort = "added" | "release" | "rating" | "metacritic";

function isTab(value: string | undefined): value is Tab {
  return value === "steamWishlist" || value === "series" || (TABS as readonly string[]).includes(value ?? "");
}

const TAB_FILL: Record<(typeof TABS)[number], string> = {
  playing: "bg-tile-mint",
  backlog: "bg-tile-sky",
  finished: "bg-tile-sun",
  dropped: "bg-tile-coral",
  favorites: "bg-tile-rose",
};

const SORT_LABEL = {
  added: "profile.sortAdded",
  release: "profile.sortRelease",
  rating: "profile.sortRating",
  metacritic: "profile.sortMetacritic",
} as const;

export function ProfileBoard({
  library,
  email,
  initialTab,
  design = "console",
}: {
  library: UserLibrary;
  email: string | null;
  initialTab?: string;
  design?: Design;
}) {
  const [tab, setTab] = useState<Tab>(isTab(initialTab) ? initialTab : "playing");
  const [sort, setSort] = useState<Sort>("added");
  const [scale, setScale] = useState(0);
  const [bucket, setBucket] = useState<number | null>(null);
  const [showDate, setShowDate] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [showMetacritic, setShowMetacritic] = useState(true);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [list, setList] = useState<"followers" | "following" | null>(null);
  const [followers, setFollowers] = useState(library.followers);
  const [following, setFollowing] = useState(library.following);
  const sorts: Sort[] =
    tab === "backlog" || tab === "steamWishlist" ? ["added", "release", "metacritic"] : ["added", "release", "rating", "metacritic"];
  const activeSort = sorts.includes(sort) ? sort : "added";
  const rated = [...library.finished, ...library.dropped].filter((game) => game.rating != null);
  const source = tab === "series" ? [] : bucket == null ? library[tab] : rated.filter((game) => scoreBucket(game.rating ?? 0) === bucket);
  const games = sortGames(source, activeSort);
  const initial = library.user.username.slice(0, 1).toUpperCase();
  const average = rated.length > 0 ? rated.reduce((sum, game) => sum + (game.rating ?? 0), 0) / rated.length : null;
  const shelf = design === "shelf";

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(SCALE_KEY));
    if (Number.isInteger(saved) && saved >= 0 && saved < SCALES.length) setScale(saved);
  }, []);

  useEffect(() => {
    setFollowers(library.followers);
    setFollowing(library.following);
  }, [library.user.username, library.followers, library.following]);

  function chooseTab(next: Tab) {
    setTab(next);
    setBucket(null);
    if ((next === "backlog" || next === "steamWishlist") && sort === "rating") setSort("added");
  }

  function chooseScale(next: number) {
    setScale(next);
    window.localStorage.setItem(SCALE_KEY, String(next));
  }

  return (
    <main>
      <ProfileHead
        design={design}
        username={library.user.username}
        initial={initial}
        email={email}
        followers={followers}
        following={following}
        average={average}
        finished={library.finished.length}
        wishlist={library.steamWishlist.length}
        wishlistMissing={library.steamWishlistMissing}
        onList={setList}
        onImport={() => setImportOpen(true)}
        onExport={() => downloadLibrary(library)}
        follow={
          <FollowButton
            username={library.user.username}
            following={library.followedByMe}
            onChange={(next) => setFollowers((count) => Math.max(0, count + (next ? 1 : -1)))}
          />
        }
      />
      <FollowList username={library.user.username} kind={list} onClose={() => setList(null)} />
      <SectionTotals library={library} tab={tab} bucket={bucket} onPick={chooseTab} />
      <Stats
        rated={rated}
        bucket={bucket}
        onPick={(next) => setBucket((current) => (current === next ? null : next))}
      />
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {/* Series is a different view of the same games, so it leads the row in an accent pill. */}
        <button
          type="button"
          role="tab"
          aria-selected={tab === "series" && bucket == null}
          onClick={() => chooseTab("series")}
          className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${
            tab === "series" && bucket == null
              ? shelf
                ? "bg-tile-lilac text-[#1b1530] ring-2 ring-ink"
                : "bg-accent text-accent-ink"
              : shelf
                ? "bg-tile-lilac/70 text-[#1b1530] hover:bg-tile-lilac"
                : "border border-accent-fg/60 bg-accent/10 text-ink hover:bg-accent/20"
          }`}
        >
          <Icon name="layers" />
          {t("profile.series")}
        </button>
        <span aria-hidden="true" className="mx-1 w-px shrink-0 self-stretch bg-line" />
        {TABS.map((item) => {
          const count = library[item].length;
          const label = item === "favorites" ? t("library.favorites") : STATUS_LABELS[item];
          const selected = tab === item && bucket == null;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => chooseTab(item)}
              className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${
                selected
                  ? shelf
                    ? `${TAB_FILL[item]} text-[#1b1530]`
                    : "bg-strong text-strong-ink"
                  : shelf
                    ? "bg-panel hover:bg-raised"
                    : "border border-line bg-panel text-muted hover:text-ink"
              }`}
            >
              <Icon name={STATUS_MARK[item].icon} />
              {label} {count}
            </button>
          );
        })}
        {email ? (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "steamWishlist" && bucket == null}
            onClick={() => chooseTab("steamWishlist")}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium ${
              tab === "steamWishlist" && bucket == null ? "bg-accent text-accent-ink" : "border border-line bg-ink/5 text-muted hover:text-ink"
            }`}
          >
            <Icon name="steam" className={tab === "steamWishlist" && bucket == null ? "text-accent-ink" : "text-sky-700 dark:text-sky-300"} />
            {t("profile.steamWishlist")} {library.steamWishlist.length}
          </button>
        ) : null}
      </div>
      {tab === "series" && bucket == null ? (
        <SeriesBoard username={library.user.username} design={design} />
      ) : (
        <>
          <div className={`mt-4 flex flex-wrap items-center gap-3 bg-panel p-2 pl-4 ${shelf ? "rounded-[28px]" : "rounded-2xl border border-line"}`}>
            <label className="flex items-center gap-3 text-sm text-muted">
              {t("profile.sort")}
              <select
                value={activeSort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className="h-10 rounded-full border border-line bg-panel px-3 text-ink"
              >
                {sorts.map((item) => (
                  <option key={item} value={item}>
                    {t(SORT_LABEL[item])}
                  </option>
                ))}
              </select>
            </label>
            {email && tab === "steamWishlist" ? (
              <a href="/steam/wishlist" className="text-sm text-accent-ink!">
                {t("profile.steamWishlistMissingLink", { count: library.steamWishlistMissing })}
              </a>
            ) : null}
            <DisplayToggle label={t("profile.showDate")} checked={showDate} onChange={setShowDate} />
            <DisplayToggle label={t("profile.showRating")} checked={showRating} onChange={setShowRating} />
            <DisplayToggle label={t("profile.showMetacritic")} checked={showMetacritic} onChange={setShowMetacritic} />
            <label className="flex items-center gap-3 text-sm text-muted">
              {t("profile.cardSize")}
              <input
                type="range"
                min={0}
                max={SCALES.length - 1}
                step={1}
                value={scale}
                aria-label={t("profile.cardSize")}
                onChange={(event) => chooseScale(Number(event.target.value))}
              />
            </label>
            {email && tab === "backlog" && library.backlog.length > 0 ? (
              <button
                type="button"
                onClick={() => setWheelOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink!"
              >
                <Icon name="wheel" />
                {t("profile.wheel")}
              </button>
            ) : null}
          </div>
          <BacklogWheel open={wheelOpen} games={library.backlog} onClose={() => setWheelOpen(false)} />
          <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
          {games.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-line px-5 py-12 text-center text-muted">{t("library.empty")}</p>
          ) : (
            <ul className={`mt-6 grid ${SCALES[scale]}`}>
              {games.map((game) => (
                <li key={`${tab}-${bucket ?? "all"}-${game.id}`}>
                  <GameCard
                    game={game}
                    sort={activeSort}
                    showDate={showDate}
                    showRating={showRating}
                    showMetacritic={showMetacritic}
                    compact={scale >= 2}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function downloadLibrary(library: UserLibrary) {
  const games = (["playing", "finished", "dropped", "backlog"] as const).flatMap((status) =>
    library[status].map((game) => ({ game, status })),
  );
  const blob = new Blob([myGamesListCsv(games)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gametracker-${library.user.username}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function SectionTotals({
  library,
  tab,
  bucket,
  onPick,
}: {
  library: UserLibrary;
  tab: Tab;
  bucket: number | null;
  onPick: (tab: Tab) => void;
}) {
  const items: { id: Tab | "all"; label: string; icon: IconName; tone: string; count: number }[] = [
    {
      id: "all",
      label: t("collections.all"),
      icon: "layers",
      tone: "text-muted",
      count: library.playing.length + library.finished.length + library.dropped.length + library.backlog.length,
    },
    { id: "finished", label: STATUS_LABELS.finished, icon: STATUS_MARK.finished.icon, tone: STATUS_MARK.finished.tone, count: library.finished.length },
    { id: "playing", label: STATUS_LABELS.playing, icon: STATUS_MARK.playing.icon, tone: STATUS_MARK.playing.tone, count: library.playing.length },
    { id: "dropped", label: STATUS_LABELS.dropped, icon: STATUS_MARK.dropped.icon, tone: STATUS_MARK.dropped.tone, count: library.dropped.length },
    { id: "backlog", label: STATUS_LABELS.backlog, icon: STATUS_MARK.backlog.icon, tone: STATUS_MARK.backlog.tone, count: library.backlog.length },
    { id: "favorites", label: t("library.favorites"), icon: STATUS_MARK.favorites.icon, tone: STATUS_MARK.favorites.tone, count: library.favorites.length },
  ];

  return (
    <section className="mt-8 flex flex-wrap gap-x-8 gap-y-5">
      {items.map((item) => {
        const body = (
          <>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Icon name={item.icon} className={item.tone} />
              {item.label}
            </span>
            <span className="mt-1 block font-display text-2xl">{item.count}</span>
          </>
        );
        const id = item.id;
        if (id === "all") {
          return (
            <div key={id} className="min-w-16">
              {body}
            </div>
          );
        }
        const selected = bucket == null && tab === id;
        return (
          <button key={id} type="button" onClick={() => onPick(id)} className={`min-w-16 text-left ${selected ? "text-ink" : "hover:text-accent-fg"}`}>
            {body}
          </button>
        );
      })}
    </section>
  );
}

function Stats({
  rated,
  bucket,
  onPick,
}: {
  rated: LibraryGame[];
  bucket: number | null;
  onPick: (bucket: number) => void;
}) {
  if (rated.length === 0) {
    return <p className="mt-6 text-sm text-muted">{t("profile.noRatings")}</p>;
  }
  const counts = Array.from({ length: 12 }, (_, index) => rated.filter((game) => scoreBucket(game.rating ?? -1) === index).length);
  const max = Math.max(...counts, 1);
  return (
    <section className="mt-8">
      <div className="flex items-end gap-1">
        {counts.map((count, index) => {
          const value = index;
          const selected = bucket === value;
          const extra = value === 11;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              aria-label={bucketLabel(value)}
              onClick={() => onPick(value)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span
                className={`w-full rounded-t-md ${extra ? "bg-amber-300" : "bg-accent/80"} ${selected ? "ring-2 ring-ink" : bucket == null ? "" : "opacity-40"}`}
                style={{ height: `${count === 0 ? 0 : 40 + (count / max) * 100}px` }}
              />
              <span className={`text-[10px] ${extra ? "text-amber-700 dark:text-amber-300" : "text-muted"}`}>{value}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function sortGames(games: LibraryGame[], sort: Sort): LibraryGame[] {
  return [...games].sort((a, b) => {
    if (sort === "rating") return compareNumber(a.rating, b.rating);
    if (sort === "metacritic") return compareNumber(a.metacriticScore, b.metacriticScore);
    if (sort === "release") return compareText(a.releaseDate, b.releaseDate);
    return b.addedAt.localeCompare(a.addedAt);
  });
}

function compareNumber(left: number | null, right: number | null): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right - left;
}

function compareText(left: string | null, right: string | null): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right.localeCompare(left);
}

function scoreBucket(rating: number): number {
  if (rating >= 11) return 11;
  if (rating < 1) return 0;
  return Math.min(10, Math.floor(rating));
}

function bucketLabel(bucket: number): string {
  if (bucket === 11) return "11";
  return t("profile.scoreRange", { from: `${bucket}.0`, to: `${bucket}.9` });
}

function DisplayToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex h-10 items-center gap-2 text-sm text-muted">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-accent" />
      {label}
    </label>
  );
}

function cardDate(game: LibraryGame, sort: Sort): string | null {
  if (sort === "added") return t("profile.added", { date: formatShortDate(game.addedAt) });
  if (sort === "release") {
    return t("profile.released", { date: game.releaseDate ? formatShortDate(game.releaseDate) : t("common.unknownDate") });
  }
  return null;
}

function GameCard({
  game,
  sort,
  showDate,
  showRating,
  showMetacritic,
  compact,
}: {
  game: LibraryGame;
  sort: Sort;
  showDate: boolean;
  showRating: boolean;
  showMetacritic: boolean;
  compact: boolean;
}) {
  const when = showDate ? cardDate(game, sort) : null;
  const metacritic = game.metacriticScore == null ? "—" : String(game.metacriticScore);
  return (
    <a href={`/games/${encodeURIComponent(game.slug)}`} target="_blank" rel="noreferrer" className="group block">
      <span className="relative block overflow-hidden rounded-2xl border border-line bg-raised">
        {game.coverUrl ? (
          <img src={game.coverUrl} alt="" className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <span className="block aspect-[3/4] bg-line" />
        )}
        {(showRating && game.rating != null) || game.steamMinutes != null ? (
          <span className="absolute top-2 left-2 flex items-center gap-1">
            {showRating && game.rating != null ? (
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">
                {ratingLabel(game.rating)}
              </span>
            ) : null}
            {game.steamMinutes != null ? (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-300 text-sky-950"
                aria-label="Steam"
              >
                <Icon name="steam" className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <span className={`mt-3 block font-medium group-hover:text-accent-fg ${compact ? "line-clamp-2 text-sm" : ""}`}>{game.title}</span>
      {when ? <span className="mt-1 block text-sm text-muted">{when}</span> : null}
      {game.review && !compact ? <span className="mt-1 line-clamp-3 block text-sm leading-5 text-muted">{game.review}</span> : null}
      {showMetacritic ? (
        <span
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            game.metacriticScore == null ? "border border-line text-muted" : "bg-emerald-300 text-emerald-950"
          }`}
          aria-label={t("profile.metacriticScore", { score: metacritic })}
        >
          <Icon name="meta" className="h-3.5 w-3.5" />
          {metacritic}
        </span>
      ) : null}
    </a>
  );
}

// Name, follows and account actions, then average, finished and Steam as stat cards.
function ProfileHead({
  design,
  username,
  initial,
  email,
  followers,
  following,
  average,
  finished,
  wishlist,
  wishlistMissing,
  onList,
  onImport,
  onExport,
  follow,
}: {
  design: Design;
  username: string;
  initial: string;
  email: string | null;
  followers: number;
  following: number;
  average: number | null;
  finished: number;
  wishlist: number;
  wishlistMissing: number;
  onList: (kind: "followers" | "following") => void;
  onImport: () => void;
  onExport: () => void;
  follow: ReactNode;
}) {
  const shelf = design === "shelf";
  const pill = shelf
    ? "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold"
    : "inline-flex h-11 items-center gap-1.5 rounded-xl border border-line px-4 text-sm font-semibold hover:border-ink/25";
  const actions = email ? (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onImport} className={`${pill} ${shelf ? "bg-[#1b1530] text-white" : ""}`}>
        {t("profile.import")}
      </button>
      <button type="button" onClick={onExport} className={`${pill} ${shelf ? "border-2 border-[#1b1530]" : ""}`}>
        {t("profile.export")}
      </button>
      <a href="/settings" className={`${pill} ${shelf ? "border-2 border-[#1b1530]" : "text-muted"}`}>
        {t("nav.settings")}
      </a>
    </div>
  ) : (
    follow
  );
  const people = (
    <p className="flex flex-wrap gap-4 text-sm">
      <button type="button" onClick={() => onList("followers")} className="hover:underline">
        <b>{followers}</b> {t("profile.followers").toLowerCase()}
      </button>
      <button type="button" onClick={() => onList("following")} className="hover:underline">
        <b>{following}</b> {t("profile.following").toLowerCase()}
      </button>
    </p>
  );
  const steam = email ? (
    <div className={shelf ? "flex flex-[4_1_320px] flex-col gap-3 rounded-[32px] bg-strong p-6 text-strong-ink" : "flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5 sm:col-span-2"}>
      <p className="font-display text-lg font-bold">Steam</p>
      <p className={`text-sm ${shelf ? "text-strong-ink/75" : "text-muted"}`}>
        {t("profile.steamWishlist")}: {wishlist}
        {wishlistMissing > 0 ? (
          <>
            {" · "}
            <a href="/steam/wishlist" className={`font-semibold underline ${shelf ? "text-tile-sun" : "text-accent-fg"}`}>
              {t("profile.steamWishlistMissingLink", { count: wishlistMissing })}
            </a>
          </>
        ) : null}
      </p>
      <a href="/settings" className={`mt-auto self-start ${shelf ? "inline-flex h-11 items-center rounded-full bg-tile-sun px-5 text-sm font-bold text-[#1b1530]" : `${pill} bg-accent text-accent-ink border-transparent`}`}>
        <Icon name="steam" />
        {t("profile.steamSync")}
      </a>
    </div>
  ) : null;
  const averageText = average == null ? "—" : average.toFixed(1);

  if (shelf) {
    return (
      <section className="flex flex-wrap gap-5">
        <div className="flex flex-[5_1_420px] flex-wrap items-center gap-5 rounded-[32px] bg-tile-sun p-6 text-[#1b1530]">
          <span className="inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#1b1530] font-display text-4xl font-extrabold text-tile-sun">
            {initial}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="truncate font-display text-4xl font-extrabold">{username}</h1>
            {people}
            {actions}
          </div>
        </div>
        <div className="flex flex-[2_1_180px] flex-col justify-between gap-4 rounded-[32px] bg-tile-mint p-6 text-[#1b1530]">
          <span className="text-sm font-bold">{t("profile.average")}</span>
          <span className="font-display text-6xl leading-none font-extrabold">{averageText}</span>
          <span className="text-sm font-semibold">
            {STATUS_LABELS.finished}: {finished}
          </span>
        </div>
        {steam}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-5">
        <span className="inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-accent font-display text-4xl text-accent-ink">
          {initial}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="truncate font-display text-4xl tracking-tight">{username}</h1>
          {email ? <p className="text-sm text-muted">{email}</p> : null}
          <div className="text-muted">{people}</div>
        </div>
        {actions}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs text-muted">{t("profile.average")}</p>
          <p className="mt-1 font-display text-3xl text-accent-fg">{averageText}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs text-muted">{STATUS_LABELS.finished}</p>
          <p className="mt-1 font-display text-3xl">{finished}</p>
        </div>
        {steam}
      </div>
    </section>
  );
}
