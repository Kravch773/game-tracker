import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe, getSteamWishlistMissing } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";
import { primaryClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return pageMetadata({
    title: t("profile.steamWishlistMissingTitle"),
    description: t("profile.steamWishlistMissingLead"),
    path: "/steam/wishlist",
    index: false,
    follow: false,
  });
}

export default async function SteamWishlistMissingPage() {
  await applyLocale();
  const me = await getMe();
  if (!me) redirect("/login?next=/steam/wishlist");
  const apps = await getSteamWishlistMissing();

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl tracking-tight">{t("profile.steamWishlistMissingTitle")}</h1>
      <p className="mt-2 text-muted">
        {apps.length > 0 ? t("profile.steamWishlistMissingLead") : t("profile.steamWishlistMissingEmpty")}
      </p>
      {apps.length > 0 ? (
        <ul className="mt-6 flex flex-col divide-y divide-white/10 overflow-hidden rounded-3xl border border-line bg-panel/80">
          {apps.map((app) => (
            <li key={app.appId}>
              <a
                href={`https://store.steampowered.com/app/${app.appId}`}
                target="_blank"
                rel="noreferrer"
                className="block px-4 py-3 text-sm text-ink!"
              >
                {app.title || t("profile.steamWishlistApp", { appId: app.appId })}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <a href={`/u/${me.username}`} className={`${primaryClass} mt-6 text-accent-ink!`}>
        {t("profile.importMissingBack")}
      </a>
    </main>
  );
}
