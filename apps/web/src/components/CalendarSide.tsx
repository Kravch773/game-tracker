import { t, type GameSummary } from "@gametracker/shared";
import { formatMonth, formatReleaseDate, weekdayLabels } from "@/lib/format";

export function CalendarSide({
  month,
  marked,
  today,
  mine,
}: {
  month: string;
  marked: Set<string>;
  today: string;
  mine: GameSummary[];
}) {
  const key = month.slice(0, 7);
  const current = today.slice(0, 7) === key;
  const cells = monthCells(month);

  return (
    <aside className="order-first flex flex-col gap-4 lg:sticky lg:top-24 lg:order-none lg:self-start">
      <div className="rounded-3xl border border-line bg-panel/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <a href={monthHref(shiftMonth(key, -1))} className={arrowClass} aria-label={t("collections.previous")}>
            ‹
          </a>
          <p className="font-display text-lg capitalize">{formatMonth(month)}</p>
          <a href={monthHref(shiftMonth(key, 1))} className={arrowClass} aria-label={t("collections.next")}>
            ›
          </a>
        </div>
        <a href="/calendar" className={`mt-3 inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold ${current ? "bg-white/5 text-muted" : "bg-accent text-accent-ink!"}`}>
          {t("calendar.today")}
        </a>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {weekdayLabels().map((label) => (
            <span key={label} className="py-1">
              {label}
            </span>
          ))}
          {cells.map((day, index) => {
            if (!day) return <span key={`empty-${index}`} />;
            const date = `${key}-${String(day).padStart(2, "0")}`;
            const hasGames = marked.has(date);
            const isToday = date === today;
            const className = `flex h-9 flex-col items-center justify-center rounded-xl text-sm ${
              isToday ? "bg-accent font-semibold text-accent-ink!" : hasGames ? "text-ink hover:bg-white/5" : "text-muted"
            }`;
            const body = (
              <>
                {day}
                <span className={`h-1 w-1 rounded-full ${hasGames && !isToday ? "bg-accent" : "bg-transparent"}`} />
              </>
            );
            return hasGames ? (
              <a key={date} href={`#d-${date}`} className={className}>
                {body}
              </a>
            ) : (
              <span key={date} className={className}>
                {body}
              </span>
            );
          })}
        </div>
      </div>
      {mine.length > 0 ? (
        <section className="rounded-3xl border border-line bg-panel/80 p-4">
          <h2 className="font-display text-lg">{t("calendar.mine")}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {mine.map((game) => {
              const released = game.releaseDate != null && game.releaseDate <= today;
              return (
                <li key={game.id}>
                  <a href={`/games/${game.slug}`} className="flex items-center gap-3 rounded-2xl px-1 py-1 hover:bg-white/5">
                    {game.coverUrl ? (
                      <img src={game.coverUrl} alt="" className="h-14 w-10 rounded-md object-cover" />
                    ) : (
                      <span className="h-14 w-10 rounded-md bg-raised" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{game.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        {game.releaseDate ? formatReleaseDate(game.releaseDate) : t("common.unknownDate")}
                        <span className={`rounded-full px-2 py-0.5 ${released ? "bg-white/10" : "bg-sky-300/15 text-sky-200"}`}>
                          {released ? t("calendar.released") : t("calendar.soon")}
                        </span>
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}

const arrowClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg hover:border-accent";

function monthHref(key: string): string {
  return `/calendar?month=${key}`;
}

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthCells(month: string): (number | null)[] {
  const [year, value] = month.slice(0, 7).split("-").map(Number);
  const first = new Date(Date.UTC(year, value - 1, 1));
  const pad = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, value, 0)).getUTCDate();
  const cells: (number | null)[] = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
