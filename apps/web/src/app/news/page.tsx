import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { IconBadge } from "@/components/Icon";
import { applyLocale } from "@/lib/locale";
import { formatReleaseDate } from "@/lib/format";
import { pageMetadata } from "@/lib/site";
import { primaryClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

const PUBLISHED_ON = "2026-10-20";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return pageMetadata({
    title: t("news.title"),
    description: t("meta.news"),
    path: "/news",
  });
}

export default async function NewsPage() {
  await applyLocale();

  return (
    <main>
      <h1 className="flex items-center gap-3 font-display text-4xl tracking-tight">
        <IconBadge name="book" tone="bg-accent/10 text-accent" size="lg" />
        {t("news.title")}
      </h1>
      <article className="mt-8 max-w-3xl rounded-3xl border border-line bg-panel/80 p-6 sm:p-8">
        <p className="text-sm text-muted">{formatReleaseDate(PUBLISHED_ON)}</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight">{t("news.ukrainianTitle")}</h2>
        <p className="mt-4 text-[15px] leading-7 text-ink/80">{t("news.ukrainianLead")}</p>
        <p className="mt-3 text-[15px] leading-7 text-ink/80">{t("news.ukrainianBody")}</p>
        <a href="/?origin=ua" className={`${primaryClass} mt-6 text-accent-ink!`}>
          {t("news.openSearch")}
        </a>
      </article>
    </main>
  );
}
