import { t } from "@gametracker/shared";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { applyLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/site";
import { primaryClass, quietClass } from "@/lib/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  await applyLocale();
  return pageMetadata({
    title: t("nav.guide"),
    description: t("meta.guide"),
    path: "/guide",
  });
}

export default async function GuidePage() {
  await applyLocale();

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-line bg-panel/80 px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        <p className="relative text-xs font-semibold tracking-[0.18em] text-accent uppercase">{t("guide.eyebrow")}</p>
        <h1 className="relative mt-3 max-w-3xl font-display text-4xl tracking-tight sm:text-6xl">{t("guide.title")}</h1>
        <p className="relative mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">{t("guide.lead")}</p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <a href="/" className={`${primaryClass} text-accent-ink!`}>
            {t("guide.openCatalog")}
          </a>
          <a href="/register" className={quietClass}>
            {t("guide.createProfile")}
          </a>
        </div>
        <SearchMock />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Step n="01" icon="search" title={t("guide.findTitle")} body={t("guide.findBody")} />
        <Step n="02" icon="bookmark" title={t("guide.saveTitle")} body={t("guide.saveBody")} />
        <Step n="03" icon="star" title={t("guide.rateTitle")} body={t("guide.rateBody")} />
      </section>

      <section className="grid gap-3 lg:grid-cols-6">
        <Feature className="lg:col-span-4" icon="search" title={t("guide.searchTitle")} body={t("guide.searchBody")}>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-bg/70 px-3 py-1.5 font-mono text-sm text-accent">stalker</span>
            <Icon name="arrow" className="h-4 w-4 text-muted" />
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm">S.T.A.L.K.E.R. 2</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm">Shadow of Chernobyl</span>
          </div>
        </Feature>
        <Feature className="lg:col-span-2" icon="layers" title={t("guide.filterTitle")} body={t("guide.filterBody")}>
          <ul className="mt-5 space-y-2 text-sm">
            <FilterRow label={t("home.genre")} value={t("collections.shooter")} />
            <FilterRow label={t("home.platform")} value="PC" />
            <FilterRow label={t("game.series")} value="Metro" />
          </ul>
        </Feature>
        <Feature className="lg:col-span-3" icon="bookmark" title={t("guide.listTitle")} body={t("guide.listBody")}>
          <div className="mt-5 flex flex-wrap gap-2">
            <Status label={t("status.playing")} tone="bg-accent text-accent-ink" />
            <Status label={t("status.finished")} tone="bg-sky-300 text-sky-950" />
            <Status label={t("status.dropped")} tone="bg-rose-300 text-rose-950" />
            <Status label={t("status.backlog")} tone="bg-white/15 text-ink" />
            <Status label={t("guide.favorite")} tone="bg-white/10 text-ink" />
          </div>
        </Feature>
        <Feature className="lg:col-span-3" icon="flag" title={t("guide.tagTitle")} body={t("guide.tagBody")}>
          <div className="mt-5 flex flex-wrap gap-2">
            <Status label={t("game.ukrainianGame")} tone="bg-yellow-300 text-yellow-950" />
            <Status label={t("game.russianGame")} tone="bg-red-500 text-white" />
            <Status label={t("game.ukrainianTextVoice")} tone="bg-sky-400 text-sky-950" />
          </div>
        </Feature>
        <Feature className="lg:col-span-2" icon="building" title={t("guide.linkTitle")} body={t("guide.linkBody")}>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <a href="/?series=Metro" className="rounded-lg border border-line bg-white/10 px-2.5 py-1.5 hover:border-accent hover:text-accent">
              Metro
            </a>
            <a href="/?developer=4A%20Games" className="rounded-lg border border-line bg-white/10 px-2.5 py-1.5 hover:border-accent hover:text-accent">
              4A Games
            </a>
          </div>
        </Feature>
        <Feature className="lg:col-span-2" icon="steam" title={t("guide.steamTitle")} body={t("guide.steamBody")} />
        <Feature className="lg:col-span-2" icon="calendar" title={t("guide.calendarTitle")} body={t("guide.calendarBody")}>
          <div className="mt-5 flex items-end gap-3">
            <div>
              <p className="font-display text-4xl text-accent">{t("guide.sampleScore")}</p>
              <p className="text-xs text-muted">{t("guide.samplePlayers")}</p>
            </div>
            <a href="/calendar" className="mb-1 text-sm text-accent hover:underline">
              {t("nav.calendar")}
            </a>
          </div>
        </Feature>
      </section>

      <section className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-line bg-panel/70 px-6 py-8 sm:px-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{t("profile.wheel")}</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">{t("guide.wheelTitle")}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7">{t("guide.wheelBody")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Status label={t("status.backlog")} tone="bg-white/15 text-ink" />
            <Status label={t("wheel.elimination")} tone="bg-accent text-accent-ink" />
            <Status label={t("wheel.instant")} tone="bg-white/10 text-ink" />
          </div>
        </div>
        <WheelMock />
      </section>

      <section className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-line bg-white/5 px-6 py-8 sm:flex-row sm:items-center sm:px-10">
        <p className="max-w-xl text-base leading-7 text-ink/85">{t("guide.closing")}</p>
        <a href="/" className={`${primaryClass} text-accent-ink!`}>
          {t("guide.openCatalog")}
        </a>
      </section>
    </main>
  );
}

function WheelMock() {
  return (
    <div className="relative mx-auto h-64 w-64 max-w-full">
      <span
        aria-hidden="true"
        className="absolute top-0 left-1/2 z-10 -translate-x-1/2 border-x-8 border-t-[18px] border-x-transparent border-t-accent"
      />
      <div
        className="h-full w-full rounded-full shadow-2xl"
        style={{
          background:
            "conic-gradient(#d6ff4a 0 45deg, #7aa2ff 45deg 90deg, #c084fc 90deg 135deg, #ff8b6a 135deg 180deg, #5ce1e6 180deg 225deg, #ffd166 225deg 270deg, #7cffb2 270deg 315deg, #ff7ad9 315deg 360deg)",
        }}
      />
      <div className="absolute inset-[30%] flex items-center justify-center rounded-full bg-bg px-3 text-center text-xs font-semibold">
        {t("wheel.spin")}
      </div>
    </div>
  );
}

function SearchMock() {
  return (
    <div className="relative mt-10 max-w-xl rounded-[1.6rem] border border-white/10 bg-bg/80 p-4 shadow-2xl">
      <div className="flex h-12 items-center rounded-full border border-line bg-panel px-4 text-sm text-muted">
        <Icon name="search" className="mr-3 h-4 w-4" />
        stalker
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-3">
        <div>
          <p className="text-sm font-semibold">S.T.A.L.K.E.R. 2: Heart of Chornobyl</p>
          <p className="text-xs text-muted">2024</p>
        </div>
        <span className="rounded-full bg-accent px-2.5 py-1 font-display text-sm text-accent-ink">{t("guide.sampleScore")}</span>
      </div>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: string; icon: IconName; title: string; body: string }) {
  return (
    <article className="rounded-[1.6rem] border border-line bg-panel/70 p-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="font-display text-sm text-muted">{n}</span>
      </div>
      <h2 className="mt-4 font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </article>
  );
}

function Feature({
  className = "",
  icon,
  title,
  body,
  children,
}: {
  className?: string;
  icon: IconName;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <article className={`rounded-[1.6rem] border border-line bg-panel/70 p-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl tracking-tight">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
      {children}
    </article>
  );
}

function FilterRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between rounded-xl bg-bg/60 px-3 py-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-accent">{value}</span>
    </li>
  );
}

function Status({ label, tone }: { label: string; tone: string }) {
  return <span className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold ${tone}`}>{label}</span>;
}
