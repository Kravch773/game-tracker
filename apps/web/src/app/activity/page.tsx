import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { IconBadge } from "@/components/Icon";
import { getActivity, getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { getLook } from "@/lib/look";
import { formatDate } from "@/lib/format";
import { ratingLabel } from "@/lib/library";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ following?: string }>;
}): Promise<Metadata> {
  await applyLocale();
  const { following } = await searchParams;
  return pageMetadata({
    title: t("activity.title"),
    description: t("meta.activity"),
    path: "/activity",
    index: following !== "1",
    follow: true,
  });
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ following?: string }>;
}) {
  await applyLocale();
  const { following } = await searchParams;
  const me = await getMe();
  const onlyFollowing = following === "1" && me != null;
  const [{ events }, { design }] = await Promise.all([getActivity(onlyFollowing), getLook()]);
  const shelf = design === "shelf";

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="flex items-center gap-3 font-display text-4xl tracking-tight">
          <IconBadge name="pulse" tone="bg-accent/10 text-accent-fg" size="lg" />
          {t("activity.title")}
        </h1>
        {me ? (
          <div role="group" aria-label={t("activity.title")} className="flex rounded-full bg-panel p-1 ring-1 ring-line">
            <a href="/activity" aria-current={!onlyFollowing ? "true" : undefined} className={segment(!onlyFollowing)}>
              {t("activity.everyone")}
            </a>
            <a href="/activity?following=1" aria-current={onlyFollowing ? "true" : undefined} className={segment(onlyFollowing)}>
              {t("activity.following")}
            </a>
          </div>
        ) : null}
      </div>
      {events.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-line px-5 py-12 text-center text-muted">
          {onlyFollowing ? t("activity.followingEmpty") : t("activity.empty")}
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {events.map((event) => (
            <li
              key={`${event.username}-${event.game.id}-${event.at}`}
              className={
                shelf
                  ? `flex gap-4 rounded-[28px] p-5 text-[#1b1530] ${event.status === "finished" ? "bg-tile-sun" : "bg-tile-coral"}`
                  : "flex gap-4 rounded-3xl border border-line bg-panel p-4"
              }
            >
              <a
                href={`/u/${encodeURIComponent(event.username)}`}
                aria-label={event.username}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display font-bold ${
                  shelf ? "bg-[#1b1530] text-white" : "bg-raised text-ink"
                }`}
              >
                {event.username.slice(0, 1).toUpperCase()}
              </a>
              <div className="min-w-0 flex-1">
                <p className="leading-snug">
                  <a href={`/u/${encodeURIComponent(event.username)}`} className="font-bold hover:underline">
                    {event.username}
                  </a>
                  <span className={shelf ? "opacity-70" : "text-muted"}> · {t(`status.${event.status}`)} · </span>
                  <a href={`/games/${encodeURIComponent(event.game.slug)}`} className="font-semibold hover:underline">
                    {event.game.title}
                  </a>
                </p>
                <p className={`mt-1 text-sm ${shelf ? "opacity-70" : "text-muted"}`}>{formatDate(event.at)}</p>
                {event.review ? (
                  <p className={`mt-3 line-clamp-3 rounded-2xl p-3 text-sm leading-6 ${shelf ? "bg-white/55" : "bg-bg text-ink/85"}`}>{event.review}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {event.game.coverUrl ? <img src={event.game.coverUrl} alt="" className="h-20 w-15 rounded-xl object-cover" /> : null}
                {event.rating != null ? (
                  <span className={`rounded-lg px-2 py-0.5 font-display text-sm font-bold ${shelf ? "bg-[#1b1530] text-white" : "bg-accent text-accent-ink"}`}>
                    {ratingLabel(event.rating)}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function segment(active: boolean): string {
  return `inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ${active ? "bg-strong text-strong-ink" : "text-muted hover:text-ink"}`;
}
