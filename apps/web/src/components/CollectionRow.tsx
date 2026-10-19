"use client";

import type { GameSummary } from "@gametracker/shared";
import { t } from "@gametracker/shared";
import { useEffect, useRef, useState } from "react";
import { GameResult } from "@/components/GameResult";
import { IconBadge, type IconName } from "@/components/Icon";
import { formatReleaseDate } from "@/lib/format";

const BACKLOG_OPEN_KEY = "gt-home-backlog";

export function CollectionRow({
  title,
  games,
  href,
  startsCollapsed = false,
  rows = 2,
  showReleaseDate = false,
  mark,
}: {
  title: string;
  games: GameSummary[];
  href?: string;
  startsCollapsed?: boolean;
  rows?: 1 | 2;
  showReleaseDate?: boolean;
  mark?: { icon: IconName; tone: string };
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [open, setOpen] = useState(!startsCollapsed);

  useEffect(() => {
    if (!startsCollapsed) return;
    setOpen(window.localStorage.getItem(BACKLOG_OPEN_KEY) === "1");
  }, [startsCollapsed]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    function update() {
      const node = scroller.current;
      if (!node) return;
      setEdges({
        left: node.scrollLeft > 8,
        right: node.scrollLeft + node.clientWidth < node.scrollWidth - 8,
      });
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [games, open]);

  function move(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.85, 240), behavior: "smooth" });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="flex min-w-0 items-center gap-2.5 font-display text-2xl tracking-tight">
          {mark ? <IconBadge name={mark.icon} tone={mark.tone} /> : null}
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {startsCollapsed ? (
            <button type="button" className={actionClass} aria-expanded={open} onClick={() => toggleOpen(open, setOpen)}>
              {open ? t("collections.hide") : t("collections.show")}
            </button>
          ) : null}
          {href ? (
            <a href={href} className={actionClass}>
              {t("collections.all")}
            </a>
          ) : null}
        </div>
      </div>
      {!open ? null : games.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line px-5 py-8 text-sm text-muted">{t("library.empty")}</p>
      ) : (
        <div className="relative">
          {edges.left ? <Arrow label={t("collections.previous")} side="left" onClick={() => move(-1)} /> : null}
          <ul ref={scroller} className={trackClass(rows)}>
            {games.map((game) => (
              <li key={game.id} className={itemClass(rows)}>
                <GameResult
                  game={game}
                  detail={showReleaseDate && game.releaseDate ? formatReleaseDate(game.releaseDate) : undefined}
                  wrapDetail={showReleaseDate}
                />
              </li>
            ))}
          </ul>
          {edges.right ? <Arrow label={t("collections.next")} side="right" onClick={() => move(1)} /> : null}
        </div>
      )}
    </section>
  );
}

const actionClass =
  "inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink! hover:brightness-110";

function trackClass(rows: 1 | 2): string {
  const base = "no-scrollbar flex snap-x gap-4 overflow-x-auto";
  if (rows === 1) return base;
  return `${base} lg:grid lg:auto-cols-[10.5rem] lg:grid-flow-col lg:grid-rows-2 lg:overflow-x-auto`;
}

function itemClass(rows: 1 | 2): string {
  const base = "w-36 shrink-0 snap-start sm:w-40";
  if (rows === 1) return base;
  return `${base} lg:w-auto`;
}

function toggleOpen(open: boolean, setOpen: (value: boolean) => void) {
  const next = !open;
  setOpen(next);
  window.localStorage.setItem(BACKLOG_OPEN_KEY, next ? "1" : "0");
}

function Arrow({ label, side, onClick }: { label: string; side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-panel text-lg text-ink shadow-lg hover:border-accent lg:inline-flex ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
