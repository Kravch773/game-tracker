"use client";

import { t } from "@gametracker/shared";
import { useEffect, useId, type ReactNode } from "react";

export function Dialog({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("common.close")}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[min(92vh,820px)] w-full overflow-y-auto rounded-3xl border border-line bg-panel p-5 shadow-2xl sm:p-6 ${wide ? "max-w-xl" : "max-w-lg"}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-2xl tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">{t("common.close")}</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
