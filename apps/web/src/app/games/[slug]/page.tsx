import { TRAILERS_ENABLED, t, type GameDetails, type GameEntry, type GameLinkKind } from "@gametracker/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionRow } from "@/components/CollectionRow";
import { JsonLd } from "@/components/JsonLd";
import { Icon, IconBadge, type IconName } from "@/components/Icon";
import { LibraryPanel } from "@/components/LibraryPanel";
import { ReviewList } from "@/components/ReviewList";
import { TrailersButton } from "@/components/TrailersButton";
import { VideoList } from "@/components/VideoList";
import { formatHours } from "@/lib/format";
import { genreIcon } from "@/lib/marks";
import { getGame, getGameEntry, getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { absoluteUrl, pageMetadata, textSnippet } from "@/lib/site";

export const dynamic = "force-dynamic";

const LINK_LABELS: Record<Exclude<GameLinkKind, "official">, string> = {
  steam: "Steam",
  gog: "GOG",
  epic: "Epic Games",
  wikipedia: "Wikipedia",
  metacritic: "Metacritic",
};

function linkLabel(kind: GameLinkKind): string {
  return kind === "official" ? t("links.official") : LINK_LABELS[kind];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await applyLocale();
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return pageMetadata({ title: t("game.notFound"), description: t("meta.description"), path: `/games/${slug}`, index: false });
  return pageMetadata({
    title: game.title,
    description: textSnippet(game.summary, t("meta.description")),
    path: `/games/${game.slug}`,
    image: game.coverUrl,
    imageAlt: game.title,
  });
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  await applyLocale();
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  const me = await getMe();
  const entry = me ? await getGameEntry(slug) : null;
  const saved: GameEntry = entry ?? { status: null, rating: null, review: null, favorite: false, steamMinutes: null };
  const year = game.releaseDate?.slice(0, 4);

  return (
    <main>
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow" />
        {t("common.backToSearch")}
      </a>
      <article className="mt-5 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            className="w-full max-w-56 rounded-3xl object-cover shadow-2xl ring-1 ring-white/10"
          />
        ) : (
          <div className="aspect-[3/4] w-full max-w-56 rounded-3xl bg-raised ring-1 ring-white/10" />
        )}
        <div className="min-w-0">
          <JsonLd data={gameJsonLd(game)} />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{game.title}</h1>
          <p className="mt-3 text-muted">
            {[year, game.platforms.join(" · ")].filter(Boolean).join(" · ") || t("common.unknownDate")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <CommunityScore count={game.community?.count ?? 0} average={game.community?.average ?? null} />
            {saved.steamMinutes != null ? (
              <Score
                label="Steam"
                value={t("game.hours", { hours: formatHours(Math.round((saved.steamMinutes / 60) * 10) / 10) })}
                icon="steam"
                tone="bg-sky-300 text-sky-950"
              />
            ) : null}
            {game.metacriticScore != null ? (
              <Score label="Metacritic" value={String(game.metacriticScore)} icon="meta" tone="bg-emerald-300 text-emerald-950" />
            ) : null}
            {game.igdbRating != null ? (
              <Score label="IGDB" value={game.igdbRating.toFixed(1)} icon="chart" tone="bg-sky-300 text-sky-950" />
            ) : null}
            {game.genres.map((genre) => {
              const icon = genreIcon(genre);
              return (
                <span key={genre} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-muted">
                  {icon ? <Icon name={icon} className="h-3.5 w-3.5" /> : null}
                  {genre}
                </span>
              );
            })}
          </div>
          <FactList game={game} />
          {game.summary ? <p className="mt-5 max-w-3xl text-lg leading-8">{game.summary}</p> : null}
          {game.links.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {game.links.map((link) => (
                <li key={link.kind}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white/5 pr-4 pl-1.5 text-sm hover:border-accent"
                  >
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${LINK_MARK[link.kind].tone}`}>
                      <Icon name={LINK_MARK[link.kind].icon} className="h-3.5 w-3.5" />
                    </span>
                    {linkLabel(link.kind)}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {TRAILERS_ENABLED ? <TrailersButton slug={game.slug} /> : null}
          <LibraryPanel slug={game.slug} loggedIn={me != null} entry={saved} />
        </div>
      </article>
      {(game.similar ?? []).length > 0 ? (
        <div className="mt-12">
          <CollectionRow
            title={t("game.similar")}
            games={game.similar}
            mark={{ icon: "layers", tone: "bg-violet-300/10 text-violet-300" }}
          />
        </div>
      ) : null}
      {game.storyline ? (
        <section className="mt-12 max-w-3xl">
          <SectionTitle icon="book" tone="bg-amber-300/10 text-amber-300">
            {t("game.story")}
          </SectionTitle>
          <p className="mt-3 leading-8 text-muted">{game.storyline}</p>
        </section>
      ) : null}
      {game.screenshots.length > 0 ? (
        <section className="mt-12">
          <SectionTitle icon="camera" tone="bg-sky-300/10 text-sky-300">
            {t("game.screenshots")}
          </SectionTitle>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {game.screenshots.map((shot) => (
              <li key={shot.url} className="overflow-hidden rounded-2xl border border-line">
                <img src={shot.url} alt="" className="aspect-video w-full object-cover" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {game.videos.length > 0 ? (
        <section className="mt-12">
          <SectionTitle icon="film" tone="bg-rose-300/10 text-rose-300">
            {t("game.videos")}
          </SectionTitle>
          <VideoList videos={game.videos} />
        </section>
      ) : null}
      <ReviewList reviews={game.reviews ?? []} />
    </main>
  );
}

const LINK_MARK: Record<GameLinkKind, { icon: IconName; tone: string }> = {
  steam: { icon: "steam", tone: "bg-sky-300 text-sky-950" },
  gog: { icon: "gog", tone: "bg-violet-300 text-violet-950" },
  epic: { icon: "epic", tone: "bg-zinc-100 text-zinc-900" },
  wikipedia: { icon: "wiki", tone: "bg-stone-200 text-stone-900" },
  metacritic: { icon: "meta", tone: "bg-emerald-300 text-emerald-950" },
  official: { icon: "link", tone: "bg-accent text-accent-ink" },
};

function FactList({ game }: { game: { developers: string[]; publishers: string[]; themes: string[]; ageRatings: string[]; timeToBeat: { hastily: number | null; normally: number | null; completely: number | null } | null } }) {
  const facts = [
    { icon: "building" as const, tone: "bg-sky-300/10 text-sky-300", label: t("game.developers"), value: (game.developers ?? []).join(", ") },
    { icon: "users" as const, tone: "bg-violet-300/10 text-violet-300", label: t("game.publishers"), value: (game.publishers ?? []).join(", ") },
    { icon: "tag" as const, tone: "bg-amber-300/10 text-amber-300", label: t("game.themes"), value: (game.themes ?? []).join(", ") },
    { icon: "shield" as const, tone: "bg-emerald-300/10 text-emerald-300", label: t("game.age"), value: (game.ageRatings ?? []).join(", ") },
  ].filter((item) => item.value);
  const beat = game.timeToBeat;
  const time = beat
    ? [
        beat.hastily != null ? `${t("game.hastily")} ${t("game.hours", { hours: formatHours(beat.hastily) })}` : null,
        beat.normally != null ? `${t("game.normally")} ${t("game.hours", { hours: formatHours(beat.normally) })}` : null,
        beat.completely != null ? `${t("game.completely")} ${t("game.hours", { hours: formatHours(beat.completely) })}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  if (facts.length === 0 && !time) return null;
  return (
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="flex gap-3 rounded-2xl border border-line bg-panel/70 p-3">
          <IconBadge name={fact.icon} tone={fact.tone} />
          <div className="min-w-0">
            <dt className="text-muted">{fact.label}</dt>
            <dd className="mt-1">{fact.value}</dd>
          </div>
        </div>
      ))}
      {time ? (
        <div className="flex gap-3 rounded-2xl border border-line bg-panel/70 p-3">
          <IconBadge name="clock" tone="bg-rose-300/10 text-rose-300" />
          <div className="min-w-0">
            <dt className="text-muted">{t("game.time")}</dt>
            <dd className="mt-1">{time}</dd>
          </div>
        </div>
      ) : null}
    </dl>
  );
}

function SectionTitle({ icon, tone, children }: { icon: IconName; tone: string; children: string }) {
  return (
    <h2 className="flex items-center gap-2.5 font-display text-2xl">
      <IconBadge name={icon} tone={tone} />
      {children}
    </h2>
  );
}

function CommunityScore({ count, average }: { count: number; average: number | null }) {
  const enough = count > 5 && average != null;
  return (
    <span className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-2.5 pr-3 text-sm font-semibold text-accent-ink">
      <Icon name="gamepad" className="h-3.5 w-3.5" />
      <span className="font-medium opacity-70">GameTracker</span>
      {enough ? average.toFixed(1) : "—"}
      {enough ? null : <FewRatingsHint />}
    </span>
  );
}

function FewRatingsHint() {
  const text = t("game.fewRatings");
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] leading-none font-bold"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-xl border border-line bg-panel px-3 py-2 text-left text-xs font-medium text-ink shadow-lg group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}

function gameJsonLd(game: GameDetails) {
  const rating =
    game.community.count > 0 && game.community.average != null && game.community.average <= 10
      ? {
          "@type": "AggregateRating",
          ratingValue: game.community.average,
          ratingCount: game.community.count,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    url: absoluteUrl(`/games/${game.slug}`),
    description: textSnippet(game.summary, t("meta.description")),
    image: game.coverUrl ?? undefined,
    datePublished: game.releaseDate ?? undefined,
    genre: game.genres.length > 0 ? game.genres : undefined,
    gamePlatform: game.platforms.length > 0 ? game.platforms : undefined,
    author: game.developers.length > 0 ? game.developers.map((name) => ({ "@type": "Organization", name })) : undefined,
    publisher: game.publishers.length > 0 ? game.publishers.map((name) => ({ "@type": "Organization", name })) : undefined,
    aggregateRating: rating,
  };
}

function Score({ label, value, icon, tone }: { label: string; value: string; icon: IconName; tone: string }) {
  return (
    <span className={`inline-flex h-9 items-center gap-2 rounded-full px-2.5 pr-3 text-sm font-semibold ${tone}`}>
      <Icon name={icon} className="h-3.5 w-3.5" />
      <span className="font-medium opacity-70">{label}</span>
      {value}
    </span>
  );
}
