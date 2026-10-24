"use client";

import { t, type GameVideo } from "@gametracker/shared";
import { useState } from "react";

export function VideoList({ videos }: { videos: GameVideo[] }) {
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {videos.map((video) => {
        const youtubeId = youtubeIdOf(video.url);
        const title = video.name || t("game.watchOnYoutube");
        const open = openUrl === video.url;

        if (!youtubeId) {
          return (
            <li key={video.url}>
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-14 items-center rounded-2xl border border-line bg-panel px-4 text-sm hover:border-accent"
              >
                {title}
              </a>
            </li>
          );
        }

        return (
          <li key={video.url} className="overflow-hidden rounded-2xl border border-line bg-panel">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenUrl(open ? null : video.url)}
              className="flex h-14 w-full items-center justify-between gap-4 px-4 text-left text-sm hover:text-accent-fg"
            >
              <span>{title}</span>
              <span className="shrink-0 text-xs text-muted">{open ? t("game.collapse") : t("game.watch")}</span>
            </button>
            {open ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full border-0"
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function youtubeIdOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = parsed.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = parsed.pathname.startsWith("/embed/")
        ? parsed.pathname.split("/")[2] ?? ""
        : parsed.searchParams.get("v") ?? "";
    }
    return /^[\w-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
