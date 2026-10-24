"use client";

import { t } from "@gametracker/shared";
import { useState, type ReactNode } from "react";
import { HOME_TOP_COOKIE, lookCookie } from "@/lib/look-cookie";

// The block above the catalog can be folded to one line; the choice is kept in a cookie
// so the server renders it folded on the next visit without a jump.
export function HomeTopFold({ initialOpen, summary, children }: { initialOpen: boolean; summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(initialOpen);

  function toggle() {
    const next = !open;
    setOpen(next);
    document.cookie = lookCookie(HOME_TOP_COOKIE, next ? "open" : "hidden");
  }

  const button = (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="home-top"
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-panel px-4 text-sm font-semibold text-muted hover:text-ink"
    >
      {open ? t("dash.hide") : t("dash.show")}
      <span aria-hidden="true" className={`inline-block transition ${open ? "" : "rotate-180"}`}>
        ⌃
      </span>
    </button>
  );

  return (
    <section className="mb-12">
      {open ? (
        <>
          <div className="mb-3 flex justify-end">{button}</div>
          <div id="home-top">{children}</div>
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel py-2 pr-2 pl-4">
          <p className="min-w-0 flex-1 truncate text-sm text-muted">{summary}</p>
          {button}
        </div>
      )}
    </section>
  );
}
