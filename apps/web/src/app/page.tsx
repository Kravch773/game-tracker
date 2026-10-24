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
import { CatalogSide } from "@/components/CatalogSide";
import { SearchForm } from "@/components/SearchForm";
import { SearchResults } from "@/components/SearchResults";
import { COLLECTION_MARK, GENRE_MARK, PLATFORM_MARK } from "@/lib/marks";
import { ConsoleHero, ShelfBento, homeTopSummary } from "@/components/HomeTop";
import { HomeTopFold } from "@/components/HomeTopFold";
import { getActivity, getCollections, getMe, searchGames } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { getLook, homeTopOpen } from "@/lib/look";
import type { Design } from "@/lib/look-cookie";
import { absoluteUrl, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; platform?: string; year?: string; origin?: string; sort?: string; developer?: string; publisher?: string; series?: string }>;
}): Promise<Metadata> {
  await applyLocale();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const origin = params.origin === "ua" ? "ua" : params.origin === "ru" ? "ru" : "";
  const searching = query.length > 0 || Boolean(params.genre || params.platform || params.year || params.sort || params.developer || params.publisher || params.series);
  return pageMetadata({
    title: origin === "ua" ? t("home.ukrainianGames") : origin === "ru" ? t("home.russianGames") : searching && query ? query : t("home.title"),
    description: origin === "ua" ? t("news.ukrainianLead") : origin === "ru" ? t("news.russianLead") : t("meta.description"),
    path: origin === "ua" ? "/?origin=ua" : origin === "ru" ? "/?origin=ru" : "/",
    index:
      (Boolean(origin) || !searching) &&
      !params.genre &&
      !params.platform &&
      !params.year &&
      !params.sort &&
      !params.developer &&
      !params.publisher &&
      !params.series &&
      !query,
    follow: true,
    absolute: true,
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; platform?: string; year?: string; origin?: string; sort?: string; developer?: string; publisher?: string; series?: string }>;
}) {
  await applyLocale();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const origin = params.origin === "ua" ? "ua" : params.origin === "ru" ? "ru" : "";
  const filters = readFilters(params);
  const sort = filters.sort ?? "popular";
  const browsing = !(origin || query || hasFilters(filters) || sort !== "popular");
  const { design } = await getLook();

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
      {browsing ? <HomeTop design={design} /> : null}
      <p className="text-sm font-medium tracking-[0.18em] text-accent-fg uppercase">{t("home.eyebrow")}</p>
      <h1 className={`mt-3 max-w-2xl font-display tracking-tight ${browsing ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>
        {t("home.title")}
      </h1>
      <p className="mt-3 max-w-xl text-muted">{t("home.lead")}</p>
      <div className="mt-8">
        <SearchForm
          query={query}
          genre={filters.genre ?? ""}
          platform={filters.platform ?? ""}
          year={filters.year ? String(filters.year) : ""}
          origin={origin}
          sort={sort}
          developer={filters.developer ?? ""}
          publisher={filters.publisher ?? ""}
          series={filters.series ?? ""}
        />
      </div>
      <ShelfLinks design={design} />
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start">
        <CatalogSide
          q={query}
          genre={filters.genre ?? ""}
          platform={filters.platform ?? ""}
          year={filters.year ? String(filters.year) : ""}
          origin={origin}
          sort={sort}
          developer={filters.developer ?? ""}
          publisher={filters.publisher ?? ""}
          series={filters.series ?? ""}
        />
        <div className="min-w-0 flex-1">
          {!browsing ? (
            <Results query={query} filters={filters} origin={origin} />
          ) : (
            <Collections />
          )}
        </div>
      </div>
    </main>
  );
}

async function Results({ query, filters, origin }: { query: string; filters: SearchFilters; origin: "" | "ua" | "ru" }) {
  if (query.length > 0 && query.length < 2 && !hasFilters(filters) && !origin) {
    return <Empty text={t("home.tooShort")} />;
  }

  const typed = query.length >= 2 ? query : "";
  const result = await searchGames(typed, filters, 0, origin || undefined);
  if (result.games.length === 0) {
    return <Empty text={t("home.nothing")} />;
  }

  return (
    <div>
      {origin ? (
        <h2 className="mb-6 font-display text-3xl tracking-tight">
          {t(origin === "ru" ? "home.russianGames" : "home.ukrainianGames")}
        </h2>
      ) : null}
      <SearchResults
        key={`${query}|${filters.genre ?? ""}|${filters.platform ?? ""}|${filters.year ?? ""}|${filters.sort ?? ""}|${filters.developer ?? ""}|${filters.publisher ?? ""}|${filters.series ?? ""}|${origin}`}
        query={origin ? (query.length >= 2 ? query : "") : query}
        genre={filters.genre ?? ""}
        platform={filters.platform ?? ""}
        year={filters.year ? String(filters.year) : ""}
        sort={filters.sort ?? ""}
        developer={filters.developer ?? ""}
        publisher={filters.publisher ?? ""}
        series={filters.series ?? ""}
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

const GENRE_TILE: Record<CatalogGenreId, string> = {
  rpg: "bg-tile-coral",
  shooter: "bg-tile-sun",
  adventure: "bg-tile-mint",
  strategy: "bg-tile-lilac",
  indie: "bg-tile-rose",
  racing: "bg-tile-sky",
};

async function HomeTop({ design }: { design: Design }) {
  const [home, me, open] = await Promise.all([getCollections(), getMe(), homeTopOpen()]);
  const summary = homeTopSummary(home, me);
  if (design === "console") {
    return (
      <HomeTopFold initialOpen={open} summary={summary}>
        <ConsoleHero home={home} user={me} />
      </HomeTopFold>
    );
  }
  const { events } = open ? await getActivity(me != null).catch(() => ({ events: [] })) : { events: [] };
  return (
    <HomeTopFold initialOpen={open} summary={summary}>
      <ShelfBento home={home} user={me} events={events} />
    </HomeTopFold>
  );
}

function ShelfLinks({ design }: { design: Design }) {
  if (design === "shelf") {
    return (
      <div className="mt-5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATALOG_GENRES.map((genre) => (
            <a
              key={genre.id}
              href={`/genres/${genre.id}`}
              className={`flex h-20 items-end rounded-3xl p-4 font-display text-lg font-extrabold text-[#1b1530] transition hover:-translate-y-0.5 ${GENRE_TILE[genre.id]}`}
            >
              {t(GENRE_LABEL[genre.id])}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATALOG_PLATFORMS.map((platform) => (
            <a key={platform.id} href={`/platforms/${platform.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-panel px-4 text-sm font-semibold hover:bg-raised">
              <Icon name={PLATFORM_MARK[platform.id].icon} className="h-3.5 w-3.5" />
              {t(PLATFORM_LABEL[platform.id])}
            </a>
          ))}
        </div>
      </div>
    );
  }

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

function readFilters(params: {
  genre?: string;
  platform?: string;
  year?: string;
  sort?: string;
  developer?: string;
  publisher?: string;
  series?: string;
}): SearchFilters {
  const genre = SEARCH_GENRES.find((item) => item.id === params.genre)?.id;
  const platform = CATALOG_PLATFORMS.find((item) => item.id === params.platform)?.id;
  const year = Number(params.year);
  const sort = (["popular", "release", "title"] as const).find((item) => item === params.sort);
  return {
    genre,
    platform,
    year: Number.isInteger(year) && year >= 1970 && year <= 2035 ? year : undefined,
    sort,
    developer: textQuery(params.developer),
    publisher: textQuery(params.publisher),
    series: textQuery(params.series),
  };
}

function textQuery(value: string | undefined): string | undefined {
  const text = value?.trim() ?? "";
  return text.length >= 2 ? text.slice(0, 80) : undefined;
}

function hasFilters(filters: SearchFilters): boolean {
  return Boolean(filters.genre || filters.platform || filters.year || filters.developer || filters.publisher || filters.series);
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
          mark={{ icon: "bookmark", tone: "bg-amber-300/10 text-amber-700 dark:text-amber-300" }}
        />
      ) : null}
      {profile && (home.upcomingBacklog ?? []).length > 0 ? (
        <CollectionRow
          title={t("collections.fromYourList")}
          games={home.upcomingBacklog ?? []}
          rows={1}
          showReleaseDate
          mark={{ icon: "calendar", tone: "bg-sky-300/10 text-sky-700 dark:text-sky-300" }}
        />
      ) : null}
      {profile && (home.favorites ?? []).length > 0 ? (
        <CollectionRow
          title={t("library.favorites")}
          games={home.favorites ?? []}
          href={profile}
          mark={{ icon: "heart", tone: "bg-pink-300/10 text-pink-700 dark:text-pink-300" }}
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
