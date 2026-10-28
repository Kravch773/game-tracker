"use client";

import { t, type AuthUser } from "@gametracker/shared";
import { useState, type FormEvent } from "react";
import { CodeField } from "@/components/CodeField";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

// Password reset in two steps: the email gets a code, then the code and a new password sign the user in.
export function ForgotForm({ loginHref }: { loginHref: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestCode(address: string): Promise<boolean> {
    const response = await fetch(`${apiUrl}/auth/forgot`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address }),
    });
    if (response.ok) return true;
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setError(payload.error ?? t("auth.emailFailed"));
    return false;
  }

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setPending(true);
    setError(null);
    try {
      if (await requestCode(address)) setEmail(address);
    } catch {
      setError(t("auth.emailFailed"));
    }
    setPending(false);
  }

  async function onReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`${apiUrl}/auth/reset`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: form.get("code"), password }),
      });
      const payload = (await response.json()) as { error?: string; user?: AuthUser };
      if (response.ok && payload.user) {
        window.location.assign(`/u/${encodeURIComponent(payload.user.username)}`);
        return;
      }
      setError(payload.error ?? t("auth.resetFailed"));
    } catch {
      setError(t("auth.resetFailed"));
    }
    setPending(false);
  }

  async function resend() {
    if (!email) return;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      if (await requestCode(email)) setNotice(t("auth.codeResent"));
    } catch {
      setError(t("auth.emailFailed"));
    }
    setPending(false);
  }

  if (email) {
    return (
      <form onSubmit={(event) => void onReset(event)} className="mt-6 flex flex-col gap-4">
        <p className="text-sm text-muted">{t("auth.resetSent", { email })}</p>
        <CodeField />
        <label className="flex flex-col gap-2 text-sm text-muted">
          {t("auth.newPassword")}
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          {t("auth.newPasswordAgain")}
          <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
        </label>
        {error ? <p className="text-sm text-accent-fg">{error}</p> : null}
        {notice ? <p className="text-sm text-muted">{notice}</p> : null}
        <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
          {pending ? t("auth.saving") : t("auth.savePassword")}
        </button>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button type="button" disabled={pending} onClick={() => void resend()} className="min-h-11 font-semibold text-ink hover:text-accent-fg">
            {t("auth.resend")}
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail(null);
              setError(null);
              setNotice(null);
            }}
            className="min-h-11 text-muted hover:text-ink"
          >
            {t("auth.changeEmail")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={(event) => void onEmail(event)} className="mt-6 flex flex-col gap-4">
      <p className="text-sm text-muted">{t("auth.forgotLead")}</p>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.email")}
        <input name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>
      {error ? <p className="text-sm text-accent-fg">{error}</p> : null}
      <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
        {pending ? t("auth.sending") : t("auth.sendCode")}
      </button>
      <a href={loginHref} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
        {t("auth.backToLogin")}
      </a>
    </form>
  );
}
