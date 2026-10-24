import {
  CATALOG_GENRES,
  CATALOG_PLATFORMS,
  t,
  type CatalogGenreId,
  type CatalogPlatformId,
  type HomeCollectionId,
  type MessageKey,
} from "@gametracker/shared";
import type { Metadata } from "next";
import { CollectionRow } from "@/components/CollectionRow";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";
import { ActiveFilters, CatalogSide } from "@/components/CatalogSide";
import { SearchForm } from "@/components/SearchForm";
import { SearchResults } from "@/components/SearchResults";
import { COLLECTION_MARK, GENRE_MARK, PLATFORM_MARK } from "@/lib/marks";
import { ConsoleHero, ShelfBento, homeTopSummary } from "@/components/HomeTop";
import { HomeTopFold } from "@/components/HomeTopFold";
import { GenreGlyph } from "@/components/GenreGlyph";
import { getActivity, getCollections, getMe, searchGames } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { catalogParams, hasCatalogFilters, readCatalogQuery, toSearchFilters, type CatalogQuery, type RawParams } from "@/lib/catalog-query";
import { getLook, homeTopOpen } from "@/lib/look";
import type { Design } from "@/lib/look-cookie";
import { absoluteUrl, pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}): Promise<Metadata> {
  await applyLocale();
  const catalog = readCatalogQuery(await searchParams);
  const query = catalog.q;
  const origin = catalog.origin;
  const searching = query.length > 0 || hasCatalogFilters(catalog) || catalog.sort !== "popular";
  return pageMetadata({
    title: origin === "ua" ? t("home.ukrainianGames") : origin === "ru" ? t("home.russianGames") : searching && query ? query : t("home.title"),
    description: origin === "ua" ? t("news.ukrainianLead") : origin === "ru" ? t("news.russianLead") : t("meta.description"),
    path: origin === "ua" ? "/?origin=ua" : origin === "ru" ? "/?origin=ru" : "/",
    index: (Boolean(origin) || !searching) && !hasCatalogFilters(catalog) && catalog.sort === "popular" && !query,
    follow: true,
    absolute: true,
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  await applyLocale();
  const catalog = readCatalogQuery(await searchParams);
  const query = catalog.q;
  const origin = catalog.origin;
  const browsing = !(origin || query || hasCatalogFilters(catalog) || catalog.sort !== "popular");
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
        <SearchForm catalog={catalog} />
      </div>
      <ShelfLinks design={design} />
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start">
        <CatalogSide catalog={catalog} />
        <div className="min-w-0 flex-1">
          {!browsing ? (
            <>
              <ActiveFilters catalog={catalog} />
              <Results catalog={catalog} />
            </>
          ) : (
            <Collections />
          )}
        </div>
      </div>
    </main>
  );
}

async function Results({ catalog }: { catalog: CatalogQuery }) {
  const { q: query, origin } = catalog;
  if (query.length > 0 && query.length < 2 && !hasCatalogFilters(catalog) && !origin) {
    return <Empty text={t("home.tooShort")} />;
  }

  const typed = query.length >= 2 ? query : "";
  const result = await searchGames(typed, toSearchFilters(catalog), 0, origin || undefined);
  if (result.games.length === 0) {
    return <Empty text={t("home.nothing")} />;
  }
  const params = catalogParams({ ...catalog, q: typed }).toString();

  return (
    <div>
      {origin ? (
        <h2 className="mb-6 font-display text-3xl tracking-tight">
          {t(origin === "ru" ? "home.russianGames" : "home.ukrainianGames")}
        </h2>
      ) : null}
      <SearchResults key={params} params={params} games={result.games} hasMore={result.hasMore} />
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

// Solid pastel tiles in light; in dark the colour moves to a tint, the text and the edge.
const GENRE_TILE: Record<CatalogGenreId, string> = {
  rpg: "bg-tile-coral dark:bg-tile-coral/12 dark:text-tile-coral dark:ring-tile-coral/30",
  shooter: "bg-tile-sun dark:bg-tile-sun/12 dark:text-tile-sun dark:ring-tile-sun/30",
  adventure: "bg-tile-mint dark:bg-tile-mint/12 dark:text-tile-mint dark:ring-tile-mint/30",
  strategy: "bg-tile-lilac dark:bg-tile-lilac/12 dark:text-tile-lilac dark:ring-tile-lilac/30",
  indie: "bg-tile-rose dark:bg-tile-rose/12 dark:text-tile-rose dark:ring-tile-rose/30",
  racing: "bg-tile-sky dark:bg-tile-sky/12 dark:text-tile-sky dark:ring-tile-sky/30",
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {CATALOG_GENRES.map((genre) => (
            <a
              key={genre.id}
              href={`/genres/${genre.id}`}
              className={`flex h-16 items-center gap-2.5 rounded-2xl px-3 text-[#1b1530] ring-1 ring-transparent transition hover:-translate-y-0.5 ${GENRE_TILE[genre.id]}`}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/45 dark:bg-current/10">
                <GenreGlyph genre={genre.id} />
              </span>
              <span className="min-w-0 truncate font-display text-base font-bold">{t(GENRE_LABEL[genre.id])}</span>
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
