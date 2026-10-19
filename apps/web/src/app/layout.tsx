import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { AccountNav } from "@/components/AccountNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { Icon } from "@/components/Icon";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LocaleSync } from "@/components/LocaleSync";
import { getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded" });

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return {
    title: "GameTracker",
    description: t("meta.description"),
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
              <a href="/" className="order-1 inline-flex shrink-0 items-center gap-2 font-display text-lg tracking-tight">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-ink">
                  <Icon name="gamepad" />
                </span>
                <span className="hidden sm:inline">GameTracker</span>
              </a>
              <div className="order-2 ml-auto flex min-w-0 items-center gap-2 sm:order-3 sm:ml-0">
                <LanguageSwitch />
                <AccountNav user={me} />
              </div>
              <div className="order-3 flex w-full justify-center sm:order-2 sm:w-auto sm:min-w-0 sm:flex-1">
                <Suspense fallback={<div className="h-10 w-full max-w-md rounded-full border border-line bg-panel/50" />}>
                  <HeaderSearch />
                </Suspense>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        </LocaleSync>
      </body>
    </html>
  );
}
