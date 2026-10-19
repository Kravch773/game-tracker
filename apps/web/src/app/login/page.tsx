import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IconBadge } from "@/components/Icon";
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
    <main className="mx-auto max-w-md rounded-3xl border border-line bg-panel/80 p-6 shadow-2xl sm:p-8">
      <p className="text-sm font-medium tracking-[0.16em] text-accent uppercase">{t("auth.eyebrow")}</p>
      <h1 className="mt-3 flex items-center gap-3 font-display text-4xl tracking-tight">
        <IconBadge name="user" size="lg" />
        {t("auth.loginTitle")}
      </h1>
      <LoginForm next={next} />
      <p className="mt-5 text-sm text-muted">
        {t("auth.noProfile")} <a href={registerHref(next)} className="text-ink hover:text-accent">{t("nav.register")}</a>
      </p>
    </main>
  );
}

function registerHref(next: string | null): string {
  return next ? `/register?next=${encodeURIComponent(next)}` : "/register";
}
