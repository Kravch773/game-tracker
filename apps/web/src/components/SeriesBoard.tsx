"use client";

import { t, type GameSeries, type LibraryStatus, type SeriesGame, type UserSeries } from "@gametracker/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { formatReleaseDate } from "@/lib/format";
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
  upcoming: SeriesGame[];
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

// A game without a date, or dated after today, is not out yet.
function isReleased(game: SeriesGame, today: string): boolean {
  return game.releaseDate != null && game.releaseDate <= today;
}

// Games that are not out yet sit apart and do not count toward progress or a completed series.
function summarize(series: GameSeries, showMissing: boolean): Summary {
  const today = new Date().toISOString().slice(0, 10);
  const visible = showMissing ? series.games : series.games.filter((game) => game.status != null);
  const games = visible.filter((game) => isReleased(game, today));
  const upcoming = visible.filter((game) => !isReleased(game, today));
  const counts = Object.fromEntries(SLOTS.map((slot) => [slot, 0])) as Record<Slot, number>;
  for (const game of games) counts[slotOf(game)] += 1;
  const rated = games.filter((game) => game.rating != null);
  const years = games.flatMap((game) => (game.releaseDate ? [game.releaseDate.slice(0, 4)] : []));
  return {
    series,
    games,
    upcoming,
    counts,
    done: counts.finished,
    total: games.length,
    missing: series.games.filter((game) => game.status == null && isReleased(game, today)).length,
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
  if (summary.total === 0) return SLOT_COLOR.missing;
  let at = 0;
  const stops = SLOTS.filter((slot) => summary.counts[slot] > 0).map((slot) => {
    const from = at;
    at += (summary.counts[slot] / summary.total) * 360;
    return `${colorOf(slot, sunny)} ${from.toFixed(1)}deg ${at.toFixed(1)}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function percentOf(summary: Summary): number {
  return summary.total === 0 ? 0 : Math.round((summary.done / summary.total) * 100);
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
      return percentOf(right) - percentOf(left) || right.total - left.total;
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

function SeriesRing({ summary, sunny, size }: { summary: Summary; sunny: boolean; size: "md" | "lg" }) {
  const { counts, done, total } = summary;
  const soft = sunny ? "opacity-75" : "text-muted";
  return (
    <span
      role="img"
      aria-label={SLOTS.filter((slot) => counts[slot] > 0)
        .map((slot) => `${slotLabel(slot)} ${counts[slot]}`)
        .join(", ")}
      className={`relative shrink-0 rounded-full ${size === "lg" ? "h-32 w-32" : "h-24 w-24"}`}
      style={{ background: ringStyle(summary, sunny) }}
    >
      <span
        className={`absolute flex flex-col items-center justify-center rounded-full leading-none ${size === "lg" ? "inset-4" : "inset-3"} ${
          sunny ? "bg-tile-sun" : "bg-panel"
        }`}
      >
        <span className={`font-display ${size === "lg" ? "text-3xl" : "text-xl"}`}>
          {done}
          <span className={`text-xs ${soft}`}>/{total}</span>
        </span>
        <span className={`mt-1 text-[10px] ${soft}`}>{t("profile.seriesFinished")}</span>
      </span>
    </span>
  );
}

function SeriesHead({ summary, shelf, showMissing, onOpen }: { summary: Summary; shelf: boolean; showMissing: boolean; onOpen?: () => void }) {
  const { series, counts, closed } = summary;
  const sunny = shelf && closed;
  const soft = sunny ? "opacity-75" : "text-muted";
  const chip = sunny ? "bg-[#1b1530]/10" : "bg-raised";
  const meta = [t("profile.seriesMeta", { count: summary.total, years: summary.years })];
  if (showMissing && summary.missing > 0) meta.push(t("profile.seriesMetaMissing", { count: summary.missing }));
  if (summary.upcoming.length > 0) meta.push(t("profile.seriesMetaUpcoming", { count: summary.upcoming.length }));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {onOpen ? (
          <h3 className="font-display text-lg leading-tight">
            <button type="button" onClick={onOpen} className="text-left hover:underline">
              {series.name}
            </button>
          </h3>
        ) : (
          <h2 className="font-display text-2xl leading-tight">{series.name}</h2>
        )}
        {closed ? (
          <span
            className={`inline-flex h-6 items-center rounded-lg px-2 text-xs font-bold ${shelf ? "bg-[#1b1530] text-tile-sun" : "bg-accent/15 text-accent-fg"}`}
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
  );
}

function SeriesCard({ summary, shelf, showMissing }: { summary: Summary; shelf: boolean; showMissing: boolean }) {
  const [open, setOpen] = useState(false);
  const { series, closed } = summary;
  const sunny = shelf && closed;
  const card = shelf
    ? `rounded-[32px] p-5 sm:p-6 ${sunny ? "bg-tile-sun text-[#1b1530]" : "bg-panel"}`
    : `rounded-2xl border bg-panel p-5 ${closed ? "border-accent-fg" : "border-line"}`;
  const soft = sunny ? "opacity-75" : "text-muted";

  return (
    <article className={`flex h-full flex-col gap-4 ${card}`}>
      <div className="flex items-center gap-4">
        <SeriesRing summary={summary} sunny={sunny} size="md" />
        <SeriesHead summary={summary} shelf={shelf} showMissing={showMissing} onOpen={() => setOpen(true)} />
        <div className="flex flex-col items-end gap-2 self-start">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("profile.seriesOpen", { name: series.name })}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${sunny ? "bg-[#1b1530]/10 hover:bg-[#1b1530]/20" : "bg-raised hover:text-accent-fg"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
          <div className="hidden text-right sm:block">
            <p className={`font-display text-xl ${closed && !shelf ? "text-accent-fg" : ""}`}>{percentOf(summary)}%</p>
            {summary.average != null ? <p className={`mt-0.5 text-xs ${soft}`}>{t("profile.seriesAverage", { rating: summary.average.toFixed(1) })}</p> : null}
          </div>
        </div>
      </div>
      <ol aria-label={t("profile.seriesOrder", { name: series.name })} className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-2 pb-1">
        {summary.games.map((game, index) => (
          <SeriesCover key={`${index}-${game.slug}`} game={game} sunny={sunny} />
        ))}
      </ol>
      {summary.upcoming.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className={`text-xs font-semibold ${soft}`}>{t("profile.seriesUpcoming")}</p>
          <ol aria-label={t("profile.seriesUpcoming")} className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-2 pb-1">
            {summary.upcoming.map((game, index) => (
              <SeriesCover key={`${index}-${game.slug}`} game={game} sunny={sunny} upcoming />
            ))}
          </ol>
        </div>
      ) : null}
      {open ? <SeriesDialog summary={summary} shelf={shelf} showMissing={showMissing} onClose={() => setOpen(false)} /> : null}
    </article>
  );
}

// Games outside the lists open too: the API pulls an unknown slug in from IGDB on the first visit.
function coverHref(game: SeriesGame): string {
  return `/games/${encodeURIComponent(game.slug)}`;
}

function coverTone(slot: Slot, upcoming: boolean): string {
  if (slot === "missing") return upcoming ? "opacity-60" : "opacity-25 grayscale";
  if (slot === "dropped") return "opacity-50 grayscale";
  return "";
}

function RatingBadge({ game, slot, sunny }: { game: SeriesGame; slot: Slot; sunny: boolean }) {
  if (game.rating == null) return null;
  return (
    <span
      className="absolute -top-1.5 -right-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-extrabold"
      style={{
        background: colorOf(slot, sunny),
        color: sunny && slot === "finished" ? "var(--color-tile-sun)" : "#1b1530",
        boxShadow: `0 0 0 2px ${sunny ? "var(--color-tile-sun)" : "var(--color-panel)"}`,
      }}
    >
      {scoreText(game.rating)}
    </span>
  );
}

function SeriesCover({ game, sunny, upcoming = false }: { game: SeriesGame; sunny: boolean; upcoming?: boolean }) {
  const slot = slotOf(game);
  const missing = slot === "missing";
  const year = game.releaseDate?.slice(0, 4) ?? "TBA";
  return (
    <li className={`flex shrink-0 flex-col gap-1.5 ${upcoming ? "w-12" : "w-[60px]"}`}>
      <a
        href={coverHref(game)}
        title={`${game.title} · ${year}`}
        aria-label={`${game.title}, ${year}: ${slotLabel(slot)}`}
        className={`relative block aspect-[3/4] rounded-[10px] ${missing && !upcoming ? "border-[1.5px] border-dashed border-muted/60" : ""}`}
      >
        {game.coverUrl ? (
          <img src={game.coverUrl} alt="" loading="lazy" className={`h-full w-full rounded-[9px] object-cover ${coverTone(slot, upcoming)}`} />
        ) : (
          <span className="block h-full w-full rounded-[9px] bg-raised" />
        )}
        {missing && !upcoming ? <span className="absolute inset-0 flex items-center justify-center text-xl text-ink">+</span> : null}
        <RatingBadge game={game} slot={slot} sunny={sunny} />
      </a>
      {upcoming && missing ? null : <span className="h-1 rounded-full" style={{ background: colorOf(slot, sunny) }} />}
      <span className={`text-center text-[11px] ${sunny ? "opacity-75" : "text-muted"}`}>{year}</span>
    </li>
  );
}

// The whole series at a readable size: every released part with its title and status, then the announced ones.
function SeriesDialog({ summary, shelf, showMissing, onClose }: { summary: Summary; shelf: boolean; showMissing: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sunny = shelf && summary.closed;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={summary.series.name}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden text-ink ${shelf ? "rounded-t-[32px] bg-bg sm:rounded-[32px]" : "rounded-t-3xl border border-line bg-bg sm:rounded-3xl"}`}
      >
        <header className={`flex items-center gap-5 p-5 sm:p-6 ${sunny ? "bg-tile-sun text-[#1b1530]" : shelf ? "bg-panel" : "border-b border-line bg-panel"}`}>
          <SeriesRing summary={summary} sunny={sunny} size="lg" />
          <SeriesHead summary={summary} shelf={shelf} showMissing={showMissing} />
          <div className="flex flex-col items-end gap-3 self-start">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${sunny ? "bg-[#1b1530]/10" : "bg-raised"}`}
            >
              <Icon name="close" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="font-display text-2xl">{percentOf(summary)}%</p>
              {summary.average != null ? (
                <p className={`text-xs ${sunny ? "opacity-75" : "text-muted"}`}>{t("profile.seriesAverage", { rating: summary.average.toFixed(1) })}</p>
              ) : null}
            </div>
          </div>
        </header>
        <div className="overflow-y-auto p-5 sm:p-6">
          <DialogGrid games={summary.games} label={t("profile.seriesOrder", { name: summary.series.name })} />
          {summary.upcoming.length > 0 ? (
            <section className="mt-8">
              <h3 className="font-display text-lg">{t("profile.seriesUpcoming")}</h3>
              <p className="mt-1 text-sm text-muted">{t("profile.seriesUpcomingHint")}</p>
              <DialogGrid games={summary.upcoming} label={t("profile.seriesUpcoming")} upcoming />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DialogGrid({ games, label, upcoming = false }: { games: SeriesGame[]; label: string; upcoming?: boolean }) {
  return (
    <ol aria-label={label} className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6">
      {games.map((game, index) => {
        const slot = slotOf(game);
        return (
          <li key={`${index}-${game.slug}`} className="flex min-w-0 flex-col gap-1.5">
            <a
              href={coverHref(game)}
              className={`group relative block aspect-[3/4] rounded-xl ${slot === "missing" && !upcoming ? "border-[1.5px] border-dashed border-muted/60" : ""}`}
            >
              {game.coverUrl ? (
                <img
                  src={game.coverUrl}
                  alt=""
                  loading="lazy"
                  className={`h-full w-full rounded-xl object-cover transition group-hover:brightness-110 ${coverTone(slot, upcoming)}`}
                />
              ) : (
                <span className="block h-full w-full rounded-xl bg-raised" />
              )}
              <RatingBadge game={game} slot={slot} sunny={false} />
            </a>
            <span className="h-1 rounded-full" style={{ background: SLOT_COLOR[slot] }} />
            <a href={coverHref(game)} className="line-clamp-2 text-sm leading-tight font-semibold hover:underline">
              {game.title}
            </a>
            <span className="text-xs text-muted">
              {game.releaseDate ? (upcoming ? formatReleaseDate(game.releaseDate) : game.releaseDate.slice(0, 4)) : "TBA"} · {slotLabel(slot)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
