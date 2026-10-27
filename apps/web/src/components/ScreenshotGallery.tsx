"use client";

import { t, type GameScreenshot } from "@gametracker/shared";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { screenshotAt } from "@/lib/images";

// Screenshot tiles that open a full-size viewer; arrows, swipe-free buttons and the keyboard move between shots.
export function ScreenshotGallery({ shots, lead }: { shots: GameScreenshot[]; lead?: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const count = shots.length;
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback((delta: number) => setIndex((current) => (current == null ? current : (current + delta + count) % count)), [count]);

  useEffect(() => {
    if (index == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [index, close, step]);

  const arrow = "absolute top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20";

  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {lead}
        {shots.map((shot, position) => {
          const big = !lead && position === 0;
          return (
            <li key={shot.url} className={`overflow-hidden rounded-2xl border border-line ${big ? "col-span-2 row-span-2" : ""}`}>
              <button
                type="button"
                onClick={() => setIndex(position)}
                aria-label={t("game.openScreenshot", { number: position + 1 })}
                className="block h-full w-full cursor-zoom-in"
              >
                <img
                  src={big ? screenshotAt(shot.url, "t_screenshot_huge") : shot.url}
                  alt=""
                  loading="lazy"
                  className="aspect-video h-full w-full object-cover transition duration-300 hover:scale-105"
                />
              </button>
            </li>
          );
        })}
      </ul>
      {index != null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("game.screenshots")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-10"
          onClick={close}
        >
          <img
            src={screenshotAt(shots[index].url, "t_1080p")}
            alt=""
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          <button type="button" onClick={close} aria-label={t("common.close")} className="absolute top-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20">
            ✕
          </button>
          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label={t("collections.previous")}
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                className={`${arrow} left-3 sm:left-6`}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label={t("collections.next")}
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                className={`${arrow} right-3 sm:right-6`}
              >
                ›
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {index + 1} / {count}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
