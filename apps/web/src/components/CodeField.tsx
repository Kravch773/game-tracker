import { t } from "@gametracker/shared";
import { fieldClass } from "@/lib/ui";

// The 6-digit code from an email; one-time-code lets phones offer it straight from the message.
export function CodeField() {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      {t("auth.code")}
      <input
        name="code"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        autoFocus
        className={`${fieldClass} text-center font-display text-2xl tracking-[0.5em]`}
      />
    </label>
  );
}
