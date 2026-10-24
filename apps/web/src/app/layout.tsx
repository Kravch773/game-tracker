import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { Manrope, Onest, Rubik, Unbounded } from "next/font/google";
import type { ReactNode } from "react";
import { LocaleSync } from "@/components/LocaleSync";
import { ConsoleShell, ShelfShell } from "@/components/Shells";
import { getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { getLook } from "@/lib/look";
import { isPreviewDeployment, siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded" });
const onest = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest" });
const rubik = Rubik({ subsets: ["latin", "cyrillic"], weight: ["600", "700", "800"], variable: "--font-rubik" });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await applyLocale();
  const description = t("meta.description");
  return {
    metadataBase: siteUrl(),
    title: { default: "GameTracker", template: "%s · GameTracker" },
    description,
    applicationName: "GameTracker",
    robots: isPreviewDeployment() ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "GameTracker",
      title: "GameTracker",
      description,
      locale: locale === "uk" ? "uk_UA" : "en_US",
      images: [{ url: "/brand-logo.png", alt: "GameTracker" }],
    },
    twitter: {
      card: "summary",
      title: "GameTracker",
      description,
      images: ["/brand-mark.png"],
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await applyLocale();
  const me = await getMe();

  const { design, theme } = await getLook();
  const Shell = design === "shelf" ? ShelfShell : ConsoleShell;

  return (
    <html
      lang={locale}
      data-design={design}
      data-theme={theme}
      className={`${manrope.variable} ${unbounded.variable} ${onest.variable} ${rubik.variable}`}
    >
      <body className="font-sans antialiased">
        <LocaleSync locale={locale}>
          <Shell user={me} design={design} theme={theme}>
            {children}
          </Shell>
        </LocaleSync>
      </body>
    </html>
  );
}
