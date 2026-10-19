import { t, type CommunityReview } from "@gametracker/shared";
import { IconBadge } from "@/components/Icon";
import { ratingLabel } from "@/lib/library";
import { formatDate } from "@/lib/format";

export function ReviewList({ reviews }: { reviews: CommunityReview[] }) {
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="flex items-center gap-2.5 font-display text-2xl">
        <IconBadge name="chat" tone="bg-accent/10 text-accent" />
        {t("game.reviews")}
      </h2>
      {reviews.length === 0 ? (
        <p className="mt-3 text-muted">{t("game.noReviews")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={`${review.username}-${review.at}`} className="rounded-3xl border border-line bg-panel/80 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a href={`/u/${encodeURIComponent(review.username)}`} className="inline-flex items-center gap-2 font-medium hover:text-accent">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent font-display text-xs text-accent-ink">
                    {review.username.slice(0, 1).toUpperCase()}
                  </span>
                  {review.username}
                </a>
                <span className="text-sm text-muted">
                  {review.rating != null ? `${ratingLabel(review.rating)} · ` : ""}
                  {formatDate(review.at)}
                </span>
              </div>
              <p className="mt-2 leading-7 text-muted">{review.review}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}