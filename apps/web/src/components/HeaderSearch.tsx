"use client";

import { t, type GameSummary } from "@gametracker/shared";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";

export function HeaderSearch() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [text, setText] = useState(query);
  const [hints, setHints] = useState<GameSummary[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setText(query);
  }, [query]);

  useEffect(() => {
    const term = text.trim();
    if (term.length < 2 || term === query.trim()) {
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
  }, [query, text]);

  return (
    <form action="/" method="get" role="search" className="relative w-full max-w-md">
      <label className="sr-only" htmlFor="header-query">
        {t("home.queryLabel")}
      </label>
      <input
        id="header-query"
        name="q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onFocus={() => {
          if (text.trim() !== query.trim() && hints.length > 0) setOpen(true);
        }}
        placeholder={t("home.queryLabel")}
        maxLength={80}
        autoComplete="off"
        className="h-10 w-full rounded-full border border-line bg-panel/90 pr-4 pl-10 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
      />
      <button
        type="submit"
        aria-label={t("home.search")}
        className="absolute top-1 left-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-ink"
      >
        <Icon name="search" />
      </button>
      {open && hints.length > 0 ? (
        <ul className="absolute top-12 z-30 w-full overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
          {hints.map((game) => (
            <li key={game.id}>
              <a
                href={`/games/${encodeURIComponent(game.slug)}`}
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
    </form>
  );
}
