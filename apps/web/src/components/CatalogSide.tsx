"use client";

import {
  CATALOG_PLATFORMS,
  SEARCH_GENRES,
  t,
  type CatalogPlatformId,
  type MessageKey,
  type SearchGenreId,
  type SearchSort,
} from "@gametracker/shared";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { SEARCH_GENRE_ICON } from "@/lib/marks";

const GENRE_LABEL: Record<SearchGenreId, MessageKey> = {
  rpg: "collections.rpg",
  shooter: "collections.shooter",
  adventure: "collections.adventure",
  strategy: "collections.strategy",
  indie: "collections.indie",
  racing: "collections.racing",
  fighting: "genres.fighting",
  platform: "genres.platform",
  puzzle: "genres.puzzle",
  sport: "genres.sport",
  simulator: "genres.simulator",
  "hack-and-slash": "genres.hack-and-slash",
  tactical: "genres.tactical",
  rts: "genres.rts",
  tbs: "genres.tbs",
  music: "genres.music",
  arcade: "genres.arcade",
  "visual-novel": "genres.visual-novel",
  moba: "genres.moba",
  card: "genres.card",
  "point-and-click": "genres.point-and-click",
  quiz: "genres.quiz",
  pinball: "genres.pinball",
};

const PLATFORM_LABEL: Record<CatalogPlatformId, MessageKey> = {
  pc: "platforms.pc",
  ps5: "platforms.ps5",
  ps4: "platforms.ps4",
  "xbox-series": "platforms.xbox-series",
  "xbox-one": "platforms.xbox-one",
  switch: "platforms.switch",
};

const SORTS: { id: SearchSort; label: MessageKey }[] = [
  { id: "popular", label: "home.sortPopular" },
  { id: "release", label: "home.sortRelease" },
  { id: "title", label: "home.sortTitle" },
];

type SideState = {
  q: string;
  genre: string;
  platform: string;
  year: string;
  origin: "" | "ua" | "ru";
  sort: SearchSort;
};

export function CatalogSide(props: SideState) {
  return (
    <aside className="w-full shrink-0 rounded-3xl border border-line bg-panel/80 p-4 md:sticky md:top-24 md:w-72">
      <p className="px-1 text-sm font-semibold">{t("home.filters")}</p>
      <Section title={t("home.sort")} initialOpen>
        <ul className="flex flex-col">
          {SORTS.map((item) => (
            <li key={item.id}>
              <a href={href(props, { sort: item.id })} className={rowClass(props.sort === item.id)}>
                {t(item.label)}
              </a>
            </li>
          ))}
        </ul>
      </Section>
      <a
        href={href(props, { origin: props.origin === "ua" ? "" : "ua", genre: props.origin === "ua" ? props.genre : "" })}
        className="mt-2 flex items-center justify-between gap-3 rounded-2xl px-3 py-3 hover:bg-white/5"
      >
        <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{t("home.ukrainianGames")}</span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full ${props.origin === "ua" ? "bg-accent" : "bg-white/15"}`}>
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white ${props.origin === "ua" ? "right-0.5" : "left-0.5"}`}
          />
        </span>
      </a>
      <Section title={t("home.genre")} initialOpen>
        <OptionList
          selected={props.genre}
          options={SEARCH_GENRES.map((item) => ({ id: item.id, label: t(GENRE_LABEL[item.id]), icon: SEARCH_GENRE_ICON[item.id] }))}
          hrefFor={(id) => href(props, { genre: props.genre === id ? "" : id, origin: id && props.genre !== id ? "" : props.origin })}
        />
      </Section>
      <Section title={t("home.platform")} initialOpen>
        <OptionList
          selected={props.platform}
          options={CATALOG_PLATFORMS.map((item) => ({ id: item.id, label: t(PLATFORM_LABEL[item.id]) }))}
          hrefFor={(id) => href(props, { platform: props.platform === id ? "" : id })}
        />
      </Section>
      <YearField {...props} />
    </aside>
  );
}

function Section({ title, initialOpen, children }: { title: string; initialOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initialOpen === true);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between py-3 text-left text-xs font-semibold tracking-[0.14em] text-muted uppercase"
      >
        {title}
        <span className={`h-2 w-2 border-r-2 border-b-2 border-current ${open ? "-translate-y-0.5 rotate-45" : "translate-y-0.5 -rotate-45"}`} />
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </div>
  );
}

function OptionList({
  options,
  selected,
  hrefFor,
}: {
  options: { id: string; label: string; icon?: (typeof SEARCH_GENRE_ICON)[SearchGenreId] }[];
  selected: string;
  hrefFor: (id: string) => string;
}) {
  const [needle, setNeedle] = useState("");
  const term = needle.trim().toLowerCase();
  const shown = term ? options.filter((item) => item.label.toLowerCase().includes(term)) : options;

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">{t("home.filterSearch")}</span>
        <input
          value={needle}
          onChange={(event) => setNeedle(event.target.value)}
          placeholder={t("home.filterSearch")}
          className="h-10 w-full rounded-xl border border-line bg-bg/70 pr-3 pl-9 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
      </label>
      <ul className="mt-2 max-h-52 overflow-auto">
        {shown.map((item) => (
          <li key={item.id}>
            <a href={hrefFor(item.id)} className={rowClass(item.id === selected)}>
              {item.icon ? <Icon name={item.icon} className="h-4 w-4" /> : null}
              <span className="truncate">{item.label}</span>
            </a>
          </li>
        ))}
        {shown.length === 0 ? <li className="px-3 py-2 text-sm text-muted">{t("home.nothing")}</li> : null}
      </ul>
    </div>
  );
}

function YearField(props: SideState) {
  const [value, setValue] = useState(props.year);

  return (
    <form
      className="pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = href(props, { year: value.trim() });
      }}
    >
      <label className="block text-xs font-semibold tracking-[0.14em] text-muted uppercase" htmlFor="filter-year">
        {t("home.year")}
      </label>
      <input
        id="filter-year"
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/\D/g, "").slice(0, 4))}
        onBlur={() => {
          if (value.trim() !== props.year) window.location.href = href(props, { year: value.trim() });
        }}
        inputMode="numeric"
        placeholder={t("home.year")}
        className="mt-2 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
    </form>
  );
}

function href(current: SideState, patch: Partial<SideState>): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.genre) params.set("genre", next.genre);
  if (next.platform) params.set("platform", next.platform);
  if (next.year) params.set("year", next.year);
  if (next.origin) params.set("origin", next.origin);
  if (next.sort !== "popular") params.set("sort", next.sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function rowClass(active: boolean): string {
  return `flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5 ${active ? "bg-white/10 font-semibold text-accent" : "text-ink/85"}`;
}
