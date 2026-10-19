"use client";

import { REVIEW_MAX_LENGTH, t, type GameEntry, type LibraryStatus } from "@gametracker/shared";
import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { STATUS_MARK } from "@/lib/marks";
import { PROFILE_SECTIONS, STATUS_LABELS, isScoredStatus, ratingLabel } from "@/lib/library";
import { primaryClass, quietClass } from "@/lib/ui";

export function LibraryPanel({
  slug,
  loggedIn,
  entry,
}: {
  slug: string;
  loggedIn: boolean;
  entry: GameEntry;
}) {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [status, setStatus] = useState(entry.status);
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [review, setReview] = useState(entry.review ?? "");
  const [favorite, setFavorite] = useState(entry.favorite);
  const [draftRating, setDraftRating] = useState<number | null>(entry.rating);
  const [draftReview, setDraftReview] = useState(entry.review ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnPath = `/login?next=${encodeURIComponent(`/games/${slug}`)}`;

  function openRating() {
    setDraftRating(rating);
    setDraftReview(review);
    setError(null);
    setOpen(true);
  }

  async function persist(nextStatus: LibraryStatus, nextRating: number | null, nextReview: string | null) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/games/${encodeURIComponent(slug)}/entry`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, rating: nextRating, review: nextReview }),
      });
      const payload = (await response.json()) as GameEntry & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? t("library.saveFailed"));
        return false;
      }
      setStatus(payload.status);
      setRating(payload.rating);
      setReview(payload.review ?? "");
      setFavorite(payload.favorite);
      return true;
    } catch {
      setError(t("library.saveFailed"));
      return false;
    } finally {
      setPending(false);
    }
  }

  async function chooseStatus(next: LibraryStatus) {
    if (pending) return;
    if (status === next) {
      await clearEntry();
      return;
    }
    const saved = await persist(next, rating, review.trim() || null);
    if (saved && isScoredStatus(next)) {
      setDraftRating(rating);
      setDraftReview(review);
      setError(null);
      setOpen(true);
    }
  }

  function openReview() {
    setDraftReview(review);
    setError(null);
    setReviewOpen(true);
  }

  async function saveRating() {
    if (!status || !isScoredStatus(status)) return;
    const saved = await persist(status, draftRating, draftReview.trim() || null);
    if (saved) setOpen(false);
  }

  async function saveReview() {
    if (!status || !isScoredStatus(status)) return;
    const saved = await persist(status, rating, draftReview.trim() || null);
    if (saved) setReviewOpen(false);
  }

  async function clearEntry() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/games/${encodeURIComponent(slug)}/entry`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok && response.status !== 204) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? t("library.removeFailed"));
        return;
      }
      setStatus(null);
      setRating(null);
      setReview("");
      setDraftRating(null);
      setDraftReview("");
      setOpen(false);
    } catch {
      setError(t("library.removeFailed"));
    } finally {
      setPending(false);
    }
  }

  async function toggleFavorite() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/games/${encodeURIComponent(slug)}/favorite`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !favorite }),
      });
      const payload = (await response.json()) as { favorite?: boolean; error?: string };
      if (!response.ok || typeof payload.favorite !== "boolean") {
        setError(payload.error ?? t("library.favoriteFailed"));
        return;
      }
      setFavorite(payload.favorite);
    } catch {
      setError(t("library.favoriteFailed"));
    } finally {
      setPending(false);
    }
  }

  function onReview(value: string) {
    const chars = [...value];
    setDraftReview(chars.length > REVIEW_MAX_LENGTH ? chars.slice(0, REVIEW_MAX_LENGTH).join("") : value);
  }

  if (!loggedIn) {
    return (
      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-panel/80 p-5">
        <div>
          <p className="text-sm text-muted">{t("library.list")}</p>
          <p className="mt-1 font-medium">{t("library.signInToSave")}</p>
        </div>
        <a href={returnPath} className={primaryClass}>
          {t("nav.login")}
        </a>
      </section>
    );
  }

  return (
    <>
      <section className="mt-8 rounded-3xl border border-line bg-panel/80 p-5">
        <p className="text-sm text-muted">{t("library.inProfile")}</p>
        <p className="mt-1 font-medium">
          {status ? STATUS_LABELS[status] : t("library.notInList")}
          {favorite ? t("library.inFavoritesSuffix") : ""}
        </p>
        {rating != null ? <p className="mt-1 text-sm text-accent">{ratingLabel(rating)}</p> : null}
        {review ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{review}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={t("library.section")}>
          {PROFILE_SECTIONS.map((item) => (
            <button
              key={item}
              type="button"
              disabled={pending}
              aria-pressed={status === item}
              onClick={() => void chooseStatus(item)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border text-sm font-medium transition ${
                status === item
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line bg-raised hover:border-white/25"
              }`}
            >
              <Icon name={STATUS_MARK[item].icon} className={status === item ? "text-accent-ink" : STATUS_MARK[item].tone} />
              {STATUS_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            aria-pressed={favorite}
            onClick={() => void toggleFavorite()}
            className={`${favorite ? primaryClass : quietClass} gap-1.5`}
          >
            <Icon name="heart" className={favorite ? "text-accent-ink" : "text-pink-300"} />
            {favorite ? t("library.favorited") : t("library.addFavorite")}
          </button>
          {status && isScoredStatus(status) ? (
            <>
              <button type="button" disabled={pending} onClick={openRating} className={`${quietClass} gap-1.5`}>
                <Icon name="star" className="text-accent" />
                {t("library.rate")}
              </button>
              <button type="button" disabled={pending} onClick={openReview} className={`${quietClass} gap-1.5`}>
                <Icon name="chat" className="text-accent" />
                {t("library.editReview")}
              </button>
            </>
          ) : null}
        </div>
        {error && !open && !reviewOpen ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      </section>
      <Dialog open={open} title={t("library.rate")} onClose={() => setOpen(false)}>
        <p className="text-sm text-muted">{t("library.ratingHint")}</p>
        <p className="mt-3 font-display text-3xl text-accent">
          {draftRating == null ? t("library.noRating") : draftRating === 11 ? t("library.extra") : draftRating.toFixed(1)}
        </p>
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={draftRating != null && draftRating <= 10 ? draftRating : 0}
          disabled={pending}
          aria-label={t("library.rate")}
          onChange={(event) => setDraftRating(Number(event.target.value))}
          className="mt-3 w-full accent-accent"
        />
        <button
          type="button"
          disabled={pending}
          aria-pressed={draftRating === 11}
          onClick={() => setDraftRating(draftRating === 11 ? null : 11)}
          className={`mt-3 h-11 w-full rounded-xl border text-sm font-semibold ${
            draftRating === 11
              ? "border-accent bg-accent text-accent-ink!"
              : "border-accent/50 text-accent hover:bg-accent hover:text-accent-ink!"
          }`}
        >
          {t("library.extra")}
        </button>
        {status === "dropped" || status === "playing" ? (
          <button
            type="button"
            disabled={pending}
            aria-pressed={draftRating == null}
            onClick={() => setDraftRating(null)}
            className={`mt-2 h-11 w-full rounded-xl border text-sm font-semibold ${
              draftRating == null ? "border-accent bg-accent text-accent-ink!" : "border-line bg-bg/50 hover:border-white/25"
            }`}
          >
            {t("library.noRating")}
          </button>
        ) : null}
        <label className="mt-4 block text-sm">
          {t("library.review")}
          <textarea
            value={draftReview}
            onChange={(event) => onReview(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-bg/50 px-3 py-3 text-ink outline-none focus:border-accent"
          />
        </label>
        <p className="mt-1 text-right text-xs text-muted">
          {[...draftReview].length}/{REVIEW_MAX_LENGTH}
        </p>
        {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" disabled={pending} onClick={() => void saveRating()} className={primaryClass}>
            {pending ? t("common.saving") : t("common.save")}
          </button>
          <button type="button" disabled={pending} onClick={() => setOpen(false)} className={quietClass}>
            {t("common.close")}
          </button>
        </div>
      </Dialog>
      <Dialog open={reviewOpen} title={t("library.editReview")} onClose={() => setReviewOpen(false)}>
        <label className="block text-sm">
          {t("library.review")}
          <textarea
            value={draftReview}
            onChange={(event) => onReview(event.target.value)}
            rows={6}
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-bg/50 px-3 py-3 text-ink outline-none focus:border-accent"
          />
        </label>
        <p className="mt-1 text-right text-xs text-muted">
          {[...draftReview].length}/{REVIEW_MAX_LENGTH}
        </p>
        {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" disabled={pending} onClick={() => void saveReview()} className={primaryClass}>
            {pending ? t("common.saving") : t("common.save")}
          </button>
          <button type="button" disabled={pending} onClick={() => setReviewOpen(false)} className={quietClass}>
            {t("common.close")}
          </button>
        </div>
      </Dialog>
    </>
  );
}
