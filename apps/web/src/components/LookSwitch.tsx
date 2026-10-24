"use client";

import { t } from "@gametracker/shared";
import { useState } from "react";
import { DESIGN_COOKIE, THEME_COOKIE, lookCookie, type Design, type Theme } from "@/lib/look-cookie";

const MOON = "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z";
const SUN =
  "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z";

function chooseDesign(design: Design, current: Design) {
  if (design === current) return;
  document.cookie = lookCookie(DESIGN_COOKIE, design);
  window.location.reload();
}

function useTheme(initial: Theme) {
  const [theme, setTheme] = useState(initial);
  function choose(next: Theme) {
    setTheme(next);
    document.cookie = lookCookie(THEME_COOKIE, next);
    document.documentElement.dataset.theme = next;
  }
  return [theme, choose] as const;
}

function Glyph({ path }: { path: string }) {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d={path} />
    </svg>
  );
}

// Two stacked segmented controls for the Console sidebar.
export function LookSwitchRail({ design, theme: initial }: { design: Design; theme: Theme }) {
  const [theme, chooseTheme] = useTheme(initial);
  const designs: { id: Design; label: string; swatch: string; dot: string }[] = [
    { id: "console", label: t("look.console"), swatch: "bg-[#0b0d12] ring-1 ring-ink/20", dot: "bg-[#d7ff3a]" },
    { id: "shelf", label: t("look.shelf"), swatch: "bg-[#eeeaf6]", dot: "bg-[#ff6b4a]" },
  ];
  const themes: { id: Theme; label: string; icon: string }[] = [
    { id: "dark", label: t("look.dark"), icon: MOON },
    { id: "light", label: t("look.light"), icon: SUN },
  ];
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{t("look.title")}</p>
      <div role="radiogroup" aria-label={t("look.design")} className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line bg-panel p-1">
        {designs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={design === item.id}
            onClick={() => chooseDesign(item.id, design)}
            className={`flex h-16 flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-bold ${
              design === item.id ? "bg-raised text-ink ring-1 ring-accent-fg" : "text-muted hover:text-ink"
            }`}
          >
            <span className={`relative block h-6 w-10 rounded-md ${item.swatch}`}>
              <span className={`absolute top-1 left-1 h-3.5 w-2.5 rounded-sm ${item.dot}`} />
            </span>
            {item.label}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label={t("look.theme")} className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-panel p-1">
        {themes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={theme === item.id}
            onClick={() => chooseTheme(item.id)}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold ${
              theme === item.id ? "bg-strong text-strong-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Glyph path={item.icon} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// A design pill and a sun/moon button for the Shelf header.
export function LookSwitchPill({ design, theme: initial }: { design: Design; theme: Theme }) {
  const [theme, chooseTheme] = useTheme(initial);
  const designs: { id: Design; label: string; swatch: string }[] = [
    { id: "console", label: t("look.console"), swatch: "bg-[#0b0d12] ring-2 ring-[#d7ff3a] ring-inset" },
    { id: "shelf", label: t("look.shelf"), swatch: "bg-[#ff6b4a] ring-2 ring-[#ffd84d] ring-inset" },
  ];
  const next = theme === "dark" ? "light" : "dark";
  return (
    <div className="flex items-center gap-2">
      <div role="radiogroup" aria-label={t("look.design")} className="flex h-12 items-center gap-0.5 rounded-full bg-panel p-1">
        {designs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={design === item.id}
            onClick={() => chooseDesign(item.id, design)}
            className={`inline-flex h-10 items-center gap-2 rounded-full px-2.5 text-[13px] font-bold sm:px-3 ${
              design === item.id ? "bg-strong text-strong-ink" : "text-muted hover:text-ink"
            }`}
          >
            <span className={`h-4 w-4 rounded-full ${item.swatch}`} />
            <span className="hidden xl:inline">{item.label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => chooseTheme(next)}
        aria-label={next === "light" ? t("look.toLight") : t("look.toDark")}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-panel text-ink"
      >
        <Glyph path={theme === "dark" ? SUN : MOON} />
      </button>
    </div>
  );
}
