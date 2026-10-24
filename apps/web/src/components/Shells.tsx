import { t, type AuthUser } from "@gametracker/shared";
import { Suspense, type ReactNode } from "react";
import { AccountNav } from "@/components/AccountNav";
import { HeaderSearch } from "@/components/HeaderSearch";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LookSwitchPill, LookSwitchRail } from "@/components/LookSwitch";
import { MobileNav } from "@/components/MobileNav";
import { SiteNav } from "@/components/SiteNav";
import { getLibrary } from "@/lib/api";
import type { Design, Theme } from "@/lib/look-cookie";

type ShellProps = { user: AuthUser | null; design: Design; theme: Theme; children: ReactNode };

const LIBRARY_ROWS = [
  { list: "playing", label: "status.playing", dot: "bg-emerald-400" },
  { list: "backlog", label: "status.backlog", dot: "bg-sky-400" },
  { list: "finished", label: "status.finished", dot: "bg-lime-400" },
  { list: "dropped", label: "status.dropped", dot: "bg-orange-400" },
  { list: "favorites", label: "library.favorites", dot: "bg-pink-400" },
] as const;

function Logo({ full = true }: { full?: boolean }) {
  return (
    <a href="/" aria-label="GameTracker" className="inline-flex h-11 shrink-0 items-center gap-2.5">
      <img src="/brand-mark.png" alt="" className="h-9 w-auto" />
      {full ? <span className="font-display text-base font-semibold">GameTracker</span> : null}
    </a>
  );
}

async function LibraryCounts({ user }: { user: AuthUser }) {
  const library = await getLibrary(user.username).catch(() => null);
  if (!library) return null;
  const base = `/u/${encodeURIComponent(user.username)}`;
  return (
    <section className="flex flex-col gap-0.5">
      <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{t("nav.library")}</p>
      {LIBRARY_ROWS.map((row) => (
        <a
          key={row.list}
          href={`${base}?list=${row.list}`}
          className="flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm text-ink/80 hover:bg-raised/60 hover:text-ink"
        >
          <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />
          <span className="flex-1">{t(row.label)}</span>
          <span className="text-xs text-muted tabular-nums">{library[row.list].length}</span>
        </a>
      ))}
    </section>
  );
}

function SearchSlot({ className }: { className: string }) {
  return (
    <div className={className}>
      <Suspense fallback={<div className="h-11 w-full max-w-md rounded-full border border-line bg-panel/50" />}>
        <HeaderSearch />
      </Suspense>
    </div>
  );
}

export function ConsoleShell({ user, design, theme, children }: ShellProps) {
  return (
    <div className="lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-7 overflow-y-auto border-r border-line bg-rail px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <SiteNav variant="rail" />
        {user ? (
          <Suspense fallback={null}>
            <LibraryCounts user={user} />
          </Suspense>
        ) : null}
        <div className="mt-auto flex flex-col gap-4">
          <LookSwitchRail design={design} theme={theme} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{t("locale.label")}</span>
            <LanguageSwitch />
          </div>
          <AccountNav user={user} variant="rail" />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl lg:hidden lg:has-[form]:block">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:h-16 lg:flex-nowrap lg:px-10 lg:py-0">
            <div className="flex w-full items-center gap-2 lg:hidden">
              <Logo full={false} />
              <span className="flex-1" />
              <LookSwitchPill design={design} theme={theme} />
              <LanguageSwitch />
              <AccountNav user={user} variant="compact" />
            </div>
            <SearchSlot className="flex w-full empty:hidden lg:max-w-xl" />
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 lg:px-10 lg:pb-12">{children}</div>
      </div>
      <MobileNav design={design} />
    </div>
  );
}

export function ShelfShell({ user, design, theme, children }: ShellProps) {
  return (
    <>
      <header className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center gap-3 px-4 pt-5 md:px-8">
        <a
          href="/"
          className="inline-flex h-12 shrink-0 items-center rounded-full bg-strong px-5 font-display text-[17px] font-extrabold text-strong-ink"
        >
          GameTracker
        </a>
        <div className="hidden md:block">
          <SiteNav variant="pill" />
        </div>
        <SearchSlot className="order-last flex w-full empty:hidden lg:order-none lg:w-auto lg:min-w-0 lg:flex-1" />
        <span className="flex-1 lg:hidden" />
        <LookSwitchPill design={design} theme={theme} />
        <LanguageSwitch />
        <AccountNav user={user} variant="compact" />
      </header>
      <div className="mx-auto w-full max-w-[1320px] px-4 pt-6 pb-28 md:px-8 md:pb-16">{children}</div>
      <MobileNav design={design} />
    </>
  );
}
