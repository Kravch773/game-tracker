import { getLocale } from "@gametracker/shared";

// The site's formats (apps/web/src/lib/format.ts): hryvnias as "1 079 ₴", dollars as "$35.99".
export function formatMoney(amount: number, currency: string): string {
  const value = amount / 100;
  const whole = Number.isInteger(value);
  if (currency === "UAH") {
    const number = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(value);
    return `${number} ₴`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string): string {
  const date = value.length <= 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  const text = new Intl.DateTimeFormat(getLocale() === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
  return getLocale() === "uk" ? text.replace(/\s*р\.?\s*$/u, "") : text;
}

export function formatShortDate(value: string): string {
  const date = value.length <= 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return new Intl.DateTimeFormat(getLocale() === "uk" ? "uk-UA" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function ratingText(rating: number): string {
  return rating >= 11 ? "11" : `${Number.isInteger(rating) ? rating.toFixed(1) : rating}/10`;
}
