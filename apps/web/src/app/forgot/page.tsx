import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { ForgotForm } from "@/components/ForgotForm";
import { getMe } from "@/lib/api";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return pageMetadata({ title: t("auth.forgotTitle"), description: t("meta.description"), path: "/forgot", index: false, follow: false });
}

export default async function ForgotPage() {
  await applyLocale();
  const me = await getMe();
  if (me) redirect(`/u/${encodeURIComponent(me.username)}`);

  return (
    <AuthFrame mode="forgot" loginHref="/login" registerHref="/register">
      <ForgotForm loginHref="/login" />
    </AuthFrame>
  );
}
