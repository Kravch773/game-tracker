import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { IconBadge } from "@/components/Icon";
import { STATUS_MARK } from "@/lib/marks";
import { getActivity, getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
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
  const { events } = await getActivity(onlyFollowing);

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="flex items-center gap-3 font-display text-4xl tracking-tight">
          <IconBadge name="pulse" tone="bg-accent/10 text-accent" size="lg" />
          {t("activity.title")}
        </h1>
        {me ? (
          <div className="flex gap-2 text-sm">
            <a href="/activity" className={onlyFollowing ? "text-muted" : "text-accent"}>
              {t("activity.everyone")}
            </a>
            <a href="/activity?following=1" className={onlyFollowing ? "text-accent" : "text-muted"}>
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
            <li key={`${event.username}-${event.game.id}-${event.at}`} className="flex gap-3 rounded-3xl border border-line bg-panel/80 p-4">
              <IconBadge name={STATUS_MARK[event.status].icon} tone={`bg-white/5 ${STATUS_MARK[event.status].tone}`} />
              <div className="min-w-0">
              <p>
                <a href={`/u/${encodeURIComponent(event.username)}`} className="font-medium hover:text-accent">
                  {event.username}
                </a>
                <span className="text-muted"> · {t(`status.${event.status}`)} · </span>
                <a href={`/games/${encodeURIComponent(event.game.slug)}`} className="hover:text-accent">
                  {event.game.title}
                </a>
              </p>
              <p className="mt-1 text-sm text-muted">
                {event.rating != null ? `${ratingLabel(event.rating)} · ` : ""}
                {formatDate(event.at)}
              </p>
              {event.review ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{event.review}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
