import { t, type GameSummary } from "@gametracker/shared";

export function GameResult({
  game,
  detail,
  wrapDetail = false,
}: {
  game: GameSummary;
  detail?: string;
  wrapDetail?: boolean;
}) {
  const year = game.releaseDate?.slice(0, 4);
  const caption = detail?.trim() || year || t("common.unknownDate");

  return (
    <a href={`/games/${game.slug}`} className="group block">
      <span className="block overflow-hidden rounded-2xl border border-line bg-raised shadow-lg">
        <Cover url={game.coverUrl} />
      </span>
      <span className="mt-3 block min-w-0">
        <span className="block truncate font-medium group-hover:text-accent">{game.title}</span>
        <span
          className={`mt-1 block text-sm text-muted ${wrapDetail ? "" : "truncate"}`}
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
