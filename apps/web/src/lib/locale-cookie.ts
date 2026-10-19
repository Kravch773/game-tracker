import type { Locale } from "@gametracker/shared";

export const LOCALE_COOKIE = "locale";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

export function localeCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${YEAR_SECONDS}; SameSite=Lax`;
}
