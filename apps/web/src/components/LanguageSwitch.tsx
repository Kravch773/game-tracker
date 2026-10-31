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
          className={`h-9 min-w-9 rounded-full px-2 text-xs font-semibold sm:h-10 sm:min-w-10 sm:px-2.5 ${
            locale === current ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
          }`}
        >
          {t(`locale.${locale}`)}
        </button>
      ))}
    </div>
  );
}
