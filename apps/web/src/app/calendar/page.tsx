import { getLocale, t, type ReleaseGame } from "@gametracker/shared";
import type { Metadata } from "next";
import { CalendarSide } from "@/components/CalendarSide";
import { IconBadge } from "@/components/Icon";
import { getCalendar } from "@/lib/api";
import { formatCalendarDay, formatMonth } from "@/lib/format";
import { applyLocale } from "@/lib/locale";
import { getLook } from "@/lib/look";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}): Promise<Metadata> {
  await applyLocale();
  const { month } = await searchParams;
  const filtered = Boolean(month && /^\d{4}-\d{2}$/.test(month));
  return pageMetadata({
    title: t("calendar.title"),
    description: t("meta.calendar"),
    path: "/calendar",
    index: !filtered,
    follow: true,
  });
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; mine?: string; platform?: string }>;
}) {
  await applyLocale();
  const { month, mine: mineParam, platform } = await searchParams;
  const requested = month && /^\d{4}-\d{2}$/.test(month) ? month : undefined;
  const [calendar, { design }] = await Promise.all([getCalendar(requested), getLook()]);
  const mine = calendar.mine ?? [];
  const mineIds = new Set(mine.map((game) => game.id));
  const mineDates = new Set(mine.map((game) => game.releaseDate?.slice(0, 10)).filter((date): date is string => Boolean(date)));
  const onlyMine = mineParam === "1" && mine.length > 0;
  const platforms = [...new Set(calendar.days.flatMap((day) => day.games.flatMap((game) => game.releasePlatforms)))].sort();
  const pickedPlatform = platform && platforms.includes(platform) ? platform : "";
  const today = todayStamp();
  const days = calendar.days
    .map((day) => ({
      ...day,
      games: day.games.filter(
        (game) => (!onlyMine || mineIds.has(game.id)) && (!pickedPlatform || game.releasePlatforms.includes(pickedPlatform)),
      ),
    }))
    .filter((day) => day.games.length > 0);
  const marked = new Set(calendar.days.map((day) => day.date).filter((date) => date !== "unscheduled"));
  const firstFuture = days.find((day) => day.date !== "unscheduled" && day.date > today)?.date;
  const showToday = today.slice(0, 7) === calendar.month.slice(0, 7) && days.some((day) => day.date !== "unscheduled" && day.date <= today);
  const link = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const next = { month: requested ?? "", mine: onlyMine ? "1" : "", platform: pickedPlatform, ...patch };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const query = params.toString();
    return query ? `/calendar?${query}` : "/calendar";
  };
  const shelf = design === "shelf";

  return (
    <main>
      <div className="flex flex-wrap items-center gap-4">
        <IconBadge name="calendar" tone="bg-sky-300/10 text-sky-700 dark:text-sky-300" size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl tracking-tight">{t("calendar.title")}</h1>
          <p className="mt-1 text-muted">
            <span className="capitalize">{formatMonth(calendar.month)}</span> · {t("calendar.sizeHint")}
          </p>
        </div>
        {mine.length > 0 ? (
          <div role="group" aria-label={t("calendar.mine")} className="flex rounded-full bg-panel p-1 ring-1 ring-line">
            <a href={link({ mine: "" })} aria-current={!onlyMine ? "true" : undefined} className={segmentClass(!onlyMine)}>
              {t("dash.all")}
            </a>
            <a href={link({ mine: "1" })} aria-current={onlyMine ? "true" : undefined} className={segmentClass(onlyMine)}>
              {t("calendar.mine")}
            </a>
          </div>
        ) : null}
      </div>
      {platforms.length > 1 ? (
        <nav aria-label={t("home.platform")} className="mt-5 flex flex-wrap gap-2">
          <a href={link({ platform: "" })} className={chipClass(!pickedPlatform)}>
            {t("calendar.allPlatforms")}
          </a>
          {platforms.map((item) => (
            <a key={item} href={link({ platform: item })} className={chipClass(pickedPlatform === item)}>
              {item}
            </a>
          ))}
        </nav>
      ) : null}
      <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div>
          {days.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line px-5 py-12 text-center text-muted">
              {t("calendar.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-10">
              {days.map((day) => {
                const isMine = day.games.some((game) => mineIds.has(game.id));
                const sunny = shelf && isMine;
                return (
                  <section
                    key={day.date}
                    id={day.date === "unscheduled" ? undefined : `d-${day.date}`}
                    className={shelf ? `rounded-[32px] p-6 ${sunny ? "bg-tile-sun text-[#1b1530]" : "bg-panel"}` : undefined}
                  >
                    {showToday && day.date === firstFuture ? <TodayMark /> : null}
                    <h2 className="flex flex-wrap items-center gap-3">
                      {day.date === "unscheduled" ? (
                        <IconBadge name="clock" tone="bg-amber-300/10 text-amber-700 dark:text-amber-300" />
                      ) : (
                        <span
                          className={`inline-flex h-12 min-w-12 items-center justify-center rounded-2xl px-2 font-display text-lg ${
                            shelf ? "bg-ink/10" : "bg-panel text-accent-fg ring-1 ring-line"
                          }`}
                        >
                          {day.date.slice(8, 10)}
                        </span>
                      )}
                      <span className="font-display text-2xl tracking-tight">
                        {day.date === "unscheduled" ? t("calendar.unscheduled") : formatCalendarDay(day.date)}
                      </span>
                      <span className={`text-sm ${sunny ? "opacity-70" : "text-muted"}`}>
                        {day.date === "unscheduled" ? "" : `${formatWeekday(day.date)} · `}
                        {t("calendar.count", { count: day.games.length })}
                      </span>
                    </h2>
                    <ul className="mt-5 flex flex-wrap items-start gap-x-3.5 gap-y-5">
                      {day.games.map((game) => {
                        const size = tierOf(game);
                        return (
                          <li key={game.id} className={TIER_WIDTH[size]}>
                            <a href={`/games/${game.slug}`} className="group block">
                              <span className={`relative block overflow-hidden border border-line bg-raised shadow-lg ${size === "sm" ? "rounded-xl" : "rounded-2xl"}`}>
                                {game.coverUrl ? (
                                  <img src={game.coverUrl} alt="" className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
                                ) : (
                                  <span className="block aspect-[3/4] bg-line" aria-hidden="true" />
                                )}
                                {mineIds.has(game.id) ? (
                                  <span className="absolute top-2 left-2 rounded-lg bg-accent px-2 py-1 text-[11px] font-extrabold text-accent-ink">
                                    {t("calendar.inList")}
                                  </span>
                                ) : null}
                              </span>
                              <span className={`mt-2 block truncate font-semibold group-hover:underline ${size === "xl" ? "text-base" : "text-sm"}`}>
                                {game.title}
                              </span>
                              <span className={`mt-0.5 block truncate text-xs ${sunny ? "opacity-70" : "text-muted"}`}>
                                {game.releasePlatforms.join(", ")}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
        <CalendarSide month={calendar.month} marked={marked} mineDates={mineDates} today={today} mine={mine} />
      </div>
    </main>
  );
}

type Tier = "xl" | "md" | "sm";

// The list's column gap is 0.875rem: two big covers, three middle or four small ones share a phone's row.
const TIER_WIDTH: Record<Tier, string> = {
  xl: "w-[calc((100%-0.875rem)/2)] sm:w-60",
  md: "w-[calc((100%-1.75rem)/3)] sm:w-40",
  sm: "w-[calc((100%-2.625rem)/4)] sm:w-28",
};

// Hyped games get the big covers, the long tail gets small ones.
function tierOf(game: ReleaseGame): Tier {
  if (game.featured) return "xl";
  return game.hypes >= 3 ? "md" : "sm";
}

function TodayMark() {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-accent-ink">{t("calendar.today")}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function segmentClass(active: boolean): string {
  return `inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ${active ? "bg-strong text-strong-ink" : "text-muted hover:text-ink"}`;
}

function chipClass(active: boolean): string {
  return `inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ${
    active ? "bg-strong text-strong-ink" : "border border-line text-muted hover:text-ink"
  }`;
}

function formatWeekday(value: string): string {
  return new Intl.DateTimeFormat(getLocale() === "uk" ? "uk-UA" : "en-US", { weekday: "long" }).format(new Date(`${value}T12:00:00`));
}

function todayStamp(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
