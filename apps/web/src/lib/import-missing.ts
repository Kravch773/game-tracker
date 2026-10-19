const KEY = "gt-import-missing";

export type ImportMissingReport = {
  imported: number;
  missing: string[];
  back: string;
};

export function saveImportMissing(report: ImportMissingReport): void {
  sessionStorage.setItem(KEY, JSON.stringify(report));
}

export function readImportMissing(): ImportMissingReport | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ImportMissingReport>;
    if (!Array.isArray(value.missing) || typeof value.imported !== "number") return null;
    const missing = value.missing.filter((title): title is string => typeof title === "string" && title.trim().length > 0);
    const back = typeof value.back === "string" && value.back.startsWith("/") ? value.back : "/";
    return { imported: value.imported, missing, back };
  } catch {
    return null;
  }
}
