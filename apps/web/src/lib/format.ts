import { getLocale } from "@gametracker/shared";

const DATE_LOCALE = { uk: "uk-UA", en: "en-GB" } as const;

export function formatDate(value: string): string {
  return formatLocale(new Date(value), { day: "numeric", month: "long", year: "numeric" });
}

export function formatReleaseDate(value: string): string {
  return formatLocale(atNoon(value), { day: "numeric", month: "long", year: "numeric" });
}

export function formatMonth(value: string): string {
  return formatLocale(atNoon(value), { month: "long", year: "numeric" });
}

export function weekdayLabels(): string[] {
  const monday = new Date(2026, 0, 5);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], { weekday: "short" }).format(date);
  });
}

export function formatShortDate(value: string): string {
  const date = value.length <= 10 ? atNoon(value) : new Date(value);
  return formatLocale(date, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatCalendarDay(value: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], { day: "numeric", month: "long" }).format(atNoon(value));
}

function formatLocale(date: Date, options: Intl.DateTimeFormatOptions): string {
  const text = new Intl.DateTimeFormat(DATE_LOCALE[getLocale()], options).format(date);
  return getLocale() === "uk" ? text.replace(/\s*р\.?\s*$/u, "") : text;
}

function atNoon(value: string): Date {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

// Store amounts come in minor units. Hryvnias read "1 079 ₴" (kopecks only when there are some), dollars "$35.99".
export function formatMoney(amount: number, currency: string): string {
  const value = amount / 100;
  const whole = Number.isInteger(value);
  if (currency === "UAH") {
    const number = new Intl.NumberFormat("uk-UA", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(value);
    return `${number} ₴`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}
