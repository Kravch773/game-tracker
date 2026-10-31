import { t, type AuthUser } from "@gametracker/shared";
import { DealsBell } from "@/components/DealsBell";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "./LogoutButton";
import { primaryClass, quietClass } from "@/lib/ui";

// Account controls only; the section links live in SiteNav and MobileNav.
export function AccountNav({ user, variant }: { user: AuthUser | null; variant: "rail" | "compact" }) {
  if (!user) {
    if (variant === "rail") {
      return (
        <div className="grid grid-cols-2 gap-2">
          <a href="/login" className={`${quietClass} px-3`}>
            {t("nav.login")}
          </a>
          <a href="/register" className={`${primaryClass} px-3`}>
            {t("nav.register")}
          </a>
        </div>
      );
    }
    return (
      <nav className="flex shrink-0 items-center gap-2">
        <a href="/login" className={`${quietClass} gap-1.5 px-3 md:px-5`} aria-label={t("nav.login")}>
          <Icon name="user" />
          <span className="hidden md:inline">{t("nav.login")}</span>
        </a>
        <a href="/register" className={`${primaryClass} gap-1.5 px-3 max-sm:hidden md:px-5`} aria-label={t("nav.register")}>
          <Icon name="spark" />
          <span className="hidden md:inline">{t("nav.register")}</span>
        </a>
      </nav>
    );
  }

  const initial = user.username.slice(0, 1).toUpperCase();
  const profile = `/u/${encodeURIComponent(user.username)}`;

  if (variant === "rail") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <a href={profile} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 hover:bg-raised/60">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm text-accent-ink">
            {initial}
          </span>
          <span className="truncate text-sm font-semibold">{user.username}</span>
        </a>
        <DealsBell variant="rail" />
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <DealsBell variant="compact" />
      <a
        href={profile}
        aria-label={user.username}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent font-display text-accent-ink sm:h-11 sm:w-11"
      >
        {initial}
      </a>
    </div>
  );
}
