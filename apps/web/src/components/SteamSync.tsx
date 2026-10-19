"use client";

import { t, type SteamSyncResult } from "@gametracker/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

export function SteamSync({ initialProfile }: { initialProfile: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  async function sync() {
    setPending(true);
    setFailed(false);
    setMessage(null);
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
      setPending(false);
    }
  }

  return (
    <form
      className="rounded-3xl border border-line bg-panel/80 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void sync();
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
      <button type="submit" disabled={pending || profile.trim().length === 0} className={`${primaryClass} mt-4`}>
        {pending ? t("profile.steamSyncing") : t("profile.steamSync")}
      </button>
    </form>
  );
}
