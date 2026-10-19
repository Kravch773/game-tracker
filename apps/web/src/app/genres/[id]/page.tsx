import { CATALOG_GENRES, t, type CatalogGenreId, type MessageKey } from "@gametracker/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameResult } from "@/components/GameResult";
import { Icon, IconBadge, type IconName } from "@/components/Icon";
import { GENRE_MARK } from "@/lib/marks";
import { getBrowse } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";

const TITLES: Record<CatalogGenreId, MessageKey> = {
  rpg: "collections.rpg",
  shooter: "collections.shooter",
  adventure: "collections.adventure",
  strategy: "collections.strategy",
  indie: "collections.indie",
  racing: "collections.racing",
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await applyLocale();
  const { id } = await params;
  const genre = CATALOG_GENRES.find((item) => item.id === id);
  if (!genre) return pageMetadata({ title: "GameTracker", description: t("meta.description"), path: `/genres/${id}`, index: false });
  const name = t(TITLES[genre.id]);
  return pageMetadata({
    title: name,
    description: t("meta.genre", { name }),
    path: `/genres/${genre.id}`,
  });
}

export default async function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  await applyLocale();
  const { id } = await params;
  const genre = CATALOG_GENRES.find((item) => item.id === id);
  if (!genre) notFound();
  const games = await getBrowse("genres", genre.id);
  if (!games) notFound();
  return <Shelf title={t(TITLES[genre.id])} mark={GENRE_MARK[genre.id]} games={games} />;
}

function Shelf({
  title,
  mark,
  games,
}: {
  title: string;
  mark: { icon: IconName; tone: string };
  games: { id: string; slug: string; title: string; coverUrl: string | null; releaseDate: string | null; platforms: string[] }[];
}) {
  return (
    <main>
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow" />
        {t("common.backToSearch")}
      </a>
      <h1 className="mt-4 flex items-center gap-3 font-display text-4xl tracking-tight">
        <IconBadge name={mark.icon} tone={mark.tone} size="lg" />
        {title}
      </h1>
      {games.length === 0 ? (
        <p className="mt-8 text-muted">{t("home.nothing")}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game) => (
            <li key={game.id}>
              <GameResult game={game} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
