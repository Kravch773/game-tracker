import { LIBRARY_STATUSES, type LibraryGame, type LibraryStatus, type MyGamesListImportRow } from "@gametracker/shared";

const HEADER = ["title", "rating", "status", "review", "createdat", "updatedat"];

export function parseMyGamesList(text: string): MyGamesListImportRow[] | null {
  const lines = csvRecords(text);
  const header = splitCsvLine(lines[0] ?? "").map((cell) => cell.trim().toLowerCase());
  if (HEADER.some((name, index) => header[index] !== name)) return null;

  const byTitle = new Map<string, MyGamesListImportRow>();
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const title = (cells[0] ?? "").trim();
    if (!title) continue;
    const rating = mapRating(cells[1] ?? "");
    const status = mapStatus(cells[2] ?? "", rating);
    if (!status) continue;
    const row: MyGamesListImportRow = {
      title: title.slice(0, 180),
      rating: status === "finished" || status === "dropped" ? rating : null,
      status,
      review: clip(cells[3] ?? ""),
      createdAt: stamp(cells[4] ?? ""),
      updatedAt: stamp(cells[5] ?? ""),
    };
    const key = title.toLowerCase();
    const previous = byTitle.get(key);
    if (!previous || (row.updatedAt ?? "") >= (previous.updatedAt ?? "")) byTitle.set(key, row);
  }

  return [...byTitle.values()].filter((row) => (LIBRARY_STATUSES as readonly string[]).includes(row.status));
}

export function myGamesListCsv(games: { game: LibraryGame; status: LibraryStatus }[]): string {
  const lines = [
    "title,rating,status,review,createdAt,updatedAt",
    ...games.map(({ game, status }) =>
      [
        csvCell(game.title),
        game.rating == null ? "" : String(game.rating),
        status === "backlog" ? "want" : status,
        csvCell(game.review ?? ""),
        csvCell(game.addedAt),
        csvCell(game.addedAt),
      ].join(","),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function mapStatus(value: string, rating: number | null): LibraryStatus | null {
  const status = value.trim().toLowerCase();
  if (status === "finished" || status === "playing" || status === "dropped") return status;
  if (status === "want") return "backlog";
  if (status === "") return rating != null ? "finished" : "backlog";
  return null;
}

function mapRating(value: string): number | null {
  const raw = value.trim();
  if (!raw || raw.toLowerCase() === "nan") return null;
  const rating = Number(raw);
  if (!Number.isFinite(rating) || rating < 0) return null;
  return Math.min(10, Math.max(0, Math.round(rating * 10) / 10));
}

function stamp(value: string): string | null {
  const cleaned = value.trim().replace(/\s*\([^)]*\)\s*$/, "");
  if (!cleaned) return null;
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function clip(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return [...trimmed].slice(0, 2000).join("");
}

function csvRecords(text: string): string[] {
  const records: string[] = [];
  let current = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      current += char;
      if (char === '"') {
        if (source[index + 1] === '"') {
          current += '"';
          index += 1;
        } else quoted = false;
      }
    } else if (char === '"') {
      quoted = true;
      current += char;
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      if (current.trim()) records.push(current);
      current = "";
    } else current += char;
  }
  if (current.trim()) records.push(current);
  return records;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells;
}
