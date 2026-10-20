import type { MetadataRoute } from "next";
import { absoluteUrl, isPreviewDeployment, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/settings",
          "/login",
          "/register",
          "/import/",
          "/steam/",
          "/*?q=",
          "/*?genre=",
          "/*?platform=",
          "/*?year=",
          "/*?sort=",
          "/*?developer=",
          "/*?publisher=",
          "/*?series=",
          "/*?month=",
          "/*?following=",
          "/*?next=",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl().hostname,
  };
}
