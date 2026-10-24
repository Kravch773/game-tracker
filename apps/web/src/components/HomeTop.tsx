import { t, type ActivityEvent, type AuthUser, type GameSummary, type HomeResponse } from "@gametracker/shared";
import { formatDate, formatReleaseDate, formatShortDate } from "@/lib/format";
import { ratingLabel } from "@/lib/library";
import { primaryClass, quietClass } from "@/lib/ui";

function gameHref(game: GameSummary): string {
  return `/games/${encodeURIComponent(game.slug)}`;
}

function when(game: GameSummary): string {
  return game.releaseDate ? formatReleaseDate(game.releaseDate) : t("common.unknownDate");
}

function Cover({ game, className }: { game: GameSummary; className: string }) {
  return game.coverUrl ? (
    <img src={game.coverUrl} alt="" className={`object-cover ${className}`} />
  ) : (
    <span className={`block bg-raised ${className}`} />
  );
}

// One line that stands in for the folded block.
export function homeTopSummary(home: HomeResponse, user: AuthUser | null): string {
  const mine = user ? (home.upcomingBacklog ?? []) : [];
  const lead = mine[0] ?? home.collections.find((section) => section.id === "upcoming")?.games[0];
  const label = mine.length > 0 ? t("collections.fromYourList") : t("dash.soon");
  return lead ? `${label} · ${lead.title} · ${when(lead)}` : label;
}

// Console: one big "coming from your list" card with the next two beside it.
export function ConsoleHero({ home, user }: { home: HomeResponse; user: AuthUser | null }) {
  const mine = user ? (home.upcomingBacklog ?? []) : [];
  const upcoming = home.collections.find((section) => section.id === "upcoming")?.games ?? [];
  const games = mine.length > 0 ? mine : upcoming;
  const [lead, ...rest] = games;
  if (!lead) return null;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <a
        href={gameHref(lead)}
        className="group relative flex min-h-72 overflow-hidden rounded-3xl border border-line bg-panel lg:col-span-2"
      >
        {lead.coverUrl ? (
          <img src={lead.coverUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
        ) : null}
        <div className="relative flex flex-1 items-end gap-6 p-6 sm:p-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.14em] text-accent-fg uppercase">
              {mine.length > 0 ? t("collections.fromYourList") : t("dash.soon")}
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">{lead.title}</h2>
            <p className="mt-2 text-sm text-muted">
              {when(lead)}
              {lead.platforms.length > 0 ? ` · ${lead.platforms.slice(0, 3).join(", ")}` : ""}
            </p>
            <span className={`${primaryClass} mt-5`}>{t("dash.open")}</span>
          </div>
          <Cover game={lead} className="hidden h-56 w-42 shrink-0 rounded-2xl shadow-2xl sm:block" />
        </div>
      </a>
      <div className="flex flex-col gap-4">
        {rest.slice(0, 2).map((game) => (
          <a key={game.id} href={gameHref(game)} className="flex flex-1 items-center gap-4 rounded-3xl border border-line bg-panel p-4 hover:border-ink/25">
            <Cover game={game} className="h-24 w-18 shrink-0 rounded-xl" />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-accent-fg">{when(game)}</span>
              <span className="mt-1 block font-semibold">{game.title}</span>
            </span>
          </a>
        ))}
        <a href="/calendar" className={`${quietClass} justify-between`}>
          {t("calendar.title")}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

const tile = "rounded-[32px] p-6";

// Shelf: personal bento tiles above the catalog.
export function ShelfBento({ home, user, events }: { home: HomeResponse; user: AuthUser | null; events: ActivityEvent[] }) {
  const playing = home.playing?.[0];
  const soon = (user ? home.upcomingBacklog : null) ?? home.collections.find((section) => section.id === "upcoming")?.games ?? [];
  const profile = user ? `/u/${encodeURIComponent(user.username)}` : null;

  return (
    <section className="flex flex-wrap gap-5">
      {user ? (
        <a href={playing ? gameHref(playing) : profile ?? "/"} className={`${tile} flex min-h-72 flex-[5_1_420px] gap-6 bg-strong text-strong-ink`}>
          {playing ? <Cover game={playing} className="w-40 shrink-0 rounded-3xl" /> : null}
          <span className="flex min-w-0 flex-col gap-3">
            <span className="self-start rounded-full bg-tile-mint px-3 py-1 text-sm font-bold text-[#1b1530]">{t("dash.playingNow")}</span>
            <span className="font-display text-4xl leading-none font-extrabold">{playing ? playing.title : t("dash.nothingPlaying")}</span>
            {playing?.releaseDate ? <span className="text-strong-ink/70">{when(playing)}</span> : null}
          </span>
        </a>
      ) : (
        <div className={`${tile} flex min-h-72 flex-[5_1_420px] flex-col justify-between gap-6 bg-strong text-strong-ink`}>
          <div>
            <h2 className="font-display text-5xl leading-none font-extrabold">{t("dash.welcomeTitle")}</h2>
            <p className="mt-3 max-w-md text-strong-ink/75">{t("dash.welcomeLead")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/register" className="inline-flex h-12 items-center rounded-full bg-accent px-6 font-bold text-accent-ink">
              {t("nav.register")}
            </a>
            <a href="/login" className="inline-flex h-12 items-center rounded-full bg-strong-ink/10 px-6 font-bold">
              {t("nav.login")}
            </a>
          </div>
        </div>
      )}

      <div className={`${tile} flex flex-[3_1_260px] flex-col gap-3 bg-tile-sun text-[#1b1530]`}>
        <h2 className="font-display text-xl font-extrabold">{user && home.upcomingBacklog?.length ? t("collections.fromYourList") : t("dash.soon")}</h2>
        <ul className="flex flex-col">
          {soon.slice(0, 4).map((game) => (
            <li key={game.id} className="border-b border-[#1b1530]/15 last:border-0">
              <a href={gameHref(game)} className="flex min-h-13 items-center gap-3">
                <span className="w-20 shrink-0 font-display text-sm font-extrabold">{game.releaseDate ? formatShortDate(game.releaseDate) : "—"}</span>
                <span className="truncate font-semibold">{game.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <a href="/calendar" className="mt-auto font-bold">
          {t("calendar.title")} →
        </a>
      </div>

      <div className={`${tile} flex flex-[3_1_260px] flex-col gap-3 ${user ? "bg-tile-lilac" : "bg-tile-sky"} text-[#1b1530]`}>
        {user ? (
          <>
            <h2 className="font-display text-xl font-extrabold">{t("dash.randomGame")}</h2>
            <p className="font-medium">{t("dash.randomLead")}</p>
            <span
              aria-hidden="true"
              className="mx-auto my-2 block h-28 w-28 rounded-full bg-[conic-gradient(#ff6b4a_0_60deg,#ffd84d_60deg_120deg,#7be0c3_120deg_180deg,#ffffff_180deg_240deg,#8fd3ff_240deg_300deg,#ffb3c7_300deg_360deg)]"
            />
            <a href={`${profile}?list=backlog`} className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-[#1b1530] font-bold text-white">
              {t("dash.spin")}
            </a>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-extrabold">{t("calendar.title")}</h2>
            <p className="font-medium">{t("dash.calendarLead")}</p>
            <a href="/calendar" className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-[#1b1530] font-bold text-white">
              {t("dash.soon")} →
            </a>
          </>
        )}
      </div>

      <div className={`${tile} flex flex-[4_1_360px] flex-col gap-3 bg-panel`}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-extrabold">{t("dash.feed")}</h2>
          <a href="/activity" className="text-sm font-semibold text-muted hover:text-ink">
            {t("dash.all")} →
          </a>
        </div>
        {events.length === 0 ? <p className="text-muted">{t("activity.empty")}</p> : null}
        <ul className="flex flex-col gap-3">
          {events.slice(0, 3).map((event) => (
            <li key={`${event.username}-${event.game.id}-${event.at}`} className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tile-rose font-display font-extrabold text-[#1b1530]">
                {event.username.slice(0, 1).toUpperCase()}
              </span>
              <p className="min-w-0 text-sm leading-snug">
                <a href={`/u/${encodeURIComponent(event.username)}`} className="font-bold">
                  {event.username}
                </a>{" "}
                <span className="text-muted">{t(`status.${event.status}`).toLowerCase()}</span>{" "}
                <a href={gameHref(event.game)} className="font-bold">
                  {event.game.title}
                </a>
                {event.rating != null ? <span className="text-muted"> · {ratingLabel(event.rating)}</span> : null}
                <span className="block text-xs text-muted">{formatDate(event.at)}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
