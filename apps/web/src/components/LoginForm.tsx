"use client";

import { t, type AuthUser } from "@gametracker/shared";
import { useState, type FormEvent } from "react";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

export function LoginForm({ next }: { next: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: form.get("login"),
          password: form.get("password"),
        }),
      });
      const payload = (await response.json()) as { error?: string; user?: AuthUser };
      if (!response.ok || !payload.user) {
        setError(payload.error ?? t("auth.loginFailed"));
        setPending(false);
        return;
      }
      window.location.assign(next ?? `/u/${encodeURIComponent(payload.user.username)}`);
    } catch {
      setError(t("auth.loginFailed"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.loginOrUsername")}
        <input
          name="login"
          required
          autoComplete="username"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.password")}
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <button type="submit" disabled={pending} className={`${primaryClass} mt-1 w-full`}>
        {pending ? t("auth.signingIn") : t("nav.login")}
      </button>
    </form>
  );
}
