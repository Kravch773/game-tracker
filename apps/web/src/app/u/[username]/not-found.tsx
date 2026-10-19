import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { applyLocale } from "@/lib/locale";
import { primaryClass } from "@/lib/ui";

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function ProfileNotFound() {
  await applyLocale();
  return (
    <main className="mx-auto max-w-lg rounded-3xl border border-line bg-panel/80 p-8">
      <h1 className="font-display text-3xl">{t("profile.notFound")}</h1>
      <a href="/" className={`${primaryClass} mt-6`}>
        {t("common.backToSearch")}
      </a>
    </main>
  );
}
