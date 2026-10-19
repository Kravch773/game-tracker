import type {
  AuthUser,
  GameDetails,
  GameEntry,
  ActivityResponse,
  GameSearchResponse,
  GameSummary,
  HomeResponse,
  ReleaseCalendar,
  SearchFilters,
  UserLibrary,
} from "@gametracker/shared";
import { cookies } from "next/headers";
import { cache } from "react";
import { apiUrl } from "./config";

export async function searchGames(query: string, filters: SearchFilters = {}): Promise<GameSummary[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.year) params.set("year", String(filters.year));
  const response = await fetch(`${apiUrl}/games?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Search failed with ${response.status}`);
  const payload = (await response.json()) as GameSearchResponse;
  return payload.games;
}

export async function getBrowse(kind: "genres" | "platforms", id: string): Promise<GameSummary[] | null> {
  const response = await fetch(`${apiUrl}/browse/${kind}/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Browse failed with ${response.status}`);
  const payload = (await response.json()) as { games: GameSummary[] };
  return payload.games;
}

export async function getCalendar(month?: string): Promise<ReleaseCalendar> {
  const params = month ? `?month=${encodeURIComponent(month)}` : "";
  const response = await fetch(`${apiUrl}/calendar${params}`, {
    headers: await sessionHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Calendar failed with ${response.status}`);
  return (await response.json()) as ReleaseCalendar;
}

export async function getActivity(following: boolean): Promise<ActivityResponse> {
  const suffix = following ? "?following=1" : "";
  const response = await fetch(`${apiUrl}/activity${suffix}`, {
    headers: await sessionHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Activity failed with ${response.status}`);
  return (await response.json()) as ActivityResponse;
}

export async function getCollections(): Promise<HomeResponse> {
  const response = await fetch(`${apiUrl}/collections`, {
    headers: await sessionHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Collections failed with ${response.status}`);
  return (await response.json()) as HomeResponse;
}

export const getGame = cache(async (slug: string): Promise<GameDetails | null> => {
  const response = await fetch(`${apiUrl}/games/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Game request failed with ${response.status}`);
  return (await response.json()) as GameDetails;
});

export const getMe = cache(async (): Promise<AuthUser | null> => {
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: await sessionHeaders(),
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session request failed with ${response.status}`);
  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
});

export async function getLibrary(username: string): Promise<UserLibrary | null> {
  const response = await fetch(`${apiUrl}/users/${encodeURIComponent(username)}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Profile request failed with ${response.status}`);
  return (await response.json()) as UserLibrary;
}

export async function getGameEntry(slug: string): Promise<GameEntry | null> {
  const response = await fetch(`${apiUrl}/games/${encodeURIComponent(slug)}/entry`, {
    headers: await sessionHeaders(),
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Entry request failed with ${response.status}`);
  return (await response.json()) as GameEntry;
}

async function sessionHeaders(): Promise<Headers> {
  const jar = await cookies();
  const session = jar.get("session")?.value;
  const headers = new Headers();
  if (session) headers.set("cookie", `session=${session}`);
  return headers;
}
