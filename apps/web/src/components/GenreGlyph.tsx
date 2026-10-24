import type { CatalogGenreId } from "@gametracker/shared";

// Line icons drawn in currentColor, so they take the tile's text colour in either theme.
const PATHS: Record<CatalogGenreId, string[]> = {
  // shield with a sword
  rpg: ["M12 3l7 3v5.5c0 4.3-2.9 7.7-7 9.5-4.1-1.8-7-5.2-7-9.5V6z", "M12 7.5v8", "M9.5 10.5h5", "M12 15.5v1.5"],
  // crosshair
  shooter: ["M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M12 2.5v4", "M12 17.5v4", "M2.5 12h4", "M17.5 12h4", "M12 11.2v1.6"],
  // folded map with a route
  adventure: ["M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z", "M9 4.5v13", "M15 6.5v13"],
  // chess rook
  strategy: ["M7 3.5v4h10v-4h-2.5v2h-2v-2h-1v2h-2v-2z", "M8 7.5l.8 10h6.4l.8-10", "M6 20.5h12", "M7.2 17.5h9.6"],
  // heart with a spark
  indie: ["M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z", "M18.5 3v3", "M17 4.5h3"],
  // speedometer
  racing: ["M4 16.5a8 8 0 1 1 16 0", "M12 16.5l4.2-5", "M7 16.5h.01", "M17 16.5h.01", "M12 8.5V9"],
};

export function GenreGlyph({ genre, className = "h-5 w-5" }: { genre: CatalogGenreId; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[genre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
