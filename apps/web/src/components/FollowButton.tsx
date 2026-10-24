"use client";

import { t } from "@gametracker/shared";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { primaryClass, quietClass } from "@/lib/ui";

export function FollowButton({
  username,
  following,
  onChange,
}: {
  username: string;
  following: boolean;
  onChange?: (following: boolean) => void;
}) {
  const [on, setOn] = useState(following);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/users/${encodeURIComponent(username)}/follow`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow: !on }),
      });
      const payload = (await response.json()) as { following?: boolean; error?: string };
      if (!response.ok || typeof payload.following !== "boolean") {
        setError(payload.error ?? t("profile.followFailed"));
        return;
      }
      setOn(payload.following);
      onChange?.(payload.following);
    } catch {
      setError(t("profile.followFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" disabled={pending} onClick={() => void toggle()} className={`${on ? quietClass : primaryClass} gap-1.5`}>
        <Icon name="user" className={on ? "text-muted" : "text-accent-ink"} />
        {on ? t("profile.unfollow") : t("profile.follow")}
      </button>
      {error ? <p className="text-sm text-accent-fg">{error}</p> : null}
    </div>
  );
}
