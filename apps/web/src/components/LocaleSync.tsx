"use client";

import { setLocale, type Locale } from "@gametracker/shared";
import type { ReactNode } from "react";

export function LocaleSync({ locale, children }: { locale: Locale; children: ReactNode }) {
  setLocale(locale);
  return children;
}
