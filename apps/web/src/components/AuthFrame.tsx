import { t } from "@gametracker/shared";
import type { ReactNode } from "react";
import { getLook } from "@/lib/look";

const POINTS = ["auth.pointLists", "auth.pointScores", "auth.pointSteam", "auth.pointFeed"] as const;
const SHELF_TILES = ["bg-tile-mint", "bg-tile-sun", "bg-tile-lilac", "bg-tile-coral"];

// Sign-in and sign-up share one frame: what the account gives on the left, the form on the right.
export async function AuthFrame({
  mode,
  loginHref,
  registerHref,
  children,
}: {
  mode: "login" | "register";
  loginHref: string;
  registerHref: string;
  children: ReactNode;
}) {
  const { design } = await getLook();
  const tab = (active: boolean) =>
    `inline-flex h-11 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-strong text-strong-ink" : "text-muted hover:text-ink"}`;

  return (
    <main className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-2">
      {design === "shelf" ? (
        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-2 rounded-[32px] bg-strong p-8 text-strong-ink">
            <h2 className="font-display text-4xl leading-tight font-extrabold">{t("dash.welcomeTitle")}</h2>
            <p className="mt-2 text-strong-ink/75">{t("dash.welcomeLead")}</p>
          </div>
          {POINTS.map((point, index) => (
            <p key={point} className={`flex min-h-32 items-end rounded-[28px] p-5 font-bold text-[#1b1530] ${SHELF_TILES[index]}`}>
              {t(point)}
            </p>
          ))}
        </section>
      ) : (
        <section className="flex flex-col justify-end rounded-3xl border border-line bg-panel p-8 lg:min-h-[32rem]">
          <p className="text-sm font-medium tracking-[0.16em] text-accent-fg uppercase">{t("auth.eyebrow")}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight">{t("dash.welcomeTitle")}</h2>
          <ul className="mt-6 flex flex-col gap-3 text-muted">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-accent-fg" />
                {t(point)}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className={`p-6 sm:p-8 ${design === "shelf" ? "rounded-[32px] bg-panel" : "rounded-3xl border border-line bg-panel"}`}>
        <nav aria-label={t("auth.eyebrow")} className="grid grid-cols-2 rounded-full bg-raised p-1">
          <a href={loginHref} aria-current={mode === "login" ? "page" : undefined} className={tab(mode === "login")}>
            {t("auth.loginTitle")}
          </a>
          <a href={registerHref} aria-current={mode === "register" ? "page" : undefined} className={tab(mode === "register")}>
            {t("auth.registerTitle")}
          </a>
        </nav>
        <h1 className="mt-6 font-display text-3xl tracking-tight">{mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}</h1>
        {children}
      </section>
    </main>
  );
}
