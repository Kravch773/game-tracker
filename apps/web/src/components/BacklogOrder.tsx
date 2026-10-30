"use client";

import { t, type LibraryGame } from "@gametracker/shared";
import { useEffect, useRef, useState, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";

export type CardControls = {
  dragging: boolean;
  onPriority?: () => void;
  itemProps?: HTMLAttributes<HTMLLIElement> & { "data-game": string };
};

const HOLD_MS = 280;
const EDGE = 90;

// The backlog shown in its owner's order: priority games on top, then the rest. With onChange the owner can
// drag covers around the grid (mouse straight away, touch after a short hold) and star games into priority.
export function BacklogSections({
  games,
  card,
  onChange,
}: {
  games: LibraryGame[];
  card: (game: LibraryGame, controls: CardControls) => ReactNode;
  onChange?: (games: LibraryGame[]) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const drag = useRef<{ id: string; x: number; y: number; touch: boolean; active: boolean; timer: number | null } | null>(null);
  const moved = useRef(false);
  const pointer = useRef({ y: 0 });
  const latest = useRef(games);
  latest.current = games;
  const priority = games.filter((game) => game.priority);
  const rest = games.filter((game) => !game.priority);

  // While a drag is on, touch scrolling is held back and the page scrolls by itself near the screen edges.
  useEffect(() => {
    if (!dragging) return;
    const hold = (event: TouchEvent) => event.preventDefault();
    let frame = 0;
    const tick = () => {
      const y = pointer.current.y;
      if (y < EDGE) window.scrollBy(0, -Math.ceil((EDGE - y) / 6));
      else if (y > window.innerHeight - EDGE) window.scrollBy(0, Math.ceil((y - window.innerHeight + EDGE) / 6));
      frame = window.requestAnimationFrame(tick);
    };
    document.addEventListener("touchmove", hold, { passive: false });
    frame = window.requestAnimationFrame(tick);
    return () => {
      document.removeEventListener("touchmove", hold);
      window.cancelAnimationFrame(frame);
    };
  }, [dragging]);

  if (!onChange) {
    const plain = (game: LibraryGame) => card(game, { dragging: false });
    if (priority.length === 0) return <>{rest.map(plain)}</>;
    return (
      <>
        <SectionTitle label={t("profile.priority")} count={priority.length} first />
        {priority.map(plain)}
        <SectionTitle label={t("profile.rest")} count={rest.length} />
        {rest.map(plain)}
      </>
    );
  }
  const change = onChange;

  function start(id: string) {
    const state = drag.current;
    if (!state || state.id !== id) return;
    state.active = true;
    moved.current = false;
    setDragging(id);
  }

  function stop() {
    const state = drag.current;
    if (state?.timer != null) window.clearTimeout(state.timer);
    drag.current = null;
    setDragging(null);
  }

  // Dropping on a game takes its place; a game dropped into the other group joins that group.
  function moveOver(x: number, y: number) {
    const state = drag.current;
    if (!state) return;
    const target = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-game]")?.dataset.game;
    if (!target || target === state.id) return;
    const list = latest.current;
    const from = list.findIndex((game) => game.id === state.id);
    const to = list.findIndex((game) => game.id === target);
    if (from === -1 || to === -1) return;
    const next = [...list];
    const [game] = next.splice(from, 1);
    next.splice(to, 0, { ...game, priority: list[to].priority });
    moved.current = true;
    change(next);
  }

  function toggle(game: LibraryGame) {
    const others = latest.current.filter((item) => item.id !== game.id);
    const top = others.filter((item) => item.priority);
    const bottom = others.filter((item) => !item.priority);
    change(game.priority ? [...top, { ...game, priority: false }, ...bottom] : [...top, { ...game, priority: true }, ...bottom]);
  }

  function controls(game: LibraryGame): CardControls {
    return {
      dragging: dragging === game.id,
      onPriority: () => toggle(game),
      itemProps: {
        "data-game": game.id,
        onPointerDown: (event) => {
          if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
          const touch = event.pointerType !== "mouse";
          drag.current = { id: game.id, x: event.clientX, y: event.clientY, touch, active: false, timer: null };
          pointer.current.y = event.clientY;
          if (touch) drag.current.timer = window.setTimeout(() => start(game.id), HOLD_MS);
        },
        onPointerMove: (event) => {
          const state = drag.current;
          if (!state) return;
          pointer.current.y = event.clientY;
          const distance = Math.hypot(event.clientX - state.x, event.clientY - state.y);
          if (!state.active) {
            if (state.touch || distance <= 6) {
              if (state.touch && distance > 8) stop();
              return;
            }
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // The pointer is already gone; the drag still follows the moves that arrive.
            }
            start(game.id);
          }
          event.preventDefault();
          moveOver(event.clientX, event.clientY);
        },
        onPointerUp: () => {
          const active = drag.current?.active;
          stop();
          // The click that follows a drag arrives right after pointerup, if at all; only that one is swallowed.
          if (active) window.setTimeout(() => (moved.current = false), 0);
          else moved.current = false;
        },
        onPointerCancel: stop,
        onDragStart: (event) => event.preventDefault(),
        onContextMenu: (event) => event.preventDefault(),
        onClickCapture: (event) => {
          if (!moved.current) return;
          moved.current = false;
          event.preventDefault();
          event.stopPropagation();
        },
      },
    };
  }

  return (
    <>
      {priority.length > 0 ? <SectionTitle label={t("profile.priority")} count={priority.length} first /> : null}
      {priority.map((game) => card(game, controls(game)))}
      {priority.length > 0 ? <SectionTitle label={t("profile.rest")} count={rest.length} /> : null}
      {rest.map((game) => card(game, controls(game)))}
    </>
  );
}

// The star in a cover's corner, with a hint about what priority means on hover or focus.
export function PriorityStar({ on, onClick }: { on: boolean; onClick: () => void }) {
  const label = t(on ? "profile.removePriority" : "profile.makePriority");
  return (
    <span className="group/star absolute top-2 right-2 z-10">
      <button
        type="button"
        aria-pressed={on}
        aria-label={label}
        onClick={onClick}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition ${
          on
            ? "bg-accent text-accent-ink"
            : "bg-black/60 text-white opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        }`}
      >
        {on ? "★" : "☆"}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 mt-2 hidden w-56 rounded-xl bg-strong p-3 text-xs leading-4 text-strong-ink shadow-lg group-hover/star:block group-focus-within/star:block"
      >
        <span className="block font-semibold">{label}</span>
        {t("profile.priorityHint")}
      </span>
    </span>
  );
}

function SectionTitle({ label, count, first = false }: { label: string; count: number; first?: boolean }) {
  return (
    <li className={`col-span-full flex items-baseline gap-2 ${first ? "" : "mt-4"}`}>
      <span className="font-display text-xl">{label}</span>
      <span className="text-sm text-muted">{count}</span>
    </li>
  );
}

// Arrange mode: rows dragged by their handle (mouse or touch) or moved with the arrows; the star moves a game
// between the two groups. Every change goes straight to onChange with the whole backlog in its new order.
export function BacklogArrange({ games, onChange }: { games: LibraryGame[]; onChange: (games: LibraryGame[]) => void }) {
  const priority = games.filter((game) => game.priority);
  const rest = games.filter((game) => !game.priority);

  function update(nextPriority: LibraryGame[], nextRest: LibraryGame[]) {
    onChange([...nextPriority.map((game) => ({ ...game, priority: true })), ...nextRest.map((game) => ({ ...game, priority: false }))]);
  }

  function toggle(game: LibraryGame) {
    if (game.priority) update(priority.filter((item) => item.id !== game.id), [game, ...rest]);
    else update([...priority, game], rest.filter((item) => item.id !== game.id));
  }

  return (
    <div className="mt-6 grid gap-6">
      <p className="text-sm text-muted">{t("profile.arrangeHint")}</p>
      <ArrangeGroup
        label={t("profile.priority")}
        games={priority}
        empty={t("profile.priorityEmpty")}
        onMove={(next) => update(next, rest)}
        onToggle={toggle}
      />
      <ArrangeGroup label={t("profile.rest")} games={rest} empty={t("library.empty")} onMove={(next) => update(priority, next)} onToggle={toggle} />
    </div>
  );
}

function ArrangeGroup({
  label,
  games,
  empty,
  onMove,
  onToggle,
}: {
  label: string;
  games: LibraryGame[];
  empty: string;
  onMove: (games: LibraryGame[]) => void;
  onToggle: (game: LibraryGame) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const dragging = useRef<string | null>(null);

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= games.length) return;
    const next = [...games];
    const [game] = next.splice(from, 1);
    next.splice(to, 0, game);
    onMove(next);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, id: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = id;
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const id = dragging.current;
    const list = listRef.current;
    if (!id || !list) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-row]"));
    const from = games.findIndex((game) => game.id === id);
    let to = rows.findIndex((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY < box.top + box.height / 2;
    });
    if (to === -1) to = rows.length - 1;
    else if (to > from) to -= 1;
    move(from, to);
  }

  function onPointerUp() {
    dragging.current = null;
  }

  return (
    <section>
      <h3 className="flex items-baseline gap-2">
        <span className="font-display text-xl">{label}</span>
        <span className="text-sm text-muted">{games.length}</span>
      </h3>
      {games.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{empty}</p>
      ) : (
        <ol ref={listRef} className="mt-3 grid gap-2">
          {games.map((game, index) => (
            <li
              key={game.id}
              data-row
              className="flex min-w-0 items-center gap-2 rounded-2xl border border-line bg-panel p-2 pr-3"
            >
              <button
                type="button"
                aria-label={t("profile.dragHandle")}
                onPointerDown={(event) => onPointerDown(event, game.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-lg text-muted active:cursor-grabbing"
              >
                ⠿
              </button>
              <span className="w-6 shrink-0 text-right text-sm text-muted tabular-nums">{index + 1}</span>
              {game.coverUrl ? (
                <img src={game.coverUrl} alt="" className="h-12 w-9 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="h-12 w-9 shrink-0 rounded-md bg-line" />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{game.title}</span>
              <button
                type="button"
                aria-label={t("profile.moveUp")}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line disabled:opacity-30 sm:flex"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={t("profile.moveDown")}
                disabled={index === games.length - 1}
                onClick={() => move(index, index + 1)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line disabled:opacity-30 sm:flex"
              >
                ↓
              </button>
              <button
                type="button"
                aria-pressed={game.priority}
                aria-label={t(game.priority ? "profile.removePriority" : "profile.makePriority")}
                title={t(game.priority ? "profile.removePriority" : "profile.makePriority")}
                onClick={() => onToggle(game)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                  game.priority ? "bg-accent text-accent-ink" : "border border-line text-muted hover:text-ink"
                }`}
              >
                {game.priority ? "★" : "☆"}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
