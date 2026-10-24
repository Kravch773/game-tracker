import { TRAILERS_ENABLED, t, type GameDetails, type GameEntry, type GameLinkKind, type GameOrigin } from "@gametracker/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionRow } from "@/components/CollectionRow";
import { JsonLd } from "@/components/JsonLd";
import { Icon, IconBadge, type IconName } from "@/components/Icon";
import { LibraryPanel } from "@/components/LibraryPanel";
import { ReviewList } from "@/components/ReviewList";
import { TrailersButton } from "@/components/TrailersButton";
import { VideoList } from "@/components/VideoList";
import { formatHours, formatReleaseDate } from "@/lib/format";
import { genreIcon } from "@/lib/marks";
import { getGame, getGameEntry, getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import type { Design } from "@/lib/look-cookie";
import { screenshotAt, sharpCover } from "@/lib/images";
import { youtubeIdOf } from "@/lib/video";
import { getLook } from "@/lib/look";
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

  const [me, { design }] = await Promise.all([getMe(), getLook()]);
  const entry = me ? await getGameEntry(slug) : null;
  const saved: GameEntry = entry ?? { status: null, rating: null, review: null, favorite: false, steamMinutes: null };
  const scores = <Scores game={game} saved={saved} design={design} />;
  const panel = <LibraryPanel slug={game.slug} loggedIn={me != null} entry={saved} design={design} />;
  const facts = (
    <>
      <ChipGroup label={t("game.platforms")} items={game.platforms} />
      <ChipGroup label={t("game.genres")} items={game.genres} iconFor={genreIcon} />
      <ChipGroup label={t("game.themes")} items={game.themes} />
      <ChipGroup label={t("game.age")} items={game.ageRatings} />
      <TimeToBeat time={game.timeToBeat} />
    </>
  );
  const credits = (
    <Credits
      developers={game.developers}
      publishers={game.publishers}
      russianDevelopers={game.russianDevelopers ?? []}
      russianPublishers={game.russianPublishers ?? []}
      series={game.series}
    />
  );
  const date = game.releaseDate ? formatReleaseDate(game.releaseDate) : t("common.unknownDate");

  if (design === "shelf") {
    return (
      <main className="flex flex-col gap-5">
        <JsonLd data={gameJsonLd(game)} />
        <div className="flex flex-wrap gap-5">
          <article className="flex flex-[5_1_440px] flex-col gap-4 rounded-[32px] bg-panel p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex h-8 items-center rounded-full bg-tile-sun px-3 text-sm font-bold text-[#1b1530]">{date}</span>
              <OriginTags origins={game.origins} text={game.ukrainianText} audio={game.ukrainianAudio} inline />
            </div>
            <h1 className="font-display text-5xl leading-none font-extrabold tracking-tight sm:text-6xl">{game.title}</h1>
            {credits}
            {scores}
            {game.summary ? <p className="text-[15px] leading-7 text-ink/80">{game.summary}</p> : null}
            <div className="flex flex-col gap-4">{facts}</div>
            <StoreLinks links={game.links} variant="pills" />
            {TRAILERS_ENABLED ? <TrailersButton slug={game.slug} /> : null}
          </article>
          {/* The cover keeps its own 3:4 shape above the list card instead of stretching to the info tile's height. */}
          <div className="order-first flex flex-[3_1_280px] flex-col gap-5 md:order-none">
            {game.coverUrl ? (
              <img src={sharpCover(game.coverUrl)} alt={game.title} className="aspect-[3/4] w-full rounded-[32px] object-cover" />
            ) : (
              <div className="aspect-[3/4] w-full rounded-[32px] bg-raised" />
            )}
            {panel}
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          {game.screenshots.length > 0 || game.videos.length > 0 ? (
            <section className="min-w-0 flex-[7_1_560px] rounded-[32px] bg-panel p-6">
              <h2 className="font-display text-xl font-extrabold">{t("game.media")}</h2>
              <Media shots={game.screenshots} videos={game.videos} />
            </section>
          ) : null}
          {game.storyline ? (
            <section className="flex-[5_1_380px] rounded-[32px] bg-tile-sun p-6 text-[#1b1530]">
              <h2 className="font-display text-xl font-extrabold">{t("game.story")}</h2>
              <p className="mt-3 leading-7">{game.storyline}</p>
            </section>
          ) : null}
        </div>
        <section className="rounded-[32px] bg-panel p-6">
          <ReviewList reviews={game.reviews ?? []} />
        </section>
        {(game.similar ?? []).length > 0 ? (
          <section className="rounded-[32px] bg-panel p-6">
            <CollectionRow title={t("game.similar")} games={game.similar} rows={1} mark={{ icon: "layers", tone: "bg-violet-300/10 text-violet-700 dark:text-violet-300" }} />
          </section>
        ) : null}
      </main>
    );
  }

  const backdrop = game.screenshots[0] ? screenshotAt(game.screenshots[0].url, "t_1080p") : game.coverUrl ? sharpCover(game.coverUrl) : null;
  const sections = [
    game.storyline ? { id: "story", label: t("game.story") } : null,
    game.screenshots.length > 0 || game.videos.length > 0 ? { id: "media", label: t("game.media") } : null,
    (game.reviews ?? []).length > 0 ? { id: "reviews", label: t("game.reviews") } : null,
    (game.similar ?? []).length > 0 ? { id: "similar", label: t("game.similar") } : null,
  ].filter((item) => item != null);

  return (
    <main>
      <JsonLd data={gameJsonLd(game)} />
      <div className="relative -mx-4 -mt-8 h-64 overflow-hidden sm:h-80 lg:-mx-10">
        {backdrop ? <img src={backdrop} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-raised" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
        <a
          href="/"
          className="absolute top-4 left-4 inline-flex h-11 items-center gap-1.5 rounded-xl bg-black/55 px-3 text-sm font-semibold text-white backdrop-blur lg:left-10"
        >
          <Icon name="arrow" />
          {t("common.backToSearch")}
        </a>
      </div>
      <div className="relative -mt-28 grid items-start gap-8 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          {game.coverUrl ? (
            <img src={sharpCover(game.coverUrl)} alt={game.title} className="aspect-[3/4] w-44 rounded-3xl object-cover shadow-2xl ring-1 ring-ink/10 md:w-full" />
          ) : (
            <div className="aspect-[3/4] w-44 rounded-3xl bg-raised ring-1 ring-ink/10 md:w-full" />
          )}
          {panel}
          <StoreLinks links={game.links} variant="list" />
        </aside>
        <article className="min-w-0 md:pt-32">
          <OriginTags origins={game.origins} text={game.ukrainianText} audio={game.ukrainianAudio} />
          <p className="text-sm text-muted">{date}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-6xl">{game.title}</h1>
          {credits}
          <div className="mt-5">{scores}</div>
          {sections.length > 0 ? (
            <nav aria-label={game.title} className="mt-8 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
              <a href="#about" className="-mb-px inline-flex h-11 shrink-0 items-center border-b-2 border-accent-fg px-3 text-sm font-semibold">
                {t("game.about")}
              </a>
              {sections.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="-mb-px inline-flex h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-sm font-semibold text-muted hover:text-ink">
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}
          <div id="about" className="scroll-mt-24">
            {game.summary ? <p className="mt-6 max-w-3xl text-[17px] leading-8 text-ink/85">{game.summary}</p> : null}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">{facts}</div>
            {TRAILERS_ENABLED ? <TrailersButton slug={game.slug} /> : null}
          </div>
          {game.storyline ? (
            <section id="story" className="mt-12 max-w-3xl scroll-mt-24">
              <SectionTitle icon="book" tone="bg-amber-300/10 text-amber-700 dark:text-amber-300">
                {t("game.story")}
              </SectionTitle>
              <p className="mt-3 leading-8 text-muted">{game.storyline}</p>
            </section>
          ) : null}
          {game.screenshots.length > 0 || game.videos.length > 0 ? (
            <section id="media" className="mt-12 scroll-mt-24">
              <SectionTitle icon="camera" tone="bg-sky-300/10 text-sky-700 dark:text-sky-300">
                {t("game.media")}
              </SectionTitle>
              <Media shots={game.screenshots} videos={game.videos} />
            </section>
          ) : null}
          <div id="reviews" className="scroll-mt-24">
            <ReviewList reviews={game.reviews ?? []} />
          </div>
        </article>
      </div>
      {(game.similar ?? []).length > 0 ? (
        <div id="similar" className="mt-12 scroll-mt-24">
          <CollectionRow title={t("game.similar")} games={game.similar} rows={1} mark={{ icon: "layers", tone: "bg-violet-300/10 text-violet-700 dark:text-violet-300" }} />
        </div>
      ) : null}
    </main>
  );
}

function Scores({ game, saved, design }: { game: GameDetails; saved: GameEntry; design: Design }) {
  const enough = (game.community?.count ?? 0) > 5 && game.community?.average != null;
  const cards: { key: string; label: string; value: string; icon: IconName; tile: string; hint?: boolean }[] = [
    {
      key: "gt",
      label: "GameTracker",
      value: enough ? (game.community.average as number).toFixed(1) : "—",
      icon: "gamepad",
      tile: "bg-tile-mint",
      hint: !enough,
    },
  ];
  if (saved.steamMinutes != null) {
    cards.push({
      key: "steam",
      label: "Steam",
      value: t("game.hours", { hours: formatHours(Math.round((saved.steamMinutes / 60) * 10) / 10) }),
      icon: "steam",
      tile: "bg-tile-sky",
    });
  }
  if (game.metacriticScore != null) cards.push({ key: "meta", label: "Metacritic", value: String(game.metacriticScore), icon: "meta", tile: "bg-tile-lilac" });
  if (game.igdbRating != null) cards.push({ key: "igdb", label: "IGDB", value: game.igdbRating.toFixed(1), icon: "chart", tile: "bg-tile-sun" });
  const shelf = design === "shelf";

  return (
    <div className="flex flex-wrap gap-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`min-w-36 flex-1 rounded-2xl px-4 py-3 sm:flex-none ${shelf ? `${card.tile} text-[#1b1530]` : "border border-line bg-panel"}`}
        >
          <p className={`inline-flex items-center gap-1.5 text-xs ${shelf ? "opacity-75" : "text-muted"}`}>
            <Icon name={card.icon} className="h-3.5 w-3.5" />
            {card.label}
            {card.hint ? <FewRatingsHint /> : null}
          </p>
          <p className="mt-1 font-display text-2xl leading-tight">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// The first YouTube video plays inline as the big tile; screenshots fill the grid around it.
function Media({ shots, videos }: { shots: GameDetails["screenshots"]; videos: GameDetails["videos"] }) {
  const lead = videos.find((video) => youtubeIdOf(video.url));
  const leadId = lead ? youtubeIdOf(lead.url) : null;
  const rest = videos.filter((video) => video !== lead);
  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {lead && leadId ? (
          <li className="col-span-2 row-span-2 overflow-hidden rounded-2xl border border-line bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${leadId}?rel=0`}
              title={lead.name || t("game.watchOnYoutube")}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="aspect-video h-full w-full border-0"
            />
          </li>
        ) : null}
        {shots.map((shot, index) => (
          <li key={shot.url} className={`overflow-hidden rounded-2xl border border-line ${!lead && index === 0 ? "col-span-2 row-span-2" : ""}`}>
            <img
              src={!lead && index === 0 ? screenshotAt(shot.url, "t_screenshot_huge") : shot.url}
              alt=""
              loading="lazy"
              className="aspect-video h-full w-full object-cover"
            />
          </li>
        ))}
      </ul>
      {rest.length > 0 ? <VideoList videos={rest} /> : null}
    </>
  );
}

function StoreLinks({ links, variant }: { links: GameDetails["links"]; variant: "list" | "pills" }) {
  if (links.length === 0) return null;
  if (variant === "pills") {
    return (
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.kind}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink px-4 text-sm font-bold hover:bg-ink hover:text-bg"
            >
              {linkLabel(link.kind)} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <section className="rounded-3xl border border-line bg-panel p-4">
      <h2 className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{t("game.stores")}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.kind}>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center gap-2.5 rounded-xl bg-raised px-2 text-sm font-semibold hover:ring-1 hover:ring-accent-fg"
            >
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${LINK_MARK[link.kind].tone}`}>
                <Icon name={LINK_MARK[link.kind].icon} className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">{linkLabel(link.kind)}</span>
              <span aria-hidden="true" className="text-muted">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
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

function OriginTags({ origins, text, audio, inline = false }: { origins: GameOrigin[]; text: boolean; audio: boolean; inline?: boolean }) {
  const tags: { key: string; label: string; tone: string }[] = [];
  if (origins.includes("ua")) tags.push({ key: "ua", label: t("game.ukrainianGame"), tone: "bg-yellow-300 text-yellow-950" });
  if (origins.includes("ru")) tags.push({ key: "ru", label: t("game.russianGame"), tone: "bg-red-500 text-white" });
  if (text || audio) {
    const label = text && audio ? t("game.ukrainianTextVoice") : audio ? t("game.ukrainianVoice") : t("game.ukrainianText");
    tags.push({ key: "lang", label, tone: "bg-sky-400 text-sky-950" });
  }
  if (tags.length === 0) return null;
  return (
    <div className={inline ? "contents" : "mb-4 flex flex-wrap gap-2"}>
      {tags.map((tag) => (
        <span key={tag.key} className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold ${tag.tone}`}>
          {tag.label}
        </span>
      ))}
    </div>
  );
}

function Credits({
  developers,
  publishers,
  russianDevelopers,
  russianPublishers,
  series,
}: {
  developers: string[];
  publishers: string[];
  russianDevelopers: string[];
  russianPublishers: string[];
  series: string | null;
}) {
  if (developers.length === 0 && publishers.length === 0 && !series) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {series ? <CompanyLinks role="series" label={t("game.series")} names={[series]} /> : null}
      <CompanyLinks role="developer" label={t("game.developers")} names={developers} marked={russianDevelopers} tip={t("game.russianDeveloper")} />
      <CompanyLinks role="publisher" label={t("game.publishers")} names={publishers} marked={russianPublishers} tip={t("game.russianPublisher")} />
    </div>
  );
}

function CompanyLinks({
  role,
  label,
  names,
  marked = [],
  tip = "",
}: {
  role: "developer" | "publisher" | "series";
  label: string;
  names: string[];
  marked?: string[];
  tip?: string;
}) {
  if (names.length === 0) return null;
  const param = role === "series" ? "series" : role;
  const markedNames = new Set(marked);
  return (
    <div className="inline-flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-raised px-3 py-1.5 text-sm sm:min-h-9">
      <span className="text-muted">{label}</span>
      {names.map((name, index) => {
        const russian = markedNames.has(name);
        return (
          <span key={name} className="inline-flex items-center gap-1">
            <a
              href={`/?${param}=${encodeURIComponent(name)}`}
              className={
                russian
                  ? "font-semibold text-red-700 underline decoration-red-500/50 underline-offset-4 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                  : "font-semibold text-ink hover:text-accent-fg"
              }
            >
              {name}
            </a>
            {russian ? <OriginTip label={tip} /> : null}
            {index < names.length - 1 ? <span className="text-muted">,</span> : null}
          </span>
        );
      })}
    </div>
  );
}

function OriginTip({ label }: { label: string }) {
  return (
    <span className="group/tip relative inline-flex" tabIndex={0} aria-label={label}>
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-red-700 dark:text-red-300" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="4.9" r="0.8" fill="currentColor" />
        <path d="M8 7.15v4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-30 hidden -translate-x-1/2 rounded-lg border border-red-500/40 bg-bg px-2.5 py-1 text-xs font-medium whitespace-nowrap text-red-800 dark:text-red-200 shadow-lg group-hover/tip:block group-focus/tip:block"
      >
        {label}
      </span>
    </span>
  );
}

function ChipGroup({
  label,
  items,
  iconFor,
}: {
  label: string;
  items: string[];
  iconFor?: (item: string) => IconName | null;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{label}</h2>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {items.map((item) => {
          const icon = iconFor?.(item);
          return (
            <li key={item} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-ink/5 px-2.5 text-sm">
              {icon ? <Icon name={icon} className="h-3.5 w-3.5 text-muted" /> : null}
              {item}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TimeToBeat({ time }: { time: GameDetails["timeToBeat"] }) {
  if (!time) return null;
  const items = [
    time.hastily != null ? { label: t("game.hastily"), hours: time.hastily } : null,
    time.normally != null ? { label: t("game.normally"), hours: time.normally } : null,
    time.completely != null ? { label: t("game.completely"), hours: time.completely } : null,
  ].filter((item) => item != null);
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{t("game.time")}</h2>
      <ul className="mt-2.5 flex flex-wrap gap-x-8 gap-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-sm font-medium">{t("game.hours", { hours: formatHours(item.hours) })}</p>
          </li>
        ))}
      </ul>
    </section>
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

