import {
  CATALOG_GENRES,
  CATALOG_PLATFORMS,
  SEARCH_GENRES,
  t,
  type CatalogGenreId,
  type CatalogPlatformId,
  type HomeCollectionId,
  type MessageKey,
  type SearchFilters,
} from "@gametracker/shared";
import type { Metadata } from "next";
import { CollectionRow } from "@/components/CollectionRow";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";
import { SearchForm } from "@/components/SearchForm";
import { SearchResults } from "@/components/SearchResults";
import { COLLECTION_MARK, GENRE_MARK, PLATFORM_MARK } from "@/lib/marks";
import { getCollections, getMe, searchGames } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { absoluteUrl, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; platform?: string; year?: string; origin?: string }>;
}): Promise<Metadata> {
  await applyLocale();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const ukrainian = params.origin === "ua";
  const searching = query.length > 0 || Boolean(params.genre || params.platform || params.year);
  return pageMetadata({
    title: ukrainian ? t("home.ukrainianGames") : searching && query ? query : t("home.title"),
    description: ukrainian ? t("news.ukrainianLead") : t("meta.description"),
    path: ukrainian ? "/?origin=ua" : "/",
    index: ukrainian || !searching,
    follow: true,
    absolute: true,
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; platform?: string; year?: string; origin?: string }>;
}) {
  await applyLocale();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const origin = params.origin === "ua" ? "ua" : "";
  const filters = readFilters(params);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "GameTracker",
          url: absoluteUrl("/"),
          description: t("meta.description"),
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${absoluteUrl("/")}?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <p className="text-sm font-medium tracking-[0.18em] text-accent uppercase">{t("home.eyebrow")}</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
        {t("home.title")}
      </h1>
      <p className="mt-3 max-w-xl text-muted">{t("home.lead")}</p>
      <div className="mt-8">
        <SearchForm query={query} genre={params.genre ?? ""} platform={params.platform ?? ""} year={params.year ?? ""} />
      </div>
      <ShelfLinks />
      <div className="mt-10">
        {origin || query || hasFilters(filters) ? (
          <Results query={origin ? "" : query} filters={origin ? {} : filters} origin={origin} />
        ) : (
          <Collections />
        )}
      </div>
    </main>
  );
}

async function Results({ query, filters, origin }: { query: string; filters: SearchFilters; origin: "" | "ua" }) {
  if (query.length > 0 && query.length < 2 && !hasFilters(filters) && !origin) {
    return <Empty text={t("home.tooShort")} />;
  }

  const result = await searchGames(query.length >= 2 ? query : "", filters, 0, origin || undefined);
  if (result.games.length === 0) {
    return <Empty text={t("home.nothing")} />;
  }

  return (
    <div>
      {origin ? <h2 className="mb-6 font-display text-3xl tracking-tight">{t("home.ukrainianGames")}</h2> : null}
      <SearchResults
        key={`${query}|${filters.genre ?? ""}|${filters.platform ?? ""}|${filters.year ?? ""}|${origin}`}
        query={query}
        genre={filters.genre ?? ""}
        platform={filters.platform ?? ""}
        year={filters.year ? String(filters.year) : ""}
        origin={origin}
        games={result.games}
        hasMore={result.hasMore}
      />
    </div>
  );
}

const COLLECTION_TITLES: Record<HomeCollectionId, MessageKey> = {
  popular: "collections.popular",
  recent: "collections.recent",
  upcoming: "collections.upcoming",
  rpg: "collections.rpg",
  shooter: "collections.shooter",
  adventure: "collections.adventure",
  strategy: "collections.strategy",
  indie: "collections.indie",
  racing: "collections.racing",
};

function ShelfLinks() {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {CATALOG_GENRES.map((genre) => (
        <a key={genre.id} href={`/genres/${genre.id}`} className={chipClass}>
          <Icon name={GENRE_MARK[genre.id].icon} className={`h-3.5 w-3.5 ${GENRE_MARK[genre.id].tone}`} />
          {t(GENRE_LABEL[genre.id])}
        </a>
      ))}
      {CATALOG_PLATFORMS.map((platform) => (
        <a key={platform.id} href={`/platforms/${platform.id}`} className={chipClass}>
          <Icon name={PLATFORM_MARK[platform.id].icon} className={`h-3.5 w-3.5 ${PLATFORM_MARK[platform.id].tone}`} />
          {t(PLATFORM_LABEL[platform.id])}
        </a>
      ))}
    </div>
  );
}

const chipClass = "inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-muted hover:border-accent hover:text-ink";

const GENRE_LABEL: Record<CatalogGenreId, MessageKey> = {
  rpg: "collections.rpg",
  shooter: "collections.shooter",
  adventure: "collections.adventure",
  strategy: "collections.strategy",
  indie: "collections.indie",
  racing: "collections.racing",
};

const PLATFORM_LABEL: Record<CatalogPlatformId, MessageKey> = {
  pc: "platforms.pc",
  ps5: "platforms.ps5",
  ps4: "platforms.ps4",
  "xbox-series": "platforms.xbox-series",
  "xbox-one": "platforms.xbox-one",
  switch: "platforms.switch",
};

function readFilters(params: { genre?: string; platform?: string; year?: string }): SearchFilters {
  const genre = SEARCH_GENRES.find((item) => item.id === params.genre)?.id;
  const platform = CATALOG_PLATFORMS.find((item) => item.id === params.platform)?.id;
  const year = Number(params.year);
  return {
    genre,
    platform,
    year: Number.isInteger(year) && year >= 1970 && year <= 2035 ? year : undefined,
  };
}

function hasFilters(filters: SearchFilters): boolean {
  return Boolean(filters.genre || filters.platform || filters.year);
}

async function Collections() {
  const [home, me] = await Promise.all([getCollections(), getMe()]);
  const profile = me ? `/u/${encodeURIComponent(me.username)}` : undefined;

  return (
    <div className="flex flex-col gap-12">
      {profile ? (
        <CollectionRow
          title={t("status.backlog")}
          games={home.backlog ?? []}
          href={(home.backlog ?? []).length > 0 ? profile : undefined}
          startsCollapsed
          rows={1}
          mark={{ icon: "bookmark", tone: "bg-amber-300/10 text-amber-300" }}
        />
      ) : null}
      {profile && (home.upcomingBacklog ?? []).length > 0 ? (
        <CollectionRow
          title={t("collections.fromYourList")}
          games={home.upcomingBacklog ?? []}
          rows={1}
          showReleaseDate
          mark={{ icon: "calendar", tone: "bg-sky-300/10 text-sky-300" }}
        />
      ) : null}
      {profile && (home.favorites ?? []).length > 0 ? (
        <CollectionRow
          title={t("library.favorites")}
          games={home.favorites ?? []}
          href={profile}
          mark={{ icon: "heart", tone: "bg-pink-300/10 text-pink-300" }}
        />
      ) : null}
      {home.collections.map((section) => (
        <CollectionRow
          key={section.id}
          title={t(COLLECTION_TITLES[section.id])}
          games={section.games}
          href={section.id in GENRE_LABEL ? `/genres/${section.id}` : undefined}
          mark={COLLECTION_MARK[section.id]}
        />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-line px-5 py-10 text-center text-muted">{text}</p>
  );
}
