import { t } from "@gametracker/shared";
import { applyLocale } from "@/lib/locale";
import { primaryClass } from "@/lib/ui";

export default async function GameNotFound() {
  await applyLocale();
  return (
    <main className="mx-auto max-w-lg rounded-3xl border border-line bg-panel/80 p-8">
      <h1 className="font-display text-3xl">{t("game.notFound")}</h1>
      <p className="mt-2 text-muted">{t("game.missingPage")}</p>
      <a href="/" className={`${primaryClass} mt-6`}>
        {t("common.backToSearch")}
      </a>
    </main>
  );
}
