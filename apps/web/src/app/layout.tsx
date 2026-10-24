import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { AccountNav } from "@/components/AccountNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LocaleSync } from "@/components/LocaleSync";
import { MobileNav } from "@/components/MobileNav";
import { getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { isPreviewDeployment, siteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded" });

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

  return (
    <html lang={locale} className={`${manrope.variable} ${unbounded.variable}`}>
      <body className="font-sans antialiased">
        <LocaleSync locale={locale}>
          <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:h-16 sm:flex-nowrap sm:py-0">
              <a href="/" className="order-1 inline-flex h-11 shrink-0 items-center">
                <picture>
                  <source media="(min-width: 640px)" srcSet="/brand-logo.png" />
                  <img src="/brand-mark.png" alt="GameTracker" className="h-9 w-auto" />
                </picture>
              </a>
              <div className="order-2 ml-auto flex min-w-0 items-center gap-2 sm:order-3 sm:ml-0">
                <LanguageSwitch />
                <AccountNav user={me} />
              </div>
              <div className="order-3 flex w-full justify-center max-sm:empty:hidden sm:order-2 sm:w-auto sm:min-w-0 sm:flex-1">
                <Suspense fallback={<div className="h-11 w-full max-w-md rounded-full border border-line bg-panel/50" />}>
                  <HeaderSearch />
                </Suspense>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:pb-8">{children}</div>
          <MobileNav />
        </LocaleSync>
      </body>
    </html>
  );
}
