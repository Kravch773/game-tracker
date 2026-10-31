"use client";

import { DEAL_MIN_CUTS, t, type DealSettings } from "@gametracker/shared";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { SteamSync } from "@/components/SteamSync";
import { apiUrl } from "@/lib/config";
import { fieldClass, primaryClass } from "@/lib/ui";

export function AccountSettings({ username, steamId }: { username: string; steamId: string | null }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="flex items-center gap-3 font-display text-4xl tracking-tight">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent-fg ring-1 ring-ink/10">
          <Icon name="gear" className="h-6 w-6" />
        </span>
        {t("settings.title")}
      </h1>
      <UsernameForm username={username} />
      <PasswordForm />
      <SteamSync initialProfile={steamId ? `https://steamcommunity.com/profiles/${steamId}` : ""} />
      <DealSettingsForm />
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
        <input
          name="username"
          required
          minLength={3}
          maxLength={24}
          pattern="(?=.*[A-Za-z0-9])[A-Za-z0-9_]{3,24}"
          defaultValue={username}
          className={fieldClass}
        />
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
        {icon ? <Icon name={icon} className={danger ? "h-5 w-5 text-rose-700 dark:text-rose-300" : "h-5 w-5 text-accent-fg"} /> : null}
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
      {error ? <p className="mt-3 text-sm text-accent-fg">{error}</p> : null}
      {saved && !onDone ? <p className="mt-3 text-sm text-muted">{t("settings.saved")}</p> : null}
      <button type="submit" disabled={pending} className={`${danger ? quietDanger : primaryClass} mt-4`}>
        {submit}
      </button>
    </form>
  );
}

const quietDanger =
  "inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm text-muted hover:text-ink disabled:opacity-50";

// Discount alerts save on every change; there is nothing to type, so no submit button.
function DealSettingsForm() {
  const [settings, setSettings] = useState<DealSettings | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");

  useEffect(() => {
    fetch(`${apiUrl}/me/deal-settings`, { credentials: "include" })
      .then(async (response) => (response.ok ? setSettings((await response.json()) as DealSettings) : setStatus("failed")))
      .catch(() => setStatus("failed"));
  }, []);

  async function save(patch: Partial<DealSettings>) {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, ...patch });
    setStatus("idle");
    try {
      const response = await fetch(`${apiUrl}/me/deal-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error(String(response.status));
      setSettings((await response.json()) as DealSettings);
      setStatus("saved");
    } catch {
      setSettings(previous);
      setStatus("failed");
    }
  }

  return (
    <section id="deals" className="scroll-mt-24 rounded-3xl border border-line bg-panel/80 p-5">
      <h2 className="flex items-center gap-2.5 font-display text-2xl">
        <Icon name="tag" className="h-5 w-5 text-accent-fg" />
        {t("prices.settingsTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted">{t("prices.settingsLead")}</p>
      <div className="mt-4 flex flex-col gap-3">
        <label className="flex items-start gap-3 rounded-2xl bg-raised p-3">
          <input
            type="checkbox"
            checked={settings ? !settings.alerts : false}
            disabled={!settings}
            onChange={(event) => void save({ alerts: !event.target.checked })}
            className="mt-0.5 h-5 w-5 accent-accent"
          />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{t("prices.mute")}</span>
            <span className="text-xs text-muted">{t("prices.muteHint")}</span>
          </span>
        </label>
        <label className="flex flex-wrap items-center gap-3 rounded-2xl bg-raised p-3">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-semibold">{t("prices.minCut")}</span>
            <span className="text-xs text-muted">{t("prices.minCutHint")}</span>
          </span>
          <select
            value={settings?.minCut ?? 10}
            disabled={!settings}
            onChange={(event) => void save({ minCut: Number(event.target.value) })}
            className="h-11 rounded-full border border-line bg-panel px-3 text-sm font-semibold"
          >
            {DEAL_MIN_CUTS.map((cut) => (
              <option key={cut} value={cut}>
                {cut}%
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-start gap-3 rounded-2xl bg-raised p-3">
          <input
            type="checkbox"
            checked={settings?.wishlist ?? true}
            disabled={!settings}
            onChange={(event) => void save({ wishlist: event.target.checked })}
            className="mt-0.5 h-5 w-5 accent-accent"
          />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-semibold">{t("prices.wishlist")}</span>
            <span className="text-xs text-muted">{t("prices.wishlistHint")}</span>
          </span>
        </label>
      </div>
      {status !== "idle" ? (
        <p role="status" className="mt-3 text-sm text-muted">
          {t(status === "saved" ? "prices.saved" : "prices.failed")}
        </p>
      ) : null}
    </section>
  );
}
