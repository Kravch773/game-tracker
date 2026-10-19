"use client";

import { t, type AuthUser } from "@gametracker/shared";
import { useState, type FormEvent } from "react";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

export function RegisterForm({ next }: { next: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          username: form.get("username"),
          password,
        }),
      });
      const payload = (await response.json()) as { error?: string; user?: AuthUser };
      if (!response.ok || !payload.user) {
        setError(payload.error ?? t("auth.registerFailed"));
        setPending(false);
        return;
      }
      window.location.assign(next ?? `/u/${encodeURIComponent(payload.user.username)}`);
    } catch {
      setError(t("auth.registerFailed"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.email")}
        <input name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.username")}
        <input
          name="username"
          required
          minLength={3}
          maxLength={24}
          pattern="(?=.*[A-Za-z0-9])[A-Za-z0-9_]{3,24}"
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
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.passwordAgain")}
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </label>
      <p className="text-sm text-muted">{t("auth.noConfirm")}</p>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
        {pending ? t("auth.creating") : t("auth.create")}
      </button>
    </form>
  );
}
