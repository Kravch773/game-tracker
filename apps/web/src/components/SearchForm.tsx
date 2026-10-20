"use client";

import { t, type GameSummary } from "@gametracker/shared";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";

export function SearchForm({
  query,
  genre,
  platform,
  year,
  origin,
  sort,
  developer,
  publisher,
  series,
}: {
  query: string;
  genre: string;
  platform: string;
  year: string;
  origin: string;
  sort: string;
  developer: string;
  publisher: string;
  series: string;
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
    <form action="/" method="get" role="search">
      {genre ? <input type="hidden" name="genre" value={genre} /> : null}
      {platform ? <input type="hidden" name="platform" value={platform} /> : null}
      {year ? <input type="hidden" name="year" value={year} /> : null}
      {origin ? <input type="hidden" name="origin" value={origin} /> : null}
      {sort && sort !== "popular" ? <input type="hidden" name="sort" value={sort} /> : null}
      {developer ? <input type="hidden" name="developer" value={developer} /> : null}
      {publisher ? <input type="hidden" name="publisher" value={publisher} /> : null}
      {series ? <input type="hidden" name="series" value={series} /> : null}
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
    </form>
  );
}
