"use client";

import { t, type LibraryGame } from "@gametracker/shared";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";

export type CardControls = {
  dragging: boolean;
  onPriority?: () => void;
  itemProps?: HTMLAttributes<HTMLLIElement> & { "data-game": string; ref: (node: HTMLLIElement | null) => void };
};

type Drag = {
  id: string;
  touch: boolean;
  active: boolean;
  timer: number | null;
  startX: number;
  startY: number;
  grabX: number;
  grabY: number;
  x: number;
  y: number;
};

const HOLD_MS = 280;
const EDGE = 90;
const SLIDE = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)";

// Where a card sits in the layout, in viewport pixels; unlike getBoundingClientRect it ignores transforms,
// so cards that are still sliding are hit and measured at the place they are heading to.
function layoutOf(node: HTMLElement) {
  const parent = node.offsetParent as HTMLElement | null;
  const box = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return { x: box.left + node.offsetLeft, y: box.top + node.offsetTop, width: node.offsetWidth, height: node.offsetHeight };
}

// The backlog shown in its owner's order: priority games on top, then the rest. With onChange the owner can
// drag covers around the grid (mouse straight away, touch after a short hold) and star games into priority.
// The dragged cover follows the pointer and the others slide into their new places.
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
  const drag = useRef<Drag | null>(null);
  const moved = useRef(false);
  const nodes = useRef(new Map<string, HTMLLIElement>());
  const places = useRef(new Map<string, { x: number; y: number }>());
  const latest = useRef(games);
  latest.current = games;
  const priority = games.filter((game) => game.priority);
  const rest = games.filter((game) => !game.priority);

  // After every reorder each card starts from where it was and slides to its new place.
  useLayoutEffect(() => {
    if (!onChange) return;
    const next = new Map<string, { x: number; y: number }>();
    nodes.current.forEach((node, id) => {
      const box = layoutOf(node);
      const place = { x: box.x + window.scrollX, y: box.y + window.scrollY };
      next.set(id, place);
      const before = places.current.get(id);
      if (!before || drag.current?.id === id) return;
      const dx = before.x - place.x;
      const dy = before.y - place.y;
      if (dx === 0 && dy === 0) return;
      node.style.transition = "none";
      node.style.transform = `translate(${dx}px, ${dy}px)`;
      void node.offsetWidth;
      node.style.transition = SLIDE;
      node.style.transform = "";
    });
    places.current = next;
    follow();
  });

  // While a drag is on, touch scrolling is held back and the page scrolls by itself near the screen edges.
  useEffect(() => {
    if (!dragging) return;
    const hold = (event: TouchEvent) => event.preventDefault();
    let frame = 0;
    const tick = () => {
      const state = drag.current;
      if (state) {
        const before = window.scrollY;
        if (state.y < EDGE) window.scrollBy(0, -Math.ceil((EDGE - state.y) / 6));
        else if (state.y > window.innerHeight - EDGE) window.scrollBy(0, Math.ceil((state.y - window.innerHeight + EDGE) / 6));
        if (window.scrollY !== before) {
          follow();
          moveOver(state.x, state.y);
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    document.addEventListener("touchmove", hold, { passive: false });
    frame = window.requestAnimationFrame(tick);
    return () => {
      document.removeEventListener("touchmove", hold);
      window.cancelAnimationFrame(frame);
    };
  });

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

  // Keeps the dragged cover under the pointer, wherever the layout has put its slot.
  function follow() {
    const state = drag.current;
    const node = state?.active ? nodes.current.get(state.id) : undefined;
    if (!state || !node) return;
    const box = layoutOf(node);
    node.style.transition = "none";
    node.style.transform = `translate(${state.x - state.grabX - box.x}px, ${state.y - state.grabY - box.y}px)`;
  }

  function start(id: string) {
    const state = drag.current;
    const node = nodes.current.get(id);
    if (!state || state.id !== id || !node) return;
    const box = layoutOf(node);
    state.active = true;
    state.grabX = state.startX - box.x;
    state.grabY = state.startY - box.y;
    moved.current = false;
    if (state.touch) navigator.vibrate?.(12);
    setDragging(id);
    follow();
  }

  function stop() {
    const state = drag.current;
    if (state?.timer != null) window.clearTimeout(state.timer);
    const node = state?.active ? nodes.current.get(state.id) : undefined;
    if (node) {
      node.style.transition = SLIDE;
      node.style.transform = "";
    }
    drag.current = null;
    setDragging(null);
  }

  // Dropping on a game takes its place; a game dropped into the other group joins that group.
  function moveOver(x: number, y: number) {
    const state = drag.current;
    if (!state?.active) return;
    let target: string | null = null;
    nodes.current.forEach((node, id) => {
      if (target || id === state.id) return;
      const box = layoutOf(node);
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) target = id;
    });
    if (!target) return;
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
        ref: (node) => {
          if (node) nodes.current.set(game.id, node);
          else nodes.current.delete(game.id);
        },
        onPointerDown: (event) => {
          if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
          const touch = event.pointerType !== "mouse";
          const { clientX: x, clientY: y } = event;
          drag.current = { id: game.id, touch, active: false, timer: null, startX: x, startY: y, grabX: 0, grabY: 0, x, y };
          if (touch) drag.current.timer = window.setTimeout(() => start(game.id), HOLD_MS);
        },
        onPointerMove: (event: PointerEvent<HTMLLIElement>) => {
          const state = drag.current;
          if (!state) return;
          state.x = event.clientX;
          state.y = event.clientY;
          const distance = Math.hypot(state.x - state.startX, state.y - state.startY);
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
          follow();
          moveOver(state.x, state.y);
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

const HINT_KEY = "gt-backlog-drag-hint";

// A one-time card above the backlog grid: a tiny looping demo of two covers swapping places, what can be
// done here, and a button that hides it for good on this device.
export function DragHint() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(HINT_KEY) !== "seen");
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-accent/40 bg-accent/10 p-3 pr-4">
      <span aria-hidden="true" className="flex h-12 w-14 shrink-0 items-center justify-center gap-1.5">
        <span className="h-9 w-5 rounded-md bg-muted/50 motion-safe:animate-[gt-drag-shift_2.6s_ease-in-out_infinite]" />
        <span className="relative z-10 h-9 w-5 rounded-md bg-accent shadow-lg motion-safe:animate-[gt-drag-lift_2.6s_ease-in-out_infinite]" />
      </span>
      <span className="min-w-0 flex-1 basis-56 text-sm">
        <span className="block font-semibold">{t("profile.dragTitle")}</span>
        <span className="block text-muted">{t("profile.dragHint")}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          try {
            window.localStorage.setItem(HINT_KEY, "seen");
          } catch {
            // Without storage the hint simply comes back next time.
          }
        }}
        className="h-10 shrink-0 rounded-full border border-line bg-panel px-4 text-sm font-semibold hover:bg-raised"
      >
        {t("profile.dragGotIt")}
      </button>
    </div>
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
