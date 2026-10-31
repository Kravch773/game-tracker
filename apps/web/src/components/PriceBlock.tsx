"use client";

import { getLocale, priceRegionFor, t, type GamePrices, type PriceStore } from "@gametracker/shared";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { apiUrl } from "@/lib/config";
import { formatMoney, formatShortDate } from "@/lib/format";

const STORE_MARK: Record<PriceStore, { icon: IconName; tone: string }> = {
  steam: { icon: "steam", tone: "bg-sky-300" },
  gog: { icon: "gog", tone: "bg-violet-300 text-violet-950" },
  playstation: { icon: "ps5", tone: "bg-blue-950" },
  xbox: { icon: "xbox-series", tone: "bg-green-950 text-green-100" },
};

export function storeName(store: PriceStore): string {
  return t(`prices.${store}`);
}

// Current store prices for the visitor's language: Ukrainian stores (in hryvnias, GOG in dollars), US stores in
// dollars. They load after the page, since the PlayStation Store can take a few seconds to answer.
export function PriceBlock({ slug, title, variant }: { slug: string; title: string; variant: "console" | "shelf" }) {
  const region = priceRegionFor(getLocale());
  const [prices, setPrices] = useState<GamePrices | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let live = true;
    fetch(`${apiUrl}/games/${encodeURIComponent(slug)}/prices?region=${region}`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as GamePrices;
        if (live) {
          setPrices(payload);
          setState("ready");
        }
      })
      .catch(() => {
        if (live) setState("failed");
      });
    return () => {
      live = false;
    };
  }, [slug, region]);

  if (state === "failed") return null;
  const shelf = variant === "shelf";
  const stores = prices?.stores ?? [];
  const sold = stores.some((price) => price.store === "playstation");
  const lowest = prices?.lowest;

  return (
    <section aria-busy={state === "loading"} className={shelf ? "rounded-[32px] bg-panel p-5" : "rounded-3xl border border-line bg-panel p-4"}>
      <h2 className={shelf ? "font-display text-xl font-extrabold" : "text-[11px] font-bold tracking-[0.14em] text-muted uppercase"}>
        {t("prices.title")}
      </h2>
      <p className="mt-1 text-xs text-muted">{t(region === "us" ? "prices.regionUs" : "prices.regionUa")}</p>
      {state === "loading" ? (
        <p className="mt-3 text-sm text-muted">{t("prices.loading")}</p>
      ) : stores.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("prices.none")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {stores.map((price) => {
            const name = storeName(price.store);
            const sale = price.cut > 0;
            // The Xbox Store does not sell console-only games in Ukraine; their US price stands in.
            const foreign = region === "ua" && price.store === "xbox" && price.currency === "USD";
            return (
              <li key={price.store}>
                <a
                  href={price.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("prices.open", { store: name })}
                  className={`flex min-h-14 items-center gap-2.5 px-2.5 py-2 hover:ring-1 hover:ring-accent-fg ${
                    shelf ? "rounded-2xl bg-raised" : "rounded-xl bg-raised"
                  }`}
                >
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${STORE_MARK[price.store].tone}`}>
                    <Icon name={STORE_MARK[price.store].icon} className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 text-sm leading-tight font-semibold">{name}</span>
                      <span className="shrink-0 font-display text-base font-semibold tabular-nums">{formatMoney(price.amount, price.currency)}</span>
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted">
                      <span className="flex flex-col gap-0.5">
                        <span>{sale ? (price.endsAt ? t("prices.until", { date: formatShortDate(price.endsAt) }) : null) : t("prices.full")}</span>
                        {foreign ? <span>{t("prices.usPrice")}</span> : null}
                      </span>
                      {sale ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="rounded-md bg-emerald-300 px-1.5 py-0.5 font-bold text-emerald-950">−{price.cut}%</span>
                          <s>{formatMoney(price.base, price.currency)}</s>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {lowest ? (
        <p className="mt-3 rounded-xl bg-amber-300/15 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
          {t("prices.lowest", {
            price: formatMoney(lowest.amount, lowest.currency),
            store: storeName(lowest.store),
            date: formatShortDate(lowest.seenOn),
          })}
        </p>
      ) : null}
      {prices?.steamAppId || sold ? (
        <p className="mt-3 flex flex-col gap-1 text-sm font-semibold">
          {prices?.steamAppId ? (
            <a href={`https://steamdb.info/app/${prices.steamAppId}/`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center hover:text-accent-fg">
              {t("prices.steamdb")} <span aria-hidden="true">&nbsp;↗</span>
            </a>
          ) : null}
          {sold ? (
            <a
              href={`https://psprices.com/region-${region}/games/?q=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center hover:text-accent-fg"
            >
              {t("prices.psprices")} <span aria-hidden="true">&nbsp;↗</span>
            </a>
          ) : null}
        </p>
      ) : null}
      {prices?.trackedSince ? <p className="mt-2 text-xs text-muted">{t("prices.tracked", { date: formatShortDate(prices.trackedSince) })}</p> : null}
    </section>
  );
}
