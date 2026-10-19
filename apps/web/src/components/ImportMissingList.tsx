"use client";

import { t } from "@gametracker/shared";
import { useEffect, useState } from "react";
import { readImportMissing, type ImportMissingReport } from "@/lib/import-missing";
import { primaryClass } from "@/lib/ui";

export function ImportMissingList() {
  const [report, setReport] = useState<ImportMissingReport | null>(null);

  useEffect(() => {
    setReport(readImportMissing());
  }, []);

  const missing = report?.missing ?? [];

  return (
    <main className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl tracking-tight">{t("profile.importMissingTitle")}</h1>
      <p className="mt-2 text-muted">{missing.length > 0 ? t("profile.importMissingLead") : t("profile.importMissingEmpty")}</p>
      {report ? (
        <p className="mt-4 text-sm text-muted">
          {t("profile.importMissingCount", { count: missing.length, imported: report.imported })}
        </p>
      ) : null}
      {missing.length > 0 ? (
        <ul className="mt-6 flex flex-col divide-y divide-white/10 overflow-hidden rounded-3xl border border-line bg-panel/80">
          {missing.map((title) => (
            <li key={title} className="px-4 py-3 text-sm">
              {title}
            </li>
          ))}
        </ul>
      ) : null}
      <a href={report?.back ?? "/"} className={`${primaryClass} mt-6 text-accent-ink!`}>
        {t("profile.importMissingBack")}
      </a>
    </main>
  );
}
