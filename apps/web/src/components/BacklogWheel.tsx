"use client";

import { t, type LibraryGame } from "@gametracker/shared";
import { useEffect, useRef, useState, type TransitionEvent } from "react";
import { Dialog } from "@/components/Dialog";
import { primaryClass, quietClass } from "@/lib/ui";

const COLORS = ["#d6ff4a", "#7cffb2", "#5ce1e6", "#7aa2ff", "#c084fc", "#ff7ad9", "#ff8b6a", "#ffd166"];

type Mode = "elimination" | "instant";

export function BacklogWheel({
  open,
  games,
  onClose,
}: {
  open: boolean;
  games: LibraryGame[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("elimination");
  const [pool, setPool] = useState(games);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [eliminated, setEliminated] = useState<LibraryGame | null>(null);
  const [winner, setWinner] = useState<LibraryGame | null>(null);
  const pending = useRef<{ index: number; mode: Mode; pool: LibraryGame[] } | null>(null);
  const timer = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  function clearTimer() {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  }

  function reset(nextMode = mode, source = games) {
    clearTimer();
    pending.current = null;
    setMode(nextMode);
    setPool(source);
    setSpinning(false);
    setEliminated(null);
    setWinner(null);
  }

  function spin() {
    if (spinning || winner || pool.length === 0) return;
    if (pool.length === 1) {
      setWinner(pool[0]);
      return;
    }
    const index = Math.floor(Math.random() * pool.length);
    const turns = mode === "instant" ? 6 : 4;
    pending.current = { index, mode, pool };
    setEliminated(null);
    setRotation((current) => targetRotation(current, index, pool.length, turns));
    setSpinning(true);
    clearTimer();
    timer.current = window.setTimeout(() => finishSpin(), (turns === 6 ? 4600 : 3400) + 120);
  }

  function finishSpin() {
    const pick = pending.current;
    if (!pick) return;
    pending.current = null;
    clearTimer();
    setSpinning(false);
    const game = pick.pool[pick.index];
    if (!game) return;
    if (pick.mode === "instant") {
      setWinner(game);
      return;
    }
    const next = pick.pool.filter((_, item) => item !== pick.index);
    setEliminated(game);
    setPool(next);
    if (next.length <= 1) setWinner(next[0] ?? null);
  }

  function onTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "transform" || event.target !== wheelRef.current) return;
    finishSpin();
  }

  useEffect(() => {
    if (!open) return;
    clearTimer();
    pending.current = null;
    setPool(games);
    setSpinning(false);
    setEliminated(null);
    setWinner(null);
  }, [open, games]);

  const duration = mode === "instant" ? "4.6s" : "3.4s";

  return (
    <Dialog
      open={open}
      title={t("wheel.title")}
      wide
      onClose={() => {
        reset("elimination", games);
        onClose();
      }}
    >
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["elimination", "instant"] as const).map((item) => (
          <button
            key={item}
            type="button"
            disabled={spinning}
            aria-pressed={mode === item}
            onClick={() => reset(item, games)}
            className={`h-11 rounded-full border text-sm font-medium ${
              mode === item ? "border-accent bg-accent text-accent-ink" : "border-line bg-raised"
            }`}
          >
            {t(item === "elimination" ? "wheel.elimination" : "wheel.instant")}
          </button>
        ))}
      </div>
      <div className="relative mx-auto h-72 w-72 max-w-full sm:h-80 sm:w-80">
        <span
          aria-hidden="true"
          className="absolute top-0 left-1/2 z-10 -translate-x-1/2 border-x-8 border-t-[18px] border-x-transparent border-t-accent"
        />
        <div
          ref={wheelRef}
          onTransitionEnd={onTransitionEnd}
          className="h-full w-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? `transform ${duration} cubic-bezier(0.12, 0.65, 0.08, 1)` : "none",
          }}
        >
          <WheelDisc games={pool.length > 0 ? pool : games} />
        </div>
      </div>
      <div className="mt-4 min-h-16 text-center">
        {winner ? (
          <div>
            {eliminated ? <p className="text-sm text-muted">{t("wheel.out", { title: eliminated.title })}</p> : null}
            <p className="text-sm text-muted">{t("wheel.winner")}</p>
            <a href={`/games/${encodeURIComponent(winner.slug)}`} className="mt-1 block font-display text-2xl hover:text-accent-fg">
              {winner.title}
            </a>
          </div>
        ) : eliminated ? (
          <p>
            {t("wheel.out", { title: eliminated.title })}
            <span className="mt-1 block text-sm text-muted">{t("wheel.left", { count: pool.length })}</span>
          </p>
        ) : (
          <p className="text-sm text-muted">{t("wheel.left", { count: pool.length })}</p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {!winner ? (
          <button type="button" disabled={spinning || pool.length === 0} onClick={spin} className={primaryClass}>
            {spinning ? t("wheel.spinning") : t("wheel.spin")}
          </button>
        ) : (
          <a href={`/games/${encodeURIComponent(winner.slug)}`} className={primaryClass}>
            {t("wheel.openGame")}
          </a>
        )}
        <button type="button" disabled={spinning} onClick={() => reset(mode, games)} className={quietClass}>
          {t("wheel.again")}
        </button>
      </div>
    </Dialog>
  );
}

function WheelDisc({ games }: { games: LibraryGame[] }) {
  const count = Math.max(games.length, 1);
  if (count === 1) {
    return (
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-xl">
        <circle cx="100" cy="100" r="96" fill={COLORS[0]} />
        <text x="100" y="70" fill="#12141c" fontSize="8" fontWeight="700" textAnchor="middle">
          {games[0] ? shortTitle(games[0].title, 1) : ""}
        </text>
        <circle cx="100" cy="100" r="16" fill="#12141c" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-xl">
      {Array.from({ length: count }, (_, index) => {
        const game = games[index];
        const path = slicePath(index, count);
        const mid = -Math.PI / 2 + ((index + 0.5) * 2 * Math.PI) / count;
        const x = 100 + 62 * Math.cos(mid);
        const y = 100 + 62 * Math.sin(mid);
        let rot = (mid * 180) / Math.PI;
        if (rot > 90 || rot < -90) rot += 180;
        return (
          <g key={game?.id ?? index}>
            <path d={path} fill={COLORS[index % COLORS.length]} stroke="#12141c" strokeWidth="0.6" />
            {game ? (
              <text
                x={x}
                y={y}
                fill="#12141c"
                fontSize={count > 10 ? 5.5 : 7}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${rot} ${x} ${y})`}
              >
                {shortTitle(game.title, count)}
              </text>
            ) : null}
          </g>
        );
      })}
      <circle cx="100" cy="100" r="16" fill="#12141c" />
    </svg>
  );
}

function slicePath(index: number, count: number): string {
  const radius = 96;
  const start = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const end = -Math.PI / 2 + ((index + 1) * 2 * Math.PI) / count;
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = 100 + radius * Math.cos(start);
  const y1 = 100 + radius * Math.sin(start);
  const x2 = 100 + radius * Math.cos(end);
  const y2 = 100 + radius * Math.sin(end);
  return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
}

function shortTitle(title: string, count: number): string {
  const max = count > 12 ? 8 : count > 8 ? 12 : 16;
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

function targetRotation(current: number, index: number, count: number, turns: number): number {
  const slice = 360 / count;
  const offset = (index + 0.5) * slice;
  const finalMod = (360 - offset) % 360;
  const currentMod = ((current % 360) + 360) % 360;
  let delta = finalMod - currentMod;
  if (delta <= 0) delta += 360;
  return current + turns * 360 + delta;
}
