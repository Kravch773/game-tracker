import { BRAND_PATHS, type BrandName } from "@gametracker/shared";

export type IconName =
  | "calendar"
  | "pulse"
  | "gear"
  | "door"
  | "user"
  | "search"
  | "star"
  | "heart"
  | "check"
  | "close"
  | "bookmark"
  | "book"
  | "camera"
  | "film"
  | "chat"
  | "layers"
  | "clock"
  | "building"
  | "users"
  | "tag"
  | "shield"
  | "flame"
  | "spark"
  | "dice"
  | "compass"
  | "target"
  | "flag"
  | "wheel"
  | "gamepad"
  | "chart"
  | "arrow"
  | "link"
  | "monitor"
  | "disc"
  | "box"
  | "pc"
  | "ps5"
  | "ps4"
  | "xbox-series"
  | "xbox-one"
  | "switch"
  | "fighting"
  | "platform"
  | "puzzle"
  | "sport"
  | "simulator"
  | "hack-and-slash"
  | "tactical"
  | "rts"
  | "tbs"
  | "music"
  | "arcade"
  | "visual-novel"
  | "moba"
  | "card"
  | "point-and-click"
  | "quiz"
  | "pinball"
  | "steam"
  | "gog"
  | "epic"
  | "wiki"
  | "meta";

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const sized = /\bh-/.test(className) ? className : `h-4 w-4 ${className}`;
  // Store and platform marks are vector logos in the text colour, so they stay sharp and fill their badges.
  if (name in BRAND_PATHS) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`pointer-events-none shrink-0 ${sized}`}>
        <path fill="currentColor" d={BRAND_PATHS[name as BrandName]} />
      </svg>
    );
  }
  return (
    <img
      src={`/icons/${name}.png`}
      alt=""
      draggable={false}
      className={`pointer-events-none shrink-0 object-contain ${sized}`}
    />
  );
}

export function IconBadge({
  name,
  tone = "bg-accent/10 text-accent-fg",
  size = "md",
}: {
  name: IconName;
  tone?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "h-12 w-12 rounded-2xl" : size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl";
  const glyph = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ring-1 ring-ink/10 ${box} ${tone}`}>
      <Icon name={name} className={glyph} />
    </span>
  );
}
