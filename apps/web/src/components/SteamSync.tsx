"use client";

import { t, type SteamSyncResult } from "@gametracker/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/config";

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
      className="mt-4 flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void sync();
      }}
    >
      <label className="sr-only" htmlFor="steam-profile">
        {t("profile.steamLabel")}
      </label>
      <input
        id="steam-profile"
        value={profile}
        onChange={(event) => setProfile(event.target.value)}
        placeholder={t("profile.steamPlaceholder")}
        maxLength={200}
        autoComplete="off"
        spellCheck={false}
        className="h-10 min-w-64 flex-1 rounded-full border border-line bg-panel px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending || profile.trim().length === 0}
        className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink! disabled:opacity-50"
      >
        {pending ? t("profile.steamSyncing") : t("profile.steamSync")}
      </button>
      {message ? <p className={`w-full text-sm ${failed ? "text-rose-300" : "text-muted"}`}>{message}</p> : null}
    </form>
  );
}
