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
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { LIST_FIELDS, catalogHref, toggleValue, type CatalogQuery } from "@/lib/catalog-query";
import { apiUrl } from "@/lib/config";
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

export function CatalogSide({ catalog }: { catalog: CatalogQuery }) {
  // On phones the panel starts folded so the games come first.
  const [open, setOpen] = useState(false);
  const active = LIST_FIELDS.reduce((sum, field) => sum + catalog[field].length, 0) + (catalog.year ? 1 : 0) + (catalog.origin ? 1 : 0);
  const ukrainian = catalog.origin === "ua";

  return (
    <aside className="w-full shrink-0 rounded-3xl border border-line bg-panel/80 p-4 md:sticky md:top-24 md:w-72">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="catalog-filters"
        onClick={() => setOpen((value) => !value)}
        className="-m-4 flex h-14 w-[calc(100%+2rem)] items-center justify-between gap-3 px-5 text-left text-sm font-semibold md:hidden"
      >
        <span className="inline-flex items-center gap-2">
          {t("home.filters")}
          {active > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs text-accent-ink">
              {active}
            </span>
          ) : null}
        </span>
        <span className={`h-2 w-2 border-r-2 border-b-2 border-muted ${open ? "-translate-y-0.5 rotate-45" : "translate-y-0.5 -rotate-45"}`} />
      </button>
      <p className="hidden px-1 text-sm font-semibold md:block">{t("home.filters")}</p>
      <div id="catalog-filters" className={`${open ? "mt-6 block" : "hidden"} md:mt-0 md:block`}>
        <Section title={t("home.sort")} initialOpen>
          <ul className="flex flex-col">
            {SORTS.map((item) => (
              <li key={item.id}>
                <a href={catalogHref(catalog, { sort: item.id })} className={rowClass(catalog.sort === item.id)}>
                  {t(item.label)}
                </a>
              </li>
            ))}
          </ul>
        </Section>
        <a
          href={catalogHref(catalog, ukrainian ? { origin: "" } : { origin: "ua", genre: [], developer: [], publisher: [], series: [] })}
          role="switch"
          aria-checked={ukrainian}
          className="mt-2 flex items-center justify-between gap-3 rounded-2xl px-3 py-3 hover:bg-ink/5"
        >
          <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{t("home.ukrainianGames")}</span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full ${ukrainian ? "bg-accent" : "bg-ink/15"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white ${ukrainian ? "right-0.5" : "left-0.5"}`} />
          </span>
        </a>
        <Section title={t("home.genre")} count={catalog.genre.length} initialOpen>
          <CheckList
            catalog={catalog}
            field="genre"
            options={SEARCH_GENRES.map((item) => ({ id: item.id, label: t(GENRE_LABEL[item.id]), icon: SEARCH_GENRE_ICON[item.id] }))}
          />
        </Section>
        <Section title={t("home.platform")} count={catalog.platform.length} initialOpen>
          <CheckList
            catalog={catalog}
            field="platform"
            options={CATALOG_PLATFORMS.map((item) => ({ id: item.id, label: t(PLATFORM_LABEL[item.id]) }))}
          />
        </Section>
        <TextFilter catalog={catalog} field="series" label={t("game.series")} />
        <TextFilter catalog={catalog} field="developer" label={t("game.developers")} />
        <TextFilter catalog={catalog} field="publisher" label={t("game.publishers")} />
        <YearField catalog={catalog} />
      </div>
    </aside>
  );
}

function Section({ title, count = 0, initialOpen, children }: { title: string; count?: number; initialOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initialOpen === true);
  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between py-3 text-left text-xs font-semibold tracking-[0.14em] text-muted uppercase"
      >
        <span className="inline-flex items-center gap-2">
          {title}
          {count > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] tracking-normal text-accent-ink">
              {count}
            </span>
          ) : null}
        </span>
        <span className={`h-2 w-2 border-r-2 border-b-2 border-current ${open ? "-translate-y-0.5 rotate-45" : "translate-y-0.5 -rotate-45"}`} />
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </div>
  );
}

// One row of a multi-choice list: a link that adds or removes the value, drawn as a checkbox.
function CheckRow({ href, checked, icon, label }: { href: string; checked: boolean; icon?: IconName; label: string }) {
  return (
    <a href={href} role="checkbox" aria-checked={checked} className={rowClass(checked)}>
      <span
        aria-hidden="true"
        className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border ${
          checked ? "border-accent-fg bg-accent-fg text-bg" : "border-ink/30"
        }`}
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        ) : null}
      </span>
      {icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      <span className="truncate">{label}</span>
    </a>
  );
}

function CheckList({
  catalog,
  field,
  options,
}: {
  catalog: CatalogQuery;
  field: "genre" | "platform";
  options: { id: string; label: string; icon?: IconName }[];
}) {
  const [needle, setNeedle] = useState("");
  const term = needle.trim().toLowerCase();
  const shown = term ? options.filter((item) => item.label.toLowerCase().includes(term)) : options;
  const hrefFor = (id: string) => {
    const patch = toggleValue(catalog, field, id);
    // Genres and the Ukrainian list do not combine, so picking a genre leaves that list.
    return catalogHref(catalog, field === "genre" && !catalog.genre.includes(id) ? { ...patch, origin: "" } : patch);
  };

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
      <ul className="mt-2 max-h-56 overflow-auto">
        {shown.map((item) => (
          <li key={item.id}>
            <CheckRow href={hrefFor(item.id)} checked={catalog[field].includes(item.id)} icon={item.icon} label={item.label} />
          </li>
        ))}
        {shown.length === 0 ? <li className="px-3 py-2 text-sm text-muted">{t("home.nothing")}</li> : null}
      </ul>
    </div>
  );
}

function TextFilter({ catalog, field, label }: { catalog: CatalogQuery; field: "developer" | "publisher" | "series"; label: string }) {
  const chosen = catalog[field];
  const [value, setValue] = useState("");
  const [top, setTop] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/suggest?field=${field}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { names: [] }))
      .then((payload: { names?: string[] }) => setTop(payload.names ?? []))
      .catch(() => {
        if (!controller.signal.aborted) setTop([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [field]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setMatches(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ field, q: query });
      fetch(`${apiUrl}/suggest?${params}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { names: [] }))
        .then((payload: { names?: string[] }) => setMatches(payload.names ?? []))
        .catch(() => {
          if (!controller.signal.aborted) setMatches([]);
        });
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [field, value]);

  const hrefFor = (name: string) => {
    const patch = toggleValue(catalog, field, name);
    return catalogHref(catalog, chosen.includes(name) ? patch : { ...patch, origin: "" });
  };

  function add() {
    const name = value.trim();
    if (name.length < 2 || chosen.includes(name)) return;
    window.location.href = hrefFor(name);
  }

  const query = value.trim();
  const pool = matches ?? top.filter((name) => query.length === 0 || partialName(name, query));
  // Chosen names stay at the top so they can be unticked; suggestions follow.
  const shown = [...chosen, ...pool.filter((name) => !chosen.includes(name))].slice(0, Math.max(10, chosen.length));

  return (
    <Section title={label} count={chosen.length} initialOpen={chosen.length > 0}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <label className="relative block">
          <span className="sr-only">{label}</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("home.filterSearch")}
            maxLength={80}
            className="h-10 w-full rounded-xl border border-line bg-bg/70 pr-3 pl-9 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
        </label>
      </form>
      <ul className="mt-2 max-h-56 overflow-auto">
        {shown.map((name) => (
          <li key={name}>
            <CheckRow href={hrefFor(name)} checked={chosen.includes(name)} label={name} />
          </li>
        ))}
        {!loading && shown.length === 0 ? <li className="px-3 py-2 text-sm text-muted">{t("home.nothing")}</li> : null}
      </ul>
    </Section>
  );
}

function partialName(name: string, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (name.toLowerCase().includes(term)) return true;
  const folded = term.replace(/[^a-z0-9Ѐ-ӿ]+/gi, "");
  return folded.length > 0 && name.toLowerCase().replace(/[^a-z0-9Ѐ-ӿ]+/gi, "").includes(folded);
}

function YearField({ catalog }: { catalog: CatalogQuery }) {
  const [value, setValue] = useState(catalog.year);

  return (
    <form
      className="pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        window.location.href = catalogHref(catalog, { year: value.trim() });
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
          if (value.trim() !== catalog.year) window.location.href = catalogHref(catalog, { year: value.trim() });
        }}
        inputMode="numeric"
        placeholder={t("home.year")}
        className="mt-2 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
    </form>
  );
}

function rowClass(active: boolean): string {
  return `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-ink/5 ${active ? "font-semibold text-ink" : "text-ink/85"}`;
}

// The chosen filters as chips above the results; each one removes itself, the last link clears them all.
export function ActiveFilters({ catalog }: { catalog: CatalogQuery }) {
  const labelOf = (field: (typeof LIST_FIELDS)[number], value: string) => {
    if (field === "genre") {
      const id = value as SearchGenreId;
      return GENRE_LABEL[id] ? t(GENRE_LABEL[id]) : value;
    }
    if (field === "platform") {
      const id = value as CatalogPlatformId;
      return PLATFORM_LABEL[id] ? t(PLATFORM_LABEL[id]) : value;
    }
    return value;
  };
  const chips = [
    ...LIST_FIELDS.flatMap((field) =>
      catalog[field].map((value) => ({ key: `${field}:${value}`, label: labelOf(field, value), href: catalogHref(catalog, toggleValue(catalog, field, value)) })),
    ),
    ...(catalog.year ? [{ key: "year", label: catalog.year, href: catalogHref(catalog, { year: "" }) }] : []),
    ...(catalog.origin === "ua" ? [{ key: "origin", label: t("home.ukrainianGames"), href: catalogHref(catalog, { origin: "" }) }] : []),
  ];
  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.length > 1 ? (
        <a
          href={catalogHref(catalog, { genre: [], platform: [], developer: [], publisher: [], series: [], year: "", origin: "" })}
          className="inline-flex h-9 items-center rounded-full border border-line px-4 text-sm font-semibold hover:border-ink/30"
        >
          {t("home.clearFilters")}
        </a>
      ) : null}
      {chips.map((chip) => (
        <a
          key={chip.key}
          href={chip.href}
          aria-label={t("home.removeFilter", { name: chip.label })}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-raised pr-2.5 pl-4 text-sm font-semibold hover:bg-ink/10"
        >
          {chip.label}
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </a>
      ))}
    </div>
  );
}
