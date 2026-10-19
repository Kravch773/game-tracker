import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ImportMissingList } from "@/components/ImportMissingList";
import { getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return { title: `${t("profile.importMissingTitle")} · GameTracker` };
}

export default async function ImportMissingPage() {
  await applyLocale();
  const me = await getMe();
  if (!me) redirect("/login?next=/import/missing");
  return <ImportMissingList />;
}
