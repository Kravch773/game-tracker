"use client";

import { LOCALES, getLocale, t, type Locale } from "@gametracker/shared";
import { localeCookie } from "@/lib/locale-cookie";

export function LanguageSwitch() {
  const current = getLocale();

  function choose(locale: Locale) {
    if (locale === current) return;
    document.cookie = localeCookie(locale);
    window.location.reload();
  }

  return (
    <div className="flex shrink-0 items-center rounded-full border border-line p-0.5" role="group" aria-label={t("locale.label")}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={locale === current}
          onClick={() => choose(locale)}
          className={`h-10 min-w-10 rounded-full px-2.5 text-xs font-semibold ${
            locale === current ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
          }`}
        >
          {t(`locale.${locale}`)}
        </button>
      ))}
    </div>
  );
}
