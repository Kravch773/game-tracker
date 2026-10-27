"use client";

import { t, type GameSeries, type LibraryStatus, type SeriesGame, type UserSeries } from "@gametracker/shared";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/config";
import { STATUS_LABELS } from "@/lib/library";
import type { Design } from "@/lib/look-cookie";

type Filter = "all" | "progress" | "closed" | "dropped";
type Sort = "progress" | "size" | "rating" | "name";
type Slot = LibraryStatus | "missing";

const SLOTS: Slot[] = ["finished", "playing", "backlog", "dropped", "missing"];
const SLOT_COLOR: Record<Slot, string> = {
  finished: "var(--color-accent)",
  playing: "var(--color-tile-mint)",
  backlog: "var(--color-tile-sky)",
  dropped: "var(--color-tile-coral)",
  missing: "color-mix(in srgb, var(--color-muted) 45%, transparent)",
};
const FILTERS = [
  { id: "all", label: "profile.seriesFilterAll" },
  { id: "progress", label: "profile.seriesFilterProgress" },
  { id: "closed", label: "profile.seriesFilterClosed" },
  { id: "dropped", label: "profile.seriesFilterDropped" },
] as const satisfies readonly { id: Filter; label: string }[];
const SORTS = [
  { id: "progress", label: "profile.seriesSortProgress" },
  { id: "size", label: "profile.seriesSortSize" },
  { id: "rating", label: "profile.seriesSortRating" },
  { id: "name", label: "profile.seriesSortName" },
] as const satisfies readonly { id: Sort; label: string }[];

type Summary = {
  series: GameSeries;
  games: SeriesGame[];
  counts: Record<Slot, number>;
  done: number;
  total: number;
  missing: number;
  closed: boolean;
  average: number | null;
  years: string;
};

function slotOf(game: SeriesGame): Slot {
  return game.status ?? "missing";
}

function summarize(series: GameSeries, showMissing: boolean): Summary {
  const games = showMissing ? series.games : series.games.filter((game) => game.status != null);
  const counts = Object.fromEntries(SLOTS.map((slot) => [slot, 0])) as Record<Slot, number>;
  for (const game of games) counts[slotOf(game)] += 1;
  const rated = games.filter((game) => game.rating != null);
  const years = games.flatMap((game) => (game.releaseDate ? [game.releaseDate.slice(0, 4)] : []));
  return {
    series,
    games,
    counts,
    done: counts.finished,
    total: games.length,
    missing: series.games.filter((game) => game.status == null).length,
    closed: games.length > 0 && counts.finished === games.length,
    // 11 is the "extra" mark and counts as 10, as on the game page.
    average: rated.length > 0 ? rated.reduce((sum, game) => sum + Math.min(game.rating ?? 0, 10), 0) / rated.length : null,
    years: years.length === 0 ? "—" : years[0] === years[years.length - 1] ? years[0] : `${years[0]}–${years[years.length - 1]}`,
  };
}

// On a sun-yellow Shelf card the yellow "finished" colour disappears, so it turns ink there.
function colorOf(slot: Slot, sunny: boolean): string {
  return sunny && slot === "finished" ? "#1b1530" : SLOT_COLOR[slot];
}

function ringStyle(summary: Summary, sunny: boolean): string {
  let at = 0;
  const stops = SLOTS.filter((slot) => summary.counts[slot] > 0).map((slot) => {
    const from = at;
    at += (summary.counts[slot] / summary.total) * 360;
    return `${colorOf(slot, sunny)} ${from.toFixed(1)}deg ${at.toFixed(1)}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function scoreText(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}

function slotLabel(slot: Slot): string {
  return slot === "missing" ? t("profile.seriesMissing") : STATUS_LABELS[slot];
}

// The profile's "Series" tab: one card per franchise with a status ring and its games in release order.
export function SeriesBoard({ username, design }: { username: string; design: Design }) {
  const [data, setData] = useState<UserSeries | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("progress");
  const [showMissing, setShowMissing] = useState(true);
  const shelf = design === "shelf";

  useEffect(() => {
    let active = true;
    setData(null);
    setFailed(false);
    fetch(`${apiUrl}/users/${encodeURIComponent(username)}/series`)
      .then((response) => (response.ok ? (response.json() as Promise<UserSeries>) : Promise.reject(new Error(String(response.status)))))
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [username]);

  const summaries = useMemo(() => (data ? data.series.map((series) => summarize(series, showMissing)) : []), [data, showMissing]);
  const shown = useMemo(() => {
    const picked = summaries.filter((item) => {
      if (filter === "closed") return item.closed;
      if (filter === "progress") return !item.closed;
      if (filter === "dropped") return item.counts.dropped > 0;
      return true;
    });
    return [...picked].sort((left, right) => {
      if (sort === "name") return left.series.name.localeCompare(right.series.name);
      if (sort === "size") return right.total - left.total;
      if (sort === "rating") return (right.average ?? -1) - (left.average ?? -1);
      return right.done / right.total - left.done / left.total || right.total - left.total;
    });
  }, [summaries, filter, sort]);

  if (failed) return <p className="mt-6 rounded-3xl border border-dashed border-line px-5 py-12 text-center text-muted">{t("profile.seriesError")}</p>;
  if (!data) {
    return (
      <div className="mt-6" aria-busy="true">
        <p className="text-sm text-muted">{t("profile.seriesLoading")}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`h-56 animate-pulse bg-panel ${shelf ? "rounded-[32px]" : "rounded-2xl border border-line"}`} />
          ))}
        </div>
      </div>
    );
  }
  if (data.series.length === 0) {
    return <p className="mt-6 rounded-3xl border border-dashed border-line px-5 py-12 text-center text-muted">{t("profile.seriesEmpty")}</p>;
  }

  const closed = summaries.filter((item) => item.closed).length;
  const almost = summaries.filter((item) => item.total - item.done === 1).length;
  const biggest = [...summaries].sort((left, right) => right.total - left.total)[0];
  const gameCount = summaries.reduce((sum, item) => sum + item.games.filter((game) => game.status != null).length, 0);
  const stats = [
    { label: t("profile.seriesCount"), value: String(summaries.length), hint: t("profile.seriesGamesTotal", { count: gameCount }), tile: "bg-tile-lilac" },
    { label: t("profile.seriesClosed"), value: String(closed), hint: t("profile.seriesClosedHint"), tile: "bg-tile-sun" },
    { label: t("profile.seriesAlmost"), value: String(almost), hint: t("profile.seriesAlmostHint"), tile: "bg-tile-mint" },
    { label: t("profile.seriesLongest"), value: biggest ? `${biggest.done}/${biggest.total}` : "—", hint: biggest?.series.name ?? "", tile: "bg-tile-sky" },
  ];

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`min-w-0 px-4 py-3 ${shelf ? `${stat.tile} rounded-[24px] text-[#1b1530]` : "rounded-2xl border border-line bg-panel"}`}>
            <p className={`text-xs ${shelf ? "font-semibold opacity-75" : "text-muted"}`}>{stat.label}</p>
            <p className="mt-1 font-display text-2xl leading-tight">{stat.value}</p>
            <p className={`truncate text-xs ${shelf ? "opacity-75" : "text-muted"}`}>{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className={`flex flex-wrap items-center gap-2 bg-panel p-2 ${shelf ? "rounded-[28px]" : "rounded-2xl border border-line"}`}>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`h-10 rounded-full px-4 text-sm font-semibold ${
              filter === item.id ? "bg-strong text-strong-ink" : "text-muted hover:bg-raised hover:text-ink"
            }`}
          >
            {t(item.label)}
          </button>
        ))}
        <label className="ml-1 flex items-center gap-2 text-sm text-muted">
          {t("profile.sort")}
          <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="h-10 rounded-full border border-line bg-panel px-3 text-ink">
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.label)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 px-2 text-sm font-medium sm:ml-auto">
          <input type="checkbox" checked={showMissing} onChange={(event) => setShowMissing(event.target.checked)} className="h-4 w-4 accent-accent" />
          {t("profile.seriesShowMissing")}
        </label>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden="true">
        {SLOTS.filter((slot) => showMissing || slot !== "missing").map((slot) => (
          <li key={slot} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SLOT_COLOR[slot] }} />
            {slotLabel(slot)}
          </li>
        ))}
      </ul>

      {shown.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line px-5 py-12 text-center text-muted">{t("profile.seriesNone")}</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {shown.map((item) => (
            <li key={item.series.id}>
              <SeriesCard summary={item} shelf={shelf} showMissing={showMissing} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeriesCard({ summary, shelf, showMissing }: { summary: Summary; shelf: boolean; showMissing: boolean }) {
  const { series, counts, done, total, closed } = summary;
  const sunny = shelf && closed;
  const card = shelf
    ? `rounded-[32px] p-5 sm:p-6 ${sunny ? "bg-tile-sun text-[#1b1530]" : "bg-panel"}`
    : `rounded-2xl border bg-panel p-5 ${closed ? "border-accent-fg" : "border-line"}`;
  const soft = sunny ? "opacity-75" : "text-muted";
  const chip = sunny ? "bg-[#1b1530]/10" : "bg-raised";
  const meta = [t("profile.seriesMeta", { count: total, years: summary.years })];
  if (showMissing && summary.missing > 0) meta.push(t("profile.seriesMetaMissing", { count: summary.missing }));

  return (
    <article className={`flex h-full flex-col gap-4 ${card}`}>
      <div className="flex items-center gap-4">
        <span
          role="img"
          aria-label={SLOTS.filter((slot) => counts[slot] > 0)
            .map((slot) => `${slotLabel(slot)} ${counts[slot]}`)
            .join(", ")}
          className="relative h-24 w-24 shrink-0 rounded-full"
          style={{ background: ringStyle(summary, sunny) }}
        >
          <span
            className={`absolute inset-3 flex flex-col items-center justify-center rounded-full leading-none ${sunny ? "bg-tile-sun" : "bg-panel"}`}
          >
            <span className="font-display text-xl">
              {done}
              <span className={`text-xs ${soft}`}>/{total}</span>
            </span>
            <span className={`mt-1 text-[10px] ${soft}`}>{t("profile.seriesFinished")}</span>
          </span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg leading-tight">{series.name}</h3>
            {closed ? (
              <span
                className={`inline-flex h-6 items-center rounded-lg px-2 text-xs font-bold ${
                  shelf ? "bg-[#1b1530] text-tile-sun" : "bg-accent/15 text-accent-fg"
                }`}
              >
                {t("profile.seriesDone")}
              </span>
            ) : null}
          </div>
          <p className={`text-sm ${soft}`}>{meta.join(" · ")}</p>
          <ul className="flex flex-wrap gap-1.5">
            {SLOTS.filter((slot) => counts[slot] > 0).map((slot) => (
              <li key={slot} className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs ${chip}`}>
                <span className="h-2 w-2 rounded-full" style={{ background: colorOf(slot, sunny) }} />
                {slotLabel(slot)} <b>{counts[slot]}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden self-start text-right sm:block">
          <p className={`font-display text-xl ${closed && !shelf ? "text-accent-fg" : ""}`}>{Math.round((done / total) * 100)}%</p>
          {summary.average != null ? <p className={`mt-0.5 text-xs ${soft}`}>{t("profile.seriesAverage", { rating: summary.average.toFixed(1) })}</p> : null}
        </div>
      </div>
      <ol aria-label={t("profile.seriesOrder", { name: series.name })} className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-2 pb-1">
        {summary.games.map((game, index) => (
          <SeriesCover key={`${index}-${game.slug}`} game={game} sunny={sunny} />
        ))}
      </ol>
    </article>
  );
}

function SeriesCover({ game, sunny }: { game: SeriesGame; sunny: boolean }) {
  const slot = slotOf(game);
  const missing = slot === "missing";
  const href = missing ? `/?q=${encodeURIComponent(game.title)}` : `/games/${encodeURIComponent(game.slug)}`;
  const year = game.releaseDate?.slice(0, 4) ?? "TBA";
  return (
    <li className="flex w-[60px] shrink-0 flex-col gap-1.5">
      <a
        href={href}
        title={`${game.title} · ${year}`}
        aria-label={`${game.title}, ${year}: ${slotLabel(slot)}`}
        className={`relative block aspect-[3/4] rounded-[10px] ${missing ? "border-[1.5px] border-dashed border-muted/60" : ""}`}
      >
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt=""
            loading="lazy"
            className={`h-full w-full rounded-[9px] object-cover ${missing ? "opacity-25 grayscale" : slot === "dropped" ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <span className="block h-full w-full rounded-[9px] bg-raised" />
        )}
        {missing ? <span className="absolute inset-0 flex items-center justify-center text-xl text-ink">+</span> : null}
        {game.rating != null ? (
          <span
            className="absolute -top-1.5 -right-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-extrabold"
            style={{ background: colorOf(slot, sunny), color: sunny && slot === "finished" ? "var(--color-tile-sun)" : "#1b1530", boxShadow: `0 0 0 2px ${sunny ? "var(--color-tile-sun)" : "var(--color-panel)"}` }}
          >
            {scoreText(game.rating)}
          </span>
        ) : null}
      </a>
      <span className="h-1 rounded-full" style={{ background: colorOf(slot, sunny) }} />
      <span className={`text-center text-[11px] ${sunny ? "opacity-75" : "text-muted"}`}>{year}</span>
    </li>
  );
}
