"use client";

import { t } from "@gametracker/shared";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { NAV_ITEMS, isActive } from "@/components/SiteNav";
import type { Design } from "@/lib/look-cookie";

// Phone navigation: a bar for Console, a floating pill for Shelf.
export function MobileNav({ design }: { design: Design }) {
  const pathname = usePathname();

  if (design === "shelf") {
    return (
      <nav
        aria-label={t("nav.menu")}
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 rounded-full bg-strong p-1.5 shadow-2xl md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-12 items-center justify-center rounded-full text-[11px] font-bold ${
                    active ? "bg-accent text-accent-ink" : "text-strong-ink/75 hover:text-strong-ink"
                  }`}
                >
                  {t(item.label)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label={t("nav.menu")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-rail/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon name={item.icon} />
                <span className={`h-0.5 w-4 rounded-full ${active ? "bg-accent-fg" : "bg-transparent"}`} />
                {t(item.label)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
