import { CATALOG_GENRES, CATALOG_PLATFORMS, type SitemapPayload } from "@gametracker/shared";
import type { MetadataRoute } from "next";
import { apiUrl } from "@/lib/config";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const PAGE_CAP = 10;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/news"), changeFrequency: "weekly", priority: 0.5 },
    { url: absoluteUrl("/guide"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/calendar"), changeFrequency: "daily", priority: 0.7 },
    { url: absoluteUrl("/activity"), changeFrequency: "daily", priority: 0.4 },
    ...CATALOG_GENRES.map((genre) => ({
      url: absoluteUrl(`/genres/${genre.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...CATALOG_PLATFORMS.map((platform) => ({
      url: absoluteUrl(`/platforms/${platform.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  for (let page = 1; page <= PAGE_CAP; page += 1) {
    const payload = await loadPage(page);
    if (!payload) break;
    if (page === 1) {
      for (const user of payload.users) {
        entries.push({
          url: absoluteUrl(`/u/${encodeURIComponent(user.username)}`),
          lastModified: new Date(user.createdAt),
          changeFrequency: "weekly",
          priority: 0.4,
        });
      }
    }
    for (const game of payload.games) {
      entries.push({
        url: absoluteUrl(`/games/${encodeURIComponent(game.slug)}`),
        lastModified: new Date(game.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    if (page >= payload.pageCount) break;
  }

  return entries;
}

async function loadPage(page: number): Promise<SitemapPayload | null> {
  try {
    const response = await fetch(`${apiUrl}/sitemap?page=${page}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as SitemapPayload;
  } catch {
    return null;
  }
}
