import { cookies } from "next/headers";
import { DEFAULT_DESIGN, DEFAULT_THEME, DESIGN_COOKIE, THEME_COOKIE, isDesign, isTheme, type Design, type Theme } from "./look-cookie";

export async function getLook(): Promise<{ design: Design; theme: Theme }> {
  const jar = await cookies();
  const design = jar.get(DESIGN_COOKIE)?.value;
  const theme = jar.get(THEME_COOKIE)?.value;
  return {
    design: isDesign(design) ? design : DEFAULT_DESIGN,
    theme: isTheme(theme) ? theme : DEFAULT_THEME,
  };
}
