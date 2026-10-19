"use client";

import {
  CATALOG_PLATFORMS,
  SEARCH_GENRES,
  t,
  type CatalogPlatformId,
  type GameSummary,
  type MessageKey,
  type SearchGenreId,
} from "@gametracker/shared";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { SEARCH_GENRE_ICON } from "@/lib/marks";

const GENRE_LABEL: Record<SearchGenreId, MessageKey> = {
  rpg: "collections.rpg",
  shooter: "collections.shooter",
  adventure: "collections.adventure",
  strategy: "collections.strategy",
  indie: "collections.indie",
  racing: "collections.racing",
  fighting: "genres.fighting",
  platform: "genres.platform",
  puzzle: "genres.puzzle",
  sport: "genres.sport",
  simulator: "genres.simulator",
  "hack-and-slash": "genres.hack-and-slash",
  tactical: "genres.tactical",
  rts: "genres.rts",
  tbs: "genres.tbs",
  music: "genres.music",
  arcade: "genres.arcade",
  "visual-novel": "genres.visual-novel",
  moba: "genres.moba",
  card: "genres.card",
  "point-and-click": "genres.point-and-click",
  quiz: "genres.quiz",
  pinball: "genres.pinball",
};

const PLATFORM_LABEL: Record<CatalogPlatformId, MessageKey> = {
  pc: "platforms.pc",
  ps5: "platforms.ps5",
  ps4: "platforms.ps4",
  "xbox-series": "platforms.xbox-series",
  "xbox-one": "platforms.xbox-one",
  switch: "platforms.switch",
};

export function SearchForm({
  query,
  genre,
  platform,
  year,
}: {
  query: string;
  genre: string;
  platform: string;
  year: string;
}) {
  const [text, setText] = useState(query);
  const [hints, setHints] = useState<GameSummary[]>([]);
  const [open, setOpen] = useState(false);
  const submitted = query.trim();

  useEffect(() => {
    const term = text.trim();
    if (term.length < 2 || term === submitted) {
      setHints([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      void fetch(`${apiUrl}/games?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) return;
          const payload = (await response.json()) as { games?: GameSummary[] };
          const next = (payload.games ?? []).slice(0, 6);
          setHints(next);
          setOpen(next.length > 0);
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === "AbortError") return;
          setHints([]);
        });
    }, 300);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [submitted, text]);

  return (
    <form action="/" method="get" className="flex flex-col gap-3" role="search">
      <div className="relative">
        <label className="sr-only" htmlFor="game-query">
          {t("home.queryLabel")}
        </label>
        <input
          id="game-query"
          name="q"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => {
            if (text.trim() !== submitted && hints.length > 0) setOpen(true);
          }}
          placeholder={t("home.queryLabel")}
          maxLength={80}
          autoComplete="off"
          className="h-14 w-full rounded-full border border-line bg-panel/90 pr-32 pl-12 text-base text-ink shadow-lg outline-none placeholder:text-muted focus:border-accent"
        />
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
        <button
          type="submit"
          className="absolute top-2 right-2 inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink! hover:brightness-110"
        >
          {t("home.search")}
        </button>
        {open && hints.length > 0 ? (
          <ul className="absolute top-16 z-30 w-full overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
            {hints.map((game) => (
              <li key={game.id}>
                <a
                  href={`/games/${encodeURIComponent(game.slug)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-white/5"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {game.coverUrl ? (
                    <img src={game.coverUrl} alt="" className="h-12 w-9 rounded-md object-cover" />
                  ) : (
                    <span className="h-12 w-9 rounded-md bg-raised" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{game.title}</span>
                    <span className="block text-sm text-muted">{game.releaseDate?.slice(0, 4) ?? t("common.unknownDate")}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <GenreField genre={genre} />
        <select name="platform" defaultValue={platform} className={selectClass} aria-label={t("home.platform")}>
          <option value="">{t("home.platform")}: {t("home.any")}</option>
          {CATALOG_PLATFORMS.map((item) => (
            <option key={item.id} value={item.id}>
              {t(PLATFORM_LABEL[item.id])}
            </option>
          ))}
        </select>
        <input
          name="year"
          defaultValue={year}
          inputMode="numeric"
          placeholder={t("home.year")}
          aria-label={t("home.year")}
          maxLength={4}
          className={selectClass}
        />
      </div>
    </form>
  );
}

function GenreField({ genre }: { genre: string }) {
  const [value, setValue] = useState(genre);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = SEARCH_GENRES.find((item) => item.id === value);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={root} className="relative">
      <input type="hidden" name="genre" value={value} />
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("home.genre")}
        onClick={() => setOpen((current) => !current)}
        className={`${selectClass} flex items-center gap-2 text-left`}
      >
        {selected ? <Icon name={SEARCH_GENRE_ICON[selected.id]} className="h-4 w-4" /> : null}
        <span className="truncate">
          {selected ? t(GENRE_LABEL[selected.id]) : `${t("home.genre")}: ${t("home.any")}`}
        </span>
      </button>
      {open ? (
        <ul className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-3xl border border-line bg-panel py-2 shadow-2xl">
          <li>
            <button
              type="button"
              className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-white/5"
              onClick={() => {
                setValue("");
                setOpen(false);
              }}
            >
              {t("home.genre")}: {t("home.any")}
            </button>
          </li>
          {SEARCH_GENRES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-white/5"
                onClick={() => {
                  setValue(item.id);
                  setOpen(false);
                }}
              >
                <Icon name={SEARCH_GENRE_ICON[item.id]} className="h-4 w-4" />
                {t(GENRE_LABEL[item.id])}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const selectClass =
  "h-11 w-full rounded-full border border-line bg-panel/90 px-4 text-sm text-ink outline-none focus:border-accent";
