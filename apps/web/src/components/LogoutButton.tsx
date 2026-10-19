"use client";

import { t } from "@gametracker/shared";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-muted hover:text-ink"
      aria-label={t("nav.logout")}
      onClick={() => {
        void fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" }).finally(() => {
          window.location.assign("/");
        });
      }}
    >
      <Icon name="door" />
      <span className="hidden sm:inline">{t("nav.logout")}</span>
    </button>
  );
}
