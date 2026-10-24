"use client";

import { t, type MessageKey } from "@gametracker/shared";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

export const NAV_ITEMS: { href: string; icon: IconName; label: MessageKey }[] = [
  { href: "/", icon: "gamepad", label: "nav.catalog" },
  { href: "/guide", icon: "compass", label: "nav.guide" },
  { href: "/news", icon: "book", label: "nav.news" },
  { href: "/calendar", icon: "calendar", label: "nav.calendar" },
  { href: "/activity", icon: "pulse", label: "nav.activity" },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/genres") || pathname.startsWith("/platforms") || pathname.startsWith("/games");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ variant }: { variant: "rail" | "pill" }) {
  const pathname = usePathname();

  if (variant === "rail") {
    return (
      <nav aria-label={t("nav.menu")} className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                active ? "bg-raised text-ink" : "text-muted hover:bg-raised/60 hover:text-ink"
              }`}
            >
              <span className={`h-2 w-2 rounded-[3px] ${active ? "bg-accent-fg" : "bg-muted/50"}`} />
              {t(item.label)}
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label={t("nav.menu")} className="flex h-12 items-center gap-0.5 rounded-full bg-panel p-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold ${
              active ? "bg-raised text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {t(item.label)}
          </a>
        );
      })}
    </nav>
  );
}
