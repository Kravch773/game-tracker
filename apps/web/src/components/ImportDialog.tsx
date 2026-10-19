"use client";

import { t, type MyGamesListImportResult, type MyGamesListImportRow } from "@gametracker/shared";
import { useRef, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { apiUrl } from "@/lib/config";
import { saveImportMissing } from "@/lib/import-missing";
import { parseMyGamesList } from "@/lib/mygameslist";
import { primaryClass } from "@/lib/ui";

const BATCH = 8;

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<"mygameslist" | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<MyGamesListImportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function reset() {
    setSource(null);
    setFileName(null);
    setRows(null);
    setError(null);
    setProgress(null);
    setPending(false);
  }

  function close() {
    if (pending) return;
    reset();
    onClose();
  }

  async function onFile(file: File | undefined) {
    setError(null);
    setRows(null);
    setFileName(file?.name ?? null);
    if (!file) return;
    const text = await file.text();
    const parsed = parseMyGamesList(text);
    if (!parsed) {
      setError(t("profile.importBadFile"));
      return;
    }
    if (parsed.length === 0) {
      setError(t("profile.importEmpty"));
      return;
    }
    setRows(parsed);
  }

  async function start() {
    if (!rows || pending) return;
    setPending(true);
    setError(null);
    const totals = { imported: 0, missing: 0 };
    const missing: string[] = [];
    try {
      for (let index = 0; index < rows.length; index += BATCH) {
        setProgress(t("profile.importProgress", { done: index, total: rows.length }));
        const response = await fetch(`${apiUrl}/library/import`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: rows.slice(index, index + BATCH) }),
        });
        const payload = (await response.json()) as MyGamesListImportResult & { error?: string };
        if (!response.ok) {
          setError(payload.error ?? t("profile.importFailed"));
          setPending(false);
          return;
        }
        totals.imported += payload.imported;
        totals.missing += payload.missing.length;
        missing.push(...payload.missing);
      }
      const uniqueMissing = [...new Set(missing)];
      if (uniqueMissing.length > 0) {
        saveImportMissing({ imported: totals.imported, missing: uniqueMissing, back: window.location.pathname });
        window.location.assign("/import/missing");
        return;
      }
      setProgress(t("profile.importDone", totals));
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      setError(t("profile.importFailed"));
      setPending(false);
    }
  }

  return (
    <Dialog open={open} title={t("profile.importTitle")} onClose={close}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => setSource("mygameslist")}
          className={`h-12 rounded-2xl border px-4 text-left text-sm font-semibold ${
            source === "mygameslist" ? "border-accent bg-accent text-accent-ink!" : "border-line bg-white/5 hover:border-accent"
          }`}
        >
          {t("profile.importMyGamesList")}
        </button>
        {source === "mygameslist" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">{t("profile.importHint")}</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
            <button type="button" disabled={pending} onClick={() => fileRef.current?.click()} className={primaryClass}>
              {fileName ?? t("profile.importChoose")}
            </button>
            {rows ? <p className="text-sm text-muted">{t("profile.importCount", { count: rows.length })}</p> : null}
            {rows ? (
              <button type="button" disabled={pending} onClick={() => void start()} className={primaryClass}>
                {t("profile.importStart")}
              </button>
            ) : null}
          </div>
        ) : null}
        {progress ? <p className="text-sm text-muted">{progress}</p> : null}
        {error ? <p className="text-sm text-accent">{error}</p> : null}
      </div>
    </Dialog>
  );
}
