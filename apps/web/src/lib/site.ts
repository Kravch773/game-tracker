import type { Metadata } from "next";

export function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const withProtocol = /^https?:\/\//i.test(explicit) ? explicit : `https://${explicit}`;
    return new URL(withProtocol);
  }
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return new URL(`https://${production}`);
  if (process.env.NODE_ENV === "production") return new URL("https://gametracker.vercel.app");
  return new URL("http://localhost:3000");
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).href;
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function textSnippet(value: string | null | undefined, fallback: string): string {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 180 ? `${clean.slice(0, 177)}…` : clean;
}

export function pageMetadata({
  title,
  description,
  path,
  index = true,
  follow = true,
  image,
  imageAlt,
  absolute = false,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  follow?: boolean;
  image?: string | null;
  imageAlt?: string;
  absolute?: boolean;
}): Metadata {
  const picture = image || "/brand-logo.png";
  const fullTitle = `${title} · GameTracker`;
  return {
    title: absolute ? { absolute: fullTitle } : title,
    description,
    alternates: { canonical: path },
    robots: isPreviewDeployment() ? { index: false, follow: false } : { index, follow },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: "GameTracker",
      type: "website",
      images: [{ url: picture, alt: imageAlt || title }],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: [image || "/brand-mark.png"],
    },
  };
}
