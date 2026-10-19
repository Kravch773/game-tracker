import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/AccountNav";
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
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
              <a href="/" className="inline-flex items-center gap-2 font-display text-lg tracking-tight">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-ink">
                  <Icon name="gamepad" />
                </span>
                <span className="hidden sm:inline">GameTracker</span>
              </a>
              <div className="flex min-w-0 items-center gap-2">
                <LanguageSwitch />
                <AccountNav user={me} />
              </div>
            </div>
          </header>
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        </LocaleSync>
      </body>
    </html>
  );
}
