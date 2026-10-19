"use client";

import { t, type SteamSyncResult, type SteamWishlistResult } from "@gametracker/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

export function SteamSync({ initialProfile }: { initialProfile: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [pending, setPending] = useState<"library" | "wishlist" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [missing, setMissing] = useState(0);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  async function syncLibrary() {
    setPending("library");
    setFailed(false);
    setMessage(null);
    setMissing(0);
    try {
      const response = await fetch(`${apiUrl}/me/steam/sync`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const payload = (await response.json().catch(() => null)) as (SteamSyncResult & { error?: string }) | null;
      if (!response.ok || !payload || payload.error) {
        setFailed(true);
        setMessage(payload?.error || t("profile.steamFailed"));
        return;
      }
      setProfile(`https://steamcommunity.com/profiles/${payload.steamId}`);
      setMessage(
        t("profile.steamDone", {
          matched: payload.matched,
          added: payload.added,
          unmatched: payload.unmatched,
        }),
      );
      router.refresh();
    } catch {
      setFailed(true);
      setMessage(t("profile.steamFailed"));
    } finally {
      setPending(null);
    }
  }

  async function syncWishlist() {
    setPending("wishlist");
    setFailed(false);
    setMessage(null);
    setMissing(0);
    try {
      const response = await fetch(`${apiUrl}/me/steam/wishlist`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const payload = (await response.json().catch(() => null)) as (SteamWishlistResult & { error?: string }) | null;
      if (!response.ok || !payload || payload.error) {
        setFailed(true);
        setMessage(payload?.error || t("profile.steamFailed"));
        return;
      }
      setProfile(`https://steamcommunity.com/profiles/${payload.steamId}`);
      setMissing(payload.unmatched);
      setMessage(t("profile.steamWishlistDone", { matched: payload.matched, unmatched: payload.unmatched }));
      router.refresh();
    } catch {
      setFailed(true);
      setMessage(t("profile.steamFailed"));
    } finally {
      setPending(null);
    }
  }

  return (
    <form
      className="rounded-3xl border border-line bg-panel/80 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void syncLibrary();
      }}
    >
      <h2 className="flex items-center gap-2.5 font-display text-2xl">
        <Icon name="steam" className="h-5 w-5 text-accent" />
        {t("settings.steamTitle")}
      </h2>
      <label className="mt-4 flex flex-col gap-2 text-sm text-muted" htmlFor="steam-profile">
        {t("profile.steamLabel")}
        <input
          id="steam-profile"
          value={profile}
          onChange={(event) => setProfile(event.target.value)}
          placeholder={t("profile.steamPlaceholder")}
          maxLength={200}
          autoComplete="off"
          spellCheck={false}
          className={fieldClass}
        />
      </label>
      {message ? <p className={`mt-3 text-sm ${failed ? "text-rose-300" : "text-muted"}`}>{message}</p> : null}
      {!failed && missing > 0 ? (
        <a href="/steam/wishlist" className="mt-3 inline-block text-sm text-accent-ink!">
          {t("profile.steamWishlistMissingLink", { count: missing })}
        </a>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="submit" disabled={pending != null || profile.trim().length === 0} className={primaryClass}>
          {pending === "library" ? t("profile.steamSyncing") : t("profile.steamSync")}
        </button>
        <button
          type="button"
          disabled={pending != null || profile.trim().length === 0}
          onClick={() => void syncWishlist()}
          className="inline-flex h-12 items-center rounded-full border border-line px-5 text-sm font-medium hover:text-ink disabled:opacity-50"
        >
          {pending === "wishlist" ? t("profile.steamWishlistSyncing") : t("profile.steamWishlistSync")}
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">{t("profile.steamWishlistHint")}</p>
    </form>
  );
}
