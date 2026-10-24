"use client";

import { t, type FollowPerson } from "@gametracker/shared";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { apiUrl } from "@/lib/config";

export function FollowList({
  username,
  kind,
  onClose,
}: {
  username: string;
  kind: "followers" | "following" | null;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<FollowPerson[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kind) return;
    const controller = new AbortController();
    setUsers(null);
    setError(null);
    void fetch(`${apiUrl}/users/${encodeURIComponent(username)}/follows?kind=${kind}`, {
      signal: controller.signal,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as { users?: FollowPerson[] };
        setUsers(payload.users ?? []);
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setError(t("profile.followsFailed"));
      });
    return () => controller.abort();
  }, [kind, username]);

  return (
    <Dialog open={kind != null} title={kind === "followers" ? t("profile.followers") : t("profile.following")} onClose={onClose}>
      {error ? <p className="text-sm text-accent-fg">{error}</p> : null}
      {!error && users && users.length === 0 ? <p className="text-sm text-muted">{t("profile.followsEmpty")}</p> : null}
      {users && users.length > 0 ? (
        <ul className="flex flex-col">
          {users.map((person) => (
            <li key={person.username}>
              <a
                href={`/u/${encodeURIComponent(person.username)}`}
                className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-ink/5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent font-display text-sm text-accent-ink">
                  {person.username.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate font-medium">{person.username}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </Dialog>
  );
}
