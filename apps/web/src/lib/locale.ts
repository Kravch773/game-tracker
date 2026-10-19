import { isLocale, setLocale, type Locale } from "@gametracker/shared";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "./locale-cookie";

export async function applyLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(value) ? value : "uk";
  setLocale(locale);
  return locale;
}
