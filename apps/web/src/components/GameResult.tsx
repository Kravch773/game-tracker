import { t, type GameSummary } from "@gametracker/shared";

export function GameResult({
  game,
  detail,
  wrapDetail = false,
  compact = false,
  newTab = false,
}: {
  game: GameSummary;
  detail?: string;
  wrapDetail?: boolean;
  compact?: boolean;
  newTab?: boolean;
}) {
  const year = game.releaseDate?.slice(0, 4);
  const caption = detail?.trim() || year || t("common.unknownDate");

  return (
    <a
      href={`/games/${game.slug}`}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noreferrer" : undefined}
      className="group block"
    >
      <span className={`block overflow-hidden border border-line bg-raised shadow-lg ${compact ? "rounded-xl" : "rounded-2xl"}`}>
        <Cover url={game.coverUrl} />
      </span>
      <span className={`block min-w-0 ${compact ? "mt-2" : "mt-3"}`}>
        <span className={`block truncate font-medium group-hover:text-accent-fg ${compact ? "text-sm" : ""}`}>{game.title}</span>
        <span
          className={`mt-1 block text-muted ${compact ? "text-xs" : "text-sm"} ${wrapDetail ? "" : "truncate"}`}
          title={detail?.trim() || undefined}
        >
          {caption}
        </span>
      </span>
    </a>
  );
}

function Cover({ url }: { url: string | null }) {
  if (!url) {
    return <span className="block aspect-[3/4] bg-line" aria-hidden="true" />;
  }

  return (
    <img
      src={url}
      alt=""
      className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105"
    />
  );
}
