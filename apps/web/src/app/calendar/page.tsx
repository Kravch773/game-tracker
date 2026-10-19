import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { CalendarSide } from "@/components/CalendarSide";
import { GameResult } from "@/components/GameResult";
import { IconBadge } from "@/components/Icon";
import { getCalendar } from "@/lib/api";
import { formatCalendarDay, formatMonth } from "@/lib/format";
import { applyLocale } from "@/lib/locale";
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
  searchParams: Promise<{ month?: string }>;
}) {
  await applyLocale();
  const { month } = await searchParams;
  const requested = month && /^\d{4}-\d{2}$/.test(month) ? month : undefined;
  const calendar = await getCalendar(requested);
  const marked = new Set(calendar.days.map((day) => day.date).filter((date) => date !== "unscheduled"));

  return (
    <main>
      <h1 className="flex items-center gap-3 font-display text-4xl tracking-tight">
        <IconBadge name="calendar" tone="bg-sky-300/10 text-sky-300" size="lg" />
        {t("calendar.title")}
      </h1>
      <p className="mt-2 text-muted capitalize">{formatMonth(calendar.month)}</p>
      <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div>
          {calendar.days.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line px-5 py-12 text-center text-muted">
              {t("calendar.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-12">
              {calendar.days.map((day) => (
                <section key={day.date} id={day.date === "unscheduled" ? undefined : `d-${day.date}`}>
                  <h2 className="flex items-center gap-3 font-display text-2xl tracking-tight">
                    {day.date === "unscheduled" ? (
                      <IconBadge name="clock" tone="bg-amber-300/10 text-amber-300" />
                    ) : (
                      <span className="inline-flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-panel text-accent ring-1 ring-white/10">
                        <span className="font-display text-lg leading-none">{day.date.slice(8, 10)}</span>
                      </span>
                    )}
                    {day.date === "unscheduled" ? t("calendar.unscheduled") : formatCalendarDay(day.date)}
                  </h2>
                  <ul className="mt-4 grid grid-cols-4 gap-x-3 gap-y-6 sm:grid-cols-6">
                    {day.games.map((game) => (
                      <li key={game.id} className={game.featured ? "col-span-2" : undefined}>
                        <GameResult game={game} detail={game.releasePlatforms.join(", ")} compact={!game.featured} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
        <CalendarSide month={calendar.month} marked={marked} today={todayStamp()} mine={calendar.mine ?? []} />
      </div>
    </main>
  );
}

function todayStamp(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
