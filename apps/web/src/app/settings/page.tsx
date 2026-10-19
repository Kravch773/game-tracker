import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/AccountSettings";
import { getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return { title: `${t("settings.title")} · GameTracker` };
}

export default async function SettingsPage() {
  await applyLocale();
  const me = await getMe();
  if (!me) redirect("/login?next=/settings");
  return (
    <main>
      <AccountSettings username={me.username} steamId={me.steamId} />
    </main>
  );
}
