import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { AuthFrame } from "@/components/AuthFrame";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getMe } from "@/lib/api";
import { safeNext } from "@/lib/config";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return pageMetadata({ title: t("auth.loginTitle"), description: t("meta.description"), path: "/login", index: false, follow: false });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await applyLocale();
  const me = await getMe();
  const { next: nextParam } = await searchParams;
  const next = safeNext(nextParam);
  if (me) redirect(next ?? `/u/${encodeURIComponent(me.username)}`);

  return (
    <AuthFrame mode="login" loginHref={loginHref(next)} registerHref={registerHref(next)}>
      <LoginForm next={next} />
      <p className="mt-5 text-sm text-muted">
        {t("auth.noProfile")} <a href={registerHref(next)} className="font-semibold text-ink hover:text-accent-fg">{t("nav.register")}</a>
      </p>
    </AuthFrame>
  );
}

function registerHref(next: string | null): string {
  return next ? `/register?next=${encodeURIComponent(next)}` : "/register";
}

function loginHref(next: string | null): string {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}
