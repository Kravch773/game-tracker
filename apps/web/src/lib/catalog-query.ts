import { CATALOG_PLATFORMS, MAX_FILTER_VALUES, SEARCH_GENRES, type SearchFilters, type SearchSort } from "@gametracker/shared";

// The catalog's state as it lives in the URL: list filters repeat their key (?genre=rpg&genre=indie).
export type CatalogQuery = {
  q: string;
  genre: string[];
  platform: string[];
  developer: string[];
  publisher: string[];
  series: string[];
  year: string;
  origin: "" | "ua" | "ru";
  sort: SearchSort;
};

export type ListField = "genre" | "platform" | "developer" | "publisher" | "series";
export const LIST_FIELDS: ListField[] = ["genre", "platform", "series", "developer", "publisher"];

export type RawParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  const values = value == null ? [] : Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].slice(0, MAX_FILTER_VALUES);
}

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function readCatalogQuery(params: RawParams): CatalogQuery {
  const genres = new Set<string>(SEARCH_GENRES.map((item) => item.id));
  const platforms = new Set<string>(CATALOG_PLATFORMS.map((item) => item.id));
  const year = Number(single(params.year));
  const sort = (["popular", "release", "title"] as const).find((item) => item === single(params.sort)) ?? "popular";
  const origin = single(params.origin);
  const text = (value: string | string[] | undefined) => list(value).filter((item) => item.length >= 2).map((item) => item.slice(0, 80));
  return {
    q: single(params.q),
    genre: list(params.genre).filter((id) => genres.has(id)),
    platform: list(params.platform).filter((id) => platforms.has(id)),
    developer: text(params.developer),
    publisher: text(params.publisher),
    series: text(params.series),
    year: Number.isInteger(year) && year >= 1970 && year <= 2035 ? String(year) : "",
    origin: origin === "ua" || origin === "ru" ? origin : "",
    sort,
  };
}

export function toSearchFilters(query: CatalogQuery): SearchFilters {
  const some = <T extends string>(values: string[]) => (values.length > 0 ? (values as T[]) : undefined);
  return {
    genre: some(query.genre),
    platform: some(query.platform),
    developer: some(query.developer),
    publisher: some(query.publisher),
    series: some(query.series),
    year: query.year ? Number(query.year) : undefined,
    sort: query.sort === "popular" ? undefined : query.sort,
  };
}

export function hasCatalogFilters(query: CatalogQuery): boolean {
  return LIST_FIELDS.some((field) => query[field].length > 0) || Boolean(query.year);
}

export function catalogParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  for (const field of LIST_FIELDS) for (const value of query[field]) params.append(field, value);
  if (query.year) params.set("year", query.year);
  if (query.origin) params.set("origin", query.origin);
  if (query.sort !== "popular") params.set("sort", query.sort);
  return params;
}

export function catalogHref(query: CatalogQuery, patch: Partial<CatalogQuery> = {}): string {
  const text = catalogParams({ ...query, ...patch }).toString();
  return text ? `/?${text}` : "/";
}

// Adds the value when it is missing, removes it when it is there.
export function toggleValue(query: CatalogQuery, field: ListField, value: string): Partial<CatalogQuery> {
  const current = query[field];
  return { [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value].slice(-MAX_FILTER_VALUES) };
}
