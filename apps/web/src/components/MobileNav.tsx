"use client";

import { t, type MessageKey } from "@gametracker/shared";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const ITEMS: { href: string; icon: "compass" | "book" | "calendar" | "pulse"; label: MessageKey }[] = [
  { href: "/guide", icon: "compass", label: "nav.guide" },
  { href: "/news", icon: "book", label: "nav.news" },
  { href: "/calendar", icon: "calendar", label: "nav.calendar" },
  { href: "/activity", icon: "pulse", label: "nav.activity" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      aria-label={t("nav.menu")}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? "text-accent" : "text-muted hover:text-ink"
                }`}
              >
                <Icon name={item.icon} />
                {t(item.label)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
