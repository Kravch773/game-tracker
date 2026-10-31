"use client";

import { getLocale, priceRegionFor, t, type DealsResponse } from "@gametracker/shared";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { apiUrl } from "@/lib/config";
import { formatMoney, formatShortDate } from "@/lib/format";

// The page may hold more than one bell (the rail and the phone header) and the profile reads the same deals:
// they share one request per page load.
let pending: { region: string; request: Promise<DealsResponse> } | null = null;

export function loadDeals(region: string): Promise<DealsResponse> {
  if (pending?.region !== region) {
    const request = fetch(`${apiUrl}/me/deals?region=${region}`, { credentials: "include" }).then(async (response) => {
      if (!response.ok) throw new Error(String(response.status));
      return (await response.json()) as DealsResponse;
    });
    request.catch(() => {
      if (pending?.request === request) pending = null;
    });
    pending = { region, request };
  }
  return pending.request;
}

// The bell beside the account: games from Want to play (and the Steam wishlist) on sale now. The counter shows
// sales that started since the bell was last opened; opening it marks them as seen.
export function DealsBell({ variant }: { variant: "rail" | "compact" }) {
  const region = priceRegionFor(getLocale());
  const [data, setData] = useState<DealsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<CSSProperties>({});
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    loadDeals(region)
      .then((payload) => {
        if (live) setData(payload);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [region]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !panel.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const box = button.current?.getBoundingClientRect();
    if (box) {
      const narrow = window.innerWidth < 640;
      setPlace(
        narrow
          ? { top: box.bottom + 8, left: 16, right: 16 }
          : variant === "rail"
            ? { left: box.right + 12, bottom: Math.max(16, window.innerHeight - box.bottom) }
            : { top: box.bottom + 8, right: Math.max(16, window.innerWidth - box.right) },
      );
    }
    setOpen(true);
    // A first load that failed (the API waking up, say) is tried again when the bell is opened.
    if (failed) {
      setFailed(false);
      loadDeals(region)
        .then(setData)
        .catch(() => setFailed(true));
    }
    if (data && data.newCount > 0) {
      setData({ ...data, newCount: 0 });
      void fetch(`${apiUrl}/me/deals/seen`, { method: "POST", credentials: "include" }).catch(() => undefined);
    }
  }

  async function mute(muted: boolean) {
    if (!data) return;
    setData({ ...data, settings: { ...data.settings, alerts: !muted } });
    await fetch(`${apiUrl}/me/deal-settings`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alerts: !muted }),
    }).catch(() => undefined);
  }

  const count = data?.settings.alerts ? data.newCount : 0;
  const deals = data?.deals ?? [];

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-label={count > 0 ? t("prices.bellNew", { count }) : t("prices.bell")}
        onClick={toggle}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          open ? "bg-accent text-accent-ink" : variant === "rail" ? "hover:bg-raised/60" : "border border-line bg-panel hover:bg-raised"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink ring-2 ring-bg">
            {count}
          </span>
        ) : null}
      </button>
      {/* The rail is sticky, which makes its own stacking layer; the panel goes to <body> to sit above the page. */}
      {open ? createPortal(
        <div
          ref={panel}
          role="dialog"
          aria-label={t("prices.bellTitle")}
          style={place}
          className="fixed z-50 flex max-h-[70vh] w-auto flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl sm:w-[26rem]"
        >
          <div className="flex items-baseline gap-2 px-5 pt-4 pb-2">
            <h2 className="font-display text-lg font-semibold">{t("prices.bellTitle")}</h2>
            <span className="text-sm text-muted">{t("prices.bellLead")}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {failed ? (
              <p className="px-3 py-6 text-center text-sm text-muted">{t("prices.bellFailed")}</p>
            ) : !data ? (
              <p className="px-3 py-6 text-center text-sm text-muted">{t("prices.loading")}</p>
            ) : deals.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">{t("prices.bellEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {deals.map((deal) => (
                  <li key={deal.game.id}>
                    <a
                      href={`/games/${encodeURIComponent(deal.game.slug)}`}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-raised ${deal.fresh ? "bg-raised/60" : ""}`}
                    >
                      {deal.game.coverUrl ? (
                        <img src={deal.game.coverUrl} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="h-14 w-10 shrink-0 rounded-lg bg-raised" />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-sm font-semibold">{deal.game.title}</span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                          <span className="font-semibold text-ink/80">{t(deal.price.store === "steam" ? "prices.steam" : "prices.playstation")}</span>
                          {deal.lowest ? (
                            <span className="rounded-md bg-amber-300 px-1.5 py-0.5 font-bold text-amber-950">{t("prices.lowTag")}</span>
                          ) : null}
                          {deal.price.endsAt ? <span>{t("prices.until", { date: formatShortDate(deal.price.endsAt) })}</span> : null}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="rounded-md bg-emerald-300 px-1.5 py-0.5 text-xs font-bold text-emerald-950">−{deal.price.cut}%</span>
                        <span className="text-sm font-bold tabular-nums">{formatMoney(deal.price.amount, deal.price.currency)}</span>
                        <s className="text-xs text-muted">{formatMoney(deal.price.base, deal.price.currency)}</s>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3">
            <label className="inline-flex min-h-10 items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={data ? !data.settings.alerts : false}
                disabled={!data}
                onChange={(event) => void mute(event.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              {t("prices.mute")}
            </label>
            <a href="/settings#deals" className="ml-auto inline-flex min-h-10 items-center text-sm font-semibold text-accent-fg hover:underline">
              {t("prices.settingsLink")}
            </a>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
