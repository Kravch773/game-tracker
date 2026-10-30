"use client";

import { t, type LibraryGame } from "@gametracker/shared";
import { useRef, type PointerEvent, type ReactNode } from "react";

// The backlog shown in its owner's order: priority games on top, then the rest.
export function BacklogSections({ games, card }: { games: LibraryGame[]; card: (game: LibraryGame) => ReactNode }) {
  const priority = games.filter((game) => game.priority);
  const rest = games.filter((game) => !game.priority);
  if (priority.length === 0) return <>{rest.map(card)}</>;
  return (
    <>
      <SectionTitle label={t("profile.priority")} count={priority.length} first />
      {priority.map(card)}
      <SectionTitle label={t("profile.rest")} count={rest.length} />
      {rest.map(card)}
    </>
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
