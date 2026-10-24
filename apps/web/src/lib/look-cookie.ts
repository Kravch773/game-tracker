export const DESIGNS = ["console", "shelf"] as const;
export const THEMES = ["dark", "light"] as const;
export type Design = (typeof DESIGNS)[number];
export type Theme = (typeof THEMES)[number];

export const DESIGN_COOKIE = "design";
export const THEME_COOKIE = "theme";
export const DEFAULT_DESIGN: Design = "console";
export const DEFAULT_THEME: Theme = "dark";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

export function isDesign(value: unknown): value is Design {
  return typeof value === "string" && (DESIGNS as readonly string[]).includes(value);
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function lookCookie(name: typeof DESIGN_COOKIE | typeof THEME_COOKIE, value: string): string {
  return `${name}=${value}; Path=/; Max-Age=${YEAR_SECONDS}; SameSite=Lax`;
}
