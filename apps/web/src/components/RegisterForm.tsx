"use client";

import { t, type AuthUser } from "@gametracker/shared";
import { useState, type FormEvent } from "react";
import { CodeField } from "@/components/CodeField";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

type Signup = { email: string; username: string; password: string };
type RegisterReply = { error?: string; user?: AuthUser; pending?: boolean };

// Two steps when the API sends mail: the details, then the 6-digit code from the email. The details stay
// in memory so "send again" can repeat the request without asking for them twice.
export function RegisterForm({ next }: { next: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [signup, setSignup] = useState<Signup | null>(null);
  const [step, setStep] = useState<"details" | "code">("details");

  function finish(user: AuthUser) {
    window.location.assign(next ?? `/u/${encodeURIComponent(user.username)}`);
  }

  async function send(details: Signup): Promise<boolean> {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(details),
    });
    const payload = (await response.json()) as RegisterReply;
    if (payload.user) {
      finish(payload.user);
      return true;
    }
    if (!response.ok || !payload.pending) {
      setError(payload.error ?? t("auth.registerFailed"));
      return false;
    }
    return true;
  }

  async function onDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = {
      email: String(form.get("email") ?? "").trim(),
      username: String(form.get("username") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };
    if (details.password !== String(form.get("confirm") ?? "")) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (await send(details)) {
        setSignup(details);
        setStep("code");
      }
    } catch {
      setError(t("auth.registerFailed"));
    }
    setPending(false);
  }

  async function onCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signup) return;
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`${apiUrl}/auth/register/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signup.email, code }),
      });
      const payload = (await response.json()) as RegisterReply;
      if (response.ok && payload.user) {
        finish(payload.user);
        return;
      }
      setError(payload.error ?? t("auth.registerFailed"));
    } catch {
      setError(t("auth.registerFailed"));
    }
    setPending(false);
  }

  async function resend() {
    if (!signup) return;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      if (await send(signup)) setNotice(t("auth.codeResent"));
    } catch {
      setError(t("auth.registerFailed"));
    }
    setPending(false);
  }

  if (step === "code" && signup) {
    return (
      <form onSubmit={(event) => void onCode(event)} className="mt-6 flex flex-col gap-4">
        <p className="text-sm text-muted">{t("auth.codeSent", { email: signup.email })}</p>
        <CodeField />
        {error ? <p className="text-sm text-accent-fg">{error}</p> : null}
        {notice ? <p className="text-sm text-muted">{notice}</p> : null}
        <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
          {pending ? t("auth.confirming") : t("auth.confirm")}
        </button>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button type="button" disabled={pending} onClick={() => void resend()} className="min-h-11 font-semibold text-ink hover:text-accent-fg">
            {t("auth.resend")}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("details");
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
    <form onSubmit={(event) => void onDetails(event)} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.email")}
        <input name="email" type="email" required autoComplete="email" defaultValue={signup?.email} className={fieldClass} />
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
          defaultValue={signup?.username}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.password")}
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.passwordAgain")}
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <p className="text-sm text-muted">{t("auth.noConfirm")}</p>
      {error ? <p className="text-sm text-accent-fg">{error}</p> : null}
      <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
        {pending ? t("auth.creating") : t("auth.create")}
      </button>
    </form>
  );
}
