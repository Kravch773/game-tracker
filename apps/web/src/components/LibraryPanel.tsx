"use client";

import { REVIEW_MAX_LENGTH, t, type GameEntry, type LibraryStatus } from "@gametracker/shared";
import { useRef, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { LoginForm } from "@/components/LoginForm";
import { apiUrl } from "@/lib/config";
import { PROFILE_SECTIONS, STATUS_LABELS, isScoredStatus } from "@/lib/library";
import type { Design } from "@/lib/look-cookie";
import { primaryClass, quietClass } from "@/lib/ui";

const STATUS_DOT: Record<LibraryStatus, string> = {
  playing: "bg-emerald-400",
  backlog: "bg-sky-400",
  finished: "bg-lime-400",
  dropped: "bg-orange-400",
};

const SHELF_FILL: Record<LibraryStatus, string> = {
  playing: "bg-tile-mint",
  backlog: "bg-tile-sky",
  finished: "bg-tile-sun",
  dropped: "bg-tile-coral",
};

export function LibraryPanel({
  slug,
  loggedIn,
  entry,
  design = "console",
}: {
  slug: string;
  loggedIn: boolean;
  entry: GameEntry;
  design?: Design;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [status, setStatus] = useState(entry.status);
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [review, setReview] = useState(entry.review ?? "");
  const [favorite, setFavorite] = useState(entry.favorite);
  const [draftRating, setDraftRating] = useState<number | null>(entry.rating);
  const saveTimer = useRef<number | undefined>(undefined);
  const [draftReview, setDraftReview] = useState(entry.review ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const nextPath = `/games/${encodeURIComponent(slug)}`;
  const registerHref = `/register?next=${encodeURIComponent(nextPath)}`;

  // The slider covers 0–10 and saves on its own a moment after the last move.
  // 11 is a separate button, so dragging to 10 can never slip into it.
  function saveRating(next: number | null, delay: number) {
    setDraftRating(next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (status) void persist(status, next, review.trim() || null);
    }, delay);
  }

  function slide(value: number) {
    saveRating(Math.min(10, Math.round(value * 10) / 10), 450);
  }

  function toggleExtra() {
    saveRating(draftRating === 11 ? 10 : 11, 0);
  }

  function clearRating() {
    window.clearTimeout(saveTimer.current);
    setDraftRating(null);
    if (status) void persist(status, null, review.trim() || null);
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
    await persist(next, rating, review.trim() || null);
  }

  function openReview() {
    setDraftReview(review);
    setError(null);
    setReviewOpen(true);
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

  const shelf = design === "shelf";
  const card = shelf ? "rounded-[32px] bg-strong p-6 text-strong-ink" : "rounded-3xl border border-line bg-panel p-5";
  const soft = shelf ? "bg-strong-ink/10 hover:bg-strong-ink/15" : "border border-line hover:border-ink/25";
  const label = `text-[11px] font-bold tracking-[0.14em] uppercase ${shelf ? "text-strong-ink/70" : "text-muted"}`;

  if (!loggedIn) {
    return (
      <>
        <section className={card}>
          <p className={label}>{t("library.list")}</p>
          <p className={`mt-3 text-sm leading-6 ${shelf ? "text-strong-ink/80" : "text-muted"}`}>{t("library.signInToSave")}</p>
          <button type="button" onClick={() => setLoginOpen(true)} className={`${primaryClass} mt-4 w-full gap-2`}>
            <Icon name="bookmark" className="text-accent-ink" />
            {t("library.addToLibrary")}
          </button>
        </section>
        <Dialog open={loginOpen} title={t("auth.loginTitle")} onClose={() => setLoginOpen(false)}>
          <LoginForm next={nextPath} />
          <p className="mt-5 text-center text-sm text-muted">{t("auth.noProfile")}</p>
          <a href={registerHref} className={`${quietClass} mt-3 w-full`}>
            {t("nav.register")}
          </a>
        </Dialog>
      </>
    );
  }

  const scored = status != null && isScoredStatus(status);

  return (
    <>
      <section className={`@container ${card}`}>
        <p className={label}>{t("library.list")}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 @xs:grid-cols-2" role="group" aria-label={t("library.section")}>
          {PROFILE_SECTIONS.map((item) => {
            const active = status === item;
            return (
              <button
                key={item}
                type="button"
                disabled={pending}
                aria-pressed={active}
                onClick={() => void chooseStatus(item)}
                className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm leading-tight font-semibold transition ${
                  active ? (shelf ? `${SHELF_FILL[item]} text-[#1b1530]` : "bg-raised ring-1 ring-accent-fg") : soft
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${shelf ? (active ? "bg-[#1b1530]" : SHELF_FILL[item]) : STATUS_DOT[item]}`} />
                <span className="min-w-0">{STATUS_LABELS[item]}</span>
              </button>
            );
          })}
        </div>

        {scored ? (
          <div className={`mt-3 rounded-2xl p-3 ${shelf ? "bg-strong-ink/10" : "bg-raised"}`}>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`rating-${slug}`} className={`text-sm ${shelf ? "text-strong-ink/75" : "text-muted"}`}>
                {t("library.rate")}
              </label>
              <span className={`font-display text-3xl leading-none ${shelf ? "text-tile-sun" : "text-accent-fg"}`}>
                {draftRating == null ? "—" : draftRating === 11 ? "11" : draftRating.toFixed(1)}
              </span>
            </div>
            <input
              id={`rating-${slug}`}
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={draftRating == null ? 0 : Math.min(draftRating, 10)}
              aria-valuetext={draftRating == null ? t("library.noRating") : draftRating === 11 ? t("library.extra") : draftRating.toFixed(1)}
              onChange={(event) => slide(Number(event.target.value))}
              className={`mt-2 h-7 w-full cursor-pointer ${shelf ? "accent-tile-sun" : "accent-accent"} ${
                draftRating == null || draftRating === 11 ? "opacity-50" : ""
              }`}
            />
            <div className={`flex items-center justify-between text-[11px] ${shelf ? "text-strong-ink/70" : "text-muted"}`}>
              <span>0</span>
              <span>10</span>
            </div>
            <button
              type="button"
              aria-pressed={draftRating === 11}
              onClick={toggleExtra}
              className={`mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                draftRating === 11
                  ? shelf
                    ? "bg-tile-sun text-[#1b1530]"
                    : "bg-accent text-accent-ink"
                  : shelf
                    ? "border border-strong-ink/25 hover:bg-strong-ink/10"
                    : "border border-line hover:border-accent-fg"
              }`}
            >
              <span aria-hidden="true">★</span>
              {t("library.extra")}
            </button>
            {draftRating != null && status !== "finished" ? (
              <button type="button" onClick={clearRating} className={`mt-2 text-xs font-semibold underline ${shelf ? "text-strong-ink/75" : "text-muted"}`}>
                {t("library.noRating")}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex gap-2">
          {scored ? (
            <button
              type="button"
              disabled={pending}
              onClick={openReview}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold ${soft}`}
            >
              <Icon name="chat" />
              {review ? t("library.editReview") : t("library.review")}
            </button>
          ) : (
            <p className={`flex-1 self-center text-xs leading-5 ${shelf ? "text-strong-ink/70" : "text-muted"}`}>
              {status ? STATUS_LABELS[status] : t("library.notInList")}
            </p>
          )}
          <button
            type="button"
            disabled={pending}
            aria-pressed={favorite}
            aria-label={favorite ? t("library.favorited") : t("library.addFavorite")}
            title={favorite ? t("library.favorited") : t("library.addFavorite")}
            onClick={() => void toggleFavorite()}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
              favorite ? "bg-pink-300 text-pink-950" : soft
            }`}
          >
            <Icon name="heart" />
          </button>
        </div>
        {review ? <p className={`mt-3 line-clamp-3 text-sm leading-6 ${shelf ? "text-strong-ink/80" : "text-muted"}`}>{review}</p> : null}
        {error && !reviewOpen ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </section>
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
        {error ? <p className="mt-4 text-sm text-accent-fg">{error}</p> : null}
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
