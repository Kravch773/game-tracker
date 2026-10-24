import { t, type AuthUser } from "@gametracker/shared";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "./LogoutButton";
import { primaryClass, quietClass } from "@/lib/ui";

// On phones these links live in MobileNav's bottom bar.
const linkClass = "hidden h-11 items-center sm:inline-flex gap-1.5 rounded-full px-2 text-sm text-muted hover:text-ink sm:px-3";

export function AccountNav({ user }: { user: AuthUser | null }) {
  if (!user) {
    return (
      <nav className="flex shrink-0 items-center gap-2">
        <a href="/guide" className={linkClass} aria-label={t("nav.guide")}>
          <Icon name="compass" />
          <span className="hidden md:inline">{t("nav.guide")}</span>
        </a>
        <a href="/news" className={linkClass} aria-label={t("nav.news")}>
          <Icon name="book" />
          <span className="hidden md:inline">{t("nav.news")}</span>
        </a>
        <a href="/calendar" className={linkClass} aria-label={t("nav.calendar")}>
          <Icon name="calendar" />
          <span className="hidden md:inline">{t("nav.calendar")}</span>
        </a>
        <a href="/activity" className={linkClass} aria-label={t("nav.activity")}>
          <Icon name="pulse" />
          <span className="hidden md:inline">{t("nav.activity")}</span>
        </a>
        <a href="/login" className={`${quietClass} gap-1.5 px-3 sm:px-5`} aria-label={t("nav.login")}>
          <Icon name="user" />
          <span className="hidden sm:inline">{t("nav.login")}</span>
        </a>
        <a href="/register" className={`${primaryClass} gap-1.5 px-3 text-accent-ink! sm:px-5`} aria-label={t("nav.register")}>
          <Icon name="spark" />
          <span className="hidden sm:inline">{t("nav.register")}</span>
        </a>
      </nav>
    );
  }

  const initial = user.username.slice(0, 1).toUpperCase();

  return (
    <nav className="flex min-w-0 items-center gap-2">
      <a href="/guide" className={linkClass} aria-label={t("nav.guide")}>
        <Icon name="compass" />
        <span className="hidden lg:inline">{t("nav.guide")}</span>
      </a>
      <a href="/news" className={linkClass} aria-label={t("nav.news")}>
        <Icon name="book" />
        <span className="hidden lg:inline">{t("nav.news")}</span>
      </a>
      <a href="/calendar" className={linkClass} aria-label={t("nav.calendar")}>
        <Icon name="calendar" />
        <span className="hidden lg:inline">{t("nav.calendar")}</span>
      </a>
      <a href="/activity" className={linkClass} aria-label={t("nav.activity")}>
        <Icon name="pulse" />
        <span className="hidden lg:inline">{t("nav.activity")}</span>
      </a>
      <a
        href={`/u/${encodeURIComponent(user.username)}`}
        className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full border border-line bg-white/5 pr-4 pl-1.5 text-sm font-medium hover:border-white/25"
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm text-accent-ink">
          {initial}
        </span>
        <span className="truncate">{user.username}</span>
      </a>
      <LogoutButton />
    </nav>
  );
}
