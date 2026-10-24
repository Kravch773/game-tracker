"use client";

import { t, type GameSummary } from "@gametracker/shared";
import { useState } from "react";
import { GameResult } from "@/components/GameResult";
import { apiUrl } from "@/lib/config";

export function SearchResults({
  query,
  genre,
  platform,
  year,
  sort = "",
  developer = "",
  publisher = "",
  series = "",
  origin = "",
  games,
  hasMore,
}: {
  query: string;
  genre: string;
  platform: string;
  year: string;
  sort?: string;
  developer?: string;
  publisher?: string;
  series?: string;
  origin?: string;
  games: GameSummary[];
  hasMore: boolean;
}) {
  const [items, setItems] = useState(games);
  const [more, setMore] = useState(hasMore);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadMore() {
    setPending(true);
    setFailed(false);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (genre) params.set("genre", genre);
    if (platform) params.set("platform", platform);
    if (year) params.set("year", year);
    if (sort && sort !== "popular") params.set("sort", sort);
    if (developer) params.set("developer", developer);
    if (publisher) params.set("publisher", publisher);
    if (series) params.set("series", series);
    if (origin) params.set("origin", origin);
    params.set("offset", String(items.length));
    try {
      const response = await fetch(`${apiUrl}/games?${params}`);
      if (!response.ok) throw new Error("load");
      const payload = (await response.json()) as { games?: GameSummary[]; hasMore?: boolean };
      const next = payload.games ?? [];
      setItems((current) => {
        const seen = new Set(current.map((game) => game.id));
        return [...current, ...next.filter((game) => !seen.has(game.id))];
      });
      setMore(Boolean(payload.hasMore) && next.length > 0);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
        {items.map((game) => (
          <li key={game.id}>
            <GameResult game={game} newTab />
          </li>
        ))}
      </ul>
      {more ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => void loadMore()}
          className="mt-8 inline-flex h-11 items-center rounded-full border border-line px-5 text-sm font-semibold hover:border-accent disabled:opacity-60"
        >
          {t("home.loadMore")}
        </button>
      ) : null}
      {failed ? <p className="mt-3 text-sm text-accent-fg">{t("home.loadFailed")}</p> : null}
    </div>
  );
}
