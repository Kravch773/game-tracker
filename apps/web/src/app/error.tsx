"use client";

import { t } from "@gametracker/shared";
import { primaryClass } from "@/lib/ui";

export default function HomeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg rounded-3xl border border-line bg-panel/80 p-8">
      <h1 className="font-display text-3xl">{t("home.unavailable")}</h1>
      <p className="mt-2 text-muted">{t("home.apiFailed")}</p>
      <button type="button" onClick={reset} className={`${primaryClass} mt-6`}>
        {t("common.retry")}
      </button>
    </main>
  );
}
