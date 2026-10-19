"use client";

import { t, type LibraryGame, type UserLibrary } from "@gametracker/shared";
import { useEffect, useState } from "react";
import { BacklogWheel } from "@/components/BacklogWheel";
import { FollowButton } from "@/components/FollowButton";
import { Icon } from "@/components/Icon";
import { ImportDialog } from "@/components/ImportDialog";
import { STATUS_MARK } from "@/lib/marks";
import type { IconName } from "@/components/Icon";
import { formatShortDate } from "@/lib/format";
import { PROFILE_SECTIONS, STATUS_LABELS, ratingLabel } from "@/lib/library";

const TABS = [...PROFILE_SECTIONS, "favorites"] as const;
const SCALE_KEY = "gt-profile-scale";
const SCALES = [
  "grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4",
  "grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6",
  "grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 md:grid-cols-8",
  "grid-cols-5 gap-x-2 gap-y-4 sm:grid-cols-7 lg:grid-cols-10",
] as const;

type Tab = (typeof TABS)[number];
type Sort = "added" | "release" | "rating" | "metacritic";

const SORT_LABEL = {
  added: "profile.sortAdded",
  release: "profile.sortRelease",
  rating: "profile.sortRating",
  metacritic: "profile.sortMetacritic",
} as const;

export function ProfileBoard({ library, email }: { library: UserLibrary; email: string | null }) {
  const [tab, setTab] = useState<Tab>("playing");
  const [sort, setSort] = useState<Sort>("added");
  const [scale, setScale] = useState(0);
  const [bucket, setBucket] = useState<number | null>(null);
  const [showDate, setShowDate] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [showMetacritic, setShowMetacritic] = useState(true);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const sorts: Sort[] = tab === "backlog" ? ["added", "release", "metacritic"] : ["added", "release", "rating", "metacritic"];
  const activeSort = sorts.includes(sort) ? sort : "added";
  const rated = [...library.finished, ...library.dropped].filter((game) => game.rating != null);
  const source =
    bucket == null ? (tab === "favorites" ? library.favorites : library[tab]) : rated.filter((game) => scoreBucket(game.rating ?? 0) === bucket);
  const games = sortGames(source, activeSort);
  const initial = library.user.username.slice(0, 1).toUpperCase();

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(SCALE_KEY));
    if (Number.isInteger(saved) && saved >= 0 && saved < SCALES.length) setScale(saved);
  }, []);

  function chooseTab(next: Tab) {
    setTab(next);
    setBucket(null);
    if (next === "backlog" && sort === "rating") setSort("added");
  }

  function chooseScale(next: number) {
    setScale(next);
    window.localStorage.setItem(SCALE_KEY, String(next));
  }

  return (
    <main>
      <section className="flex flex-wrap items-center gap-4">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-accent font-display text-2xl text-accent-ink">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-4xl tracking-tight">{library.user.username}</h1>
          {email ? <p className="mt-1 text-sm text-muted">{email}</p> : null}
          <p className="mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="users" className="text-sky-300" />
              {library.followers} {t("profile.followers").toLowerCase()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="user" className="text-violet-300" />
              {library.following} {t("profile.following").toLowerCase()}
            </span>
          </p>
        </div>
        {email ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink!"
            >
              {t("profile.import")}
            </button>
            <a
              href="/settings"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line px-4 text-sm font-medium text-muted hover:text-ink"
            >
              {t("nav.settings")}
            </a>
          </div>
        ) : (
          <FollowButton username={library.user.username} following={library.followedByMe} />
        )}
      </section>
      <SectionTotals library={library} tab={tab} bucket={bucket} onPick={chooseTab} />
      <Stats
        rated={rated}
        bucket={bucket}
        onPick={(next) => setBucket((current) => (current === next ? null : next))}
      />
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map((item) => {
          const count = item === "favorites" ? library.favorites.length : library[item].length;
          const label = item === "favorites" ? t("library.favorites") : STATUS_LABELS[item];
          const selected = tab === item && bucket == null;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => chooseTab(item)}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium ${
                selected ? "bg-accent text-accent-ink" : "border border-line bg-white/5 text-muted hover:text-ink"
              }`}
            >
              <Icon name={STATUS_MARK[item].icon} className={selected ? "text-accent-ink" : STATUS_MARK[item].tone} />
              {label} {count}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
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
    </main>
  );
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
          <button key={id} type="button" onClick={() => onPick(id)} className={`min-w-16 text-left ${selected ? "text-ink" : "hover:text-accent"}`}>
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
  const average = rated.reduce((sum, game) => sum + (game.rating ?? 0), 0) / rated.length;
  const counts = Array.from({ length: 12 }, (_, index) => rated.filter((game) => scoreBucket(game.rating ?? -1) === index).length);
  const max = Math.max(...counts, 1);
  return (
    <section className="mt-8">
      <p className="inline-flex items-center gap-1.5 text-sm text-muted">
        <Icon name="star" className="text-accent" />
        {t("profile.average")}
      </p>
      <p className="mt-1 font-display text-3xl text-accent">{average.toFixed(1)}</p>
      <div className="mt-4 flex items-end gap-1">
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
                className={`w-full rounded-t-md ${extra ? "bg-amber-300" : "bg-accent/80"} ${selected ? "ring-2 ring-white" : bucket == null ? "" : "opacity-40"}`}
                style={{ height: `${count === 0 ? 0 : 40 + (count / max) * 100}px` }}
              />
              <span className={`text-[10px] ${extra ? "text-amber-300" : "text-muted"}`}>{value}</span>
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
    <a href={`/games/${encodeURIComponent(game.slug)}`} className="group block">
      <span className="relative block overflow-hidden rounded-2xl border border-line bg-raised">
        {game.coverUrl ? (
          <img src={game.coverUrl} alt="" className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <span className="block aspect-[3/4] bg-line" />
        )}
        {showRating && game.rating != null ? (
          <span className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">
            {ratingLabel(game.rating)}
          </span>
        ) : null}
      </span>
      <span className={`mt-3 block font-medium group-hover:text-accent ${compact ? "line-clamp-2 text-sm" : ""}`}>{game.title}</span>
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
