import { LIBRARY_STATUSES, t, type LibraryStatus } from "@gametracker/shared";

export const STATUS_LABELS = {
  get playing() {
    return t("status.playing");
  },
  get finished() {
    return t("status.finished");
  },
  get dropped() {
    return t("status.dropped");
  },
  get backlog() {
    return t("status.backlog");
  },
} satisfies Record<LibraryStatus, string>;

export const PROFILE_SECTIONS = LIBRARY_STATUSES;

export function isScoredStatus(status: LibraryStatus): boolean {
  return status === "finished" || status === "dropped";
}

export function ratingLabel(rating: number): string {
  if (rating === 11) return t("library.extra");
  const rounded = Math.round(rating * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return t("library.ratingOfTen", { rating: text });
}
