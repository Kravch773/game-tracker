"use client";

import { t, type GameTrailer, type GameTrailersResponse } from "@gametracker/shared";
import { useEffect, useId, useState } from "react";
import { apiUrl } from "@/lib/config";

type Status = "idle" | "loading" | "ready" | "error";

export function TrailersButton({ slug }: { slug: string }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [trailers, setTrailers] = useState<GameTrailer[]>([]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function openTrailers() {
    setOpen(true);
    if (status === "loading" || status === "ready") return;

    setStatus("loading");
    try {
      const response = await fetch(`${apiUrl}/games/${encodeURIComponent(slug)}/trailers`);
      if (!response.ok) throw new Error(`Trailers failed with ${response.status}`);
      const payload = (await response.json()) as GameTrailersResponse;
      setTrailers(Array.isArray(payload.trailers) ? payload.trailers : []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openTrailers()}
        className="mt-5 inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink hover:brightness-110"
      >
        {t("trailers.open")}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-10"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative max-h-[min(92vh,820px)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-line bg-panel p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id={titleId} className="font-display text-2xl">
                {t("trailers.title")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 items-center rounded-full border border-line px-3 text-sm text-muted hover:text-ink"
              >
                {t("common.close")}
              </button>
            </div>
            {status === "loading" ? <p className="text-muted">{t("trailers.loading")}</p> : null}
            {status === "error" ? (
              <div>
                <p>{t("trailers.failed")}</p>
                <button
                  type="button"
                  onClick={() => void openTrailers()}
                  className="mt-3 rounded-full border border-line px-3 py-1 text-sm hover:border-accent"
                >
                  {t("common.retry")}
                </button>
              </div>
            ) : null}
            {status === "ready" && trailers.length === 0 ? (
              <p className="text-muted">{t("trailers.empty")}</p>
            ) : null}
            {status === "ready" && trailers.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {trailers.map((trailer) => (
                  <li key={trailer.videoUrl}>
                    {trailer.name ? <p className="mb-2 text-sm">{trailer.name}</p> : null}
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      poster={trailer.previewUrl ?? undefined}
                      src={trailer.videoUrl}
                      className="aspect-video w-full rounded-xl bg-black"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
