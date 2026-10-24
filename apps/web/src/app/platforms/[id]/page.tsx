import { CATALOG_PLATFORMS, t, type CatalogPlatformId, type MessageKey } from "@gametracker/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameResult } from "@/components/GameResult";
import { Icon, IconBadge } from "@/components/Icon";
import { PLATFORM_MARK } from "@/lib/marks";
import { getBrowse } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";

const TITLES: Record<CatalogPlatformId, MessageKey> = {
  pc: "platforms.pc",
  ps5: "platforms.ps5",
  ps4: "platforms.ps4",
  "xbox-series": "platforms.xbox-series",
  "xbox-one": "platforms.xbox-one",
  switch: "platforms.switch",
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await applyLocale();
  const { id } = await params;
  const platform = CATALOG_PLATFORMS.find((item) => item.id === id);
  if (!platform) return pageMetadata({ title: "GameTracker", description: t("meta.description"), path: `/platforms/${id}`, index: false });
  const name = t(TITLES[platform.id]);
  return pageMetadata({
    title: name,
    description: t("meta.platform", { name }),
    path: `/platforms/${platform.id}`,
  });
}

export default async function PlatformPage({ params }: { params: Promise<{ id: string }> }) {
  await applyLocale();
  const { id } = await params;
  const platform = CATALOG_PLATFORMS.find((item) => item.id === id);
  if (!platform) notFound();
  const games = await getBrowse("platforms", platform.id);
  if (!games) notFound();

  return (
    <main>
      <a href="/" className="-my-3 inline-flex h-11 items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow" />
        {t("common.backToSearch")}
      </a>
      <h1 className="mt-4 flex items-center gap-3 font-display text-4xl tracking-tight">
        <IconBadge name={PLATFORM_MARK[platform.id].icon} tone={PLATFORM_MARK[platform.id].tone} size="lg" />
        {t(TITLES[platform.id])}
      </h1>
      {games.length === 0 ? (
        <p className="mt-8 text-muted">{t("home.nothing")}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game) => (
            <li key={game.id}>
              <GameResult game={game} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
