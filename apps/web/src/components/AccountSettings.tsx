"use client";

import { t } from "@gametracker/shared";
import { useState, type FormEvent, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

export function AccountSettings({ username }: { username: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="flex items-center gap-3 font-display text-4xl tracking-tight">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-white/10">
          <Icon name="gear" className="h-6 w-6" />
        </span>
        {t("settings.title")}
      </h1>
      <UsernameForm username={username} />
      <PasswordForm />
      <DeleteForm />
    </div>
  );
}

function UsernameForm({ username }: { username: string }) {
  return (
    <AuthForm
      title={t("settings.username")}
      icon="user"
      action="/auth/username"
      method="PUT"
      submit={t("settings.saveUsername")}
      onDone={() => window.location.reload()}
    >
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("auth.username")}
        <input name="username" required minLength={3} maxLength={24} defaultValue={username} className={fieldClass} />
      </label>
      <PasswordField />
    </AuthForm>
  );
}

function PasswordForm() {
  return (
    <AuthForm title={t("settings.password")} icon="shield" action="/auth/password" method="PUT" submit={t("settings.savePassword")}>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("settings.current")}
        <input name="currentPassword" type="password" required className={fieldClass} />
      </label>
      <label className="flex flex-col gap-2 text-sm text-muted">
        {t("settings.next")}
        <input name="nextPassword" type="password" required minLength={8} className={fieldClass} />
      </label>
    </AuthForm>
  );
}

function DeleteForm() {
  return (
    <AuthForm
      title={t("settings.delete")}
      icon="close"
      action="/auth/account"
      method="DELETE"
      submit={t("settings.deleteAction")}
      danger
      onDone={() => window.location.assign("/")}
    >
      <p className="text-sm text-muted">{t("settings.deleteHint")}</p>
      <PasswordField />
    </AuthForm>
  );
}

function PasswordField() {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      {t("auth.password")}
      <input name="password" type="password" required className={fieldClass} />
    </label>
  );
}

function AuthForm({
  title,
  icon,
  action,
  method,
  submit,
  danger,
  onDone,
  children,
}: {
  title: string;
  icon?: IconName;
  action: string;
  method: "PUT" | "DELETE";
  submit: string;
  danger?: boolean;
  onDone?: () => void;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(`${apiUrl}${action}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? t("library.saveFailed"));
        return;
      }
      setSaved(true);
      onDone?.();
    } catch {
      setError(t("library.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="rounded-3xl border border-line bg-panel/80 p-5">
      <h2 className="flex items-center gap-2.5 font-display text-2xl">
        {icon ? <Icon name={icon} className={danger ? "h-5 w-5 text-rose-300" : "h-5 w-5 text-accent"} /> : null}
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      {saved && !onDone ? <p className="mt-3 text-sm text-muted">{t("settings.saved")}</p> : null}
      <button type="submit" disabled={pending} className={`${danger ? quietDanger : primaryClass} mt-4`}>
        {submit}
      </button>
    </form>
  );
}

const quietDanger =
  "inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm text-muted hover:text-ink disabled:opacity-50";
