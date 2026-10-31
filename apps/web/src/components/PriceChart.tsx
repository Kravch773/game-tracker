"use client";

import { t, type PricePoint } from "@gametracker/shared";
import { useState, type PointerEvent } from "react";
import { formatMoney, formatShortDate } from "@/lib/format";

const WIDTH = 320;
const HEIGHT = 120;
const PAD = { top: 10, right: 8, bottom: 8, left: 8 };
const DAY_MS = 24 * 60 * 60 * 1000;

// One store's daily prices as a step line: a price holds until the day it changes. The full price is a faint
// dashed line, the lowest day is marked, and hovering or touching shows any day's price. Labels sit outside the
// drawing, so they keep their size however narrow the column is.
export function PriceChart({ points, store }: { points: PricePoint[]; store: string }) {
  const [active, setActive] = useState<number | null>(null);
  // A store that switched currency (a US price standing in, then a local one) is charted in its current currency.
  const currency = points.at(-1)?.currency;
  const series = points.filter((point) => point.currency === currency);
  if (!currency || series.length < 2) return <p className="mt-2 text-xs text-muted">{t("prices.chartFew")}</p>;

  const times = series.map((point) => Date.parse(point.day));
  const first = times[0];
  // The line runs on to today, so the current price has a visible stretch.
  const last = Math.max(times[times.length - 1], Date.now() - (Date.now() % DAY_MS));
  const top = Math.max(...series.map((point) => point.base));
  const low = Math.min(...series.map((point) => point.amount));
  const floor = Math.max(0, low - (top - low) * 0.15 - 1);
  const x = (time: number) => PAD.left + ((time - first) / Math.max(last - first, DAY_MS)) * (WIDTH - PAD.left - PAD.right);
  const y = (amount: number) => PAD.top + (1 - (amount - floor) / Math.max(top - floor, 1)) * (HEIGHT - PAD.top - PAD.bottom);

  let path = `M${x(times[0])},${y(series[0].amount)}`;
  series.forEach((point, index) => {
    if (index > 0) path += ` H${x(times[index])} V${y(point.amount)}`;
  });
  path += ` H${x(last)}`;

  const lowIndex = series.reduce((best, point, index) => (point.amount < series[best].amount ? index : best), 0);
  const shown = active ?? series.length - 1;

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = first + ((event.clientX - box.left) / box.width * WIDTH - PAD.left) / (WIDTH - PAD.left - PAD.right) * (last - first);
    // The price on a day is the last change on or before it.
    let index = 0;
    while (index + 1 < times.length && times[index + 1] <= at) index += 1;
    setActive(index);
  };

  return (
    <figure className="mt-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-muted">
        <span>{t("prices.chartTitle", { store })}</span>
        <span className="tabular-nums">
          {formatShortDate(series[shown].day)} · <span className="font-semibold text-ink">{formatMoney(series[shown].amount, currency)}</span>
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-1 block h-auto w-full touch-none"
        role="img"
        aria-label={t("prices.chartTitle", { store })}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setActive(null)}
      >
        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT - PAD.bottom} y2={HEIGHT - PAD.bottom} stroke="var(--color-line)" />
        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(top)} y2={y(top)} stroke="var(--color-muted)" strokeDasharray="3 4" opacity={0.6} />
        <path d={path} fill="none" stroke="var(--color-accent-fg)" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={x(times[lowIndex])} cy={y(low)} r={5} fill="var(--color-accent-fg)" stroke="var(--color-panel)" strokeWidth={2} />
        {active != null ? (
          <>
            <line x1={x(times[active])} x2={x(times[active])} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--color-muted)" opacity={0.5} />
            <circle cx={x(times[active])} cy={y(series[active].amount)} r={5} fill="var(--color-ink)" stroke="var(--color-panel)" strokeWidth={2} />
          </>
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted tabular-nums">
        <span>{formatShortDate(series[0].day)}</span>
        <span>{formatShortDate(new Date(last).toISOString().slice(0, 10))}</span>
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent-fg" />
          {t("prices.chartLow", { price: formatMoney(low, currency) })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="w-3 border-t border-dashed border-muted" />
          {t("prices.chartFull", { price: formatMoney(top, currency) })}
        </span>
      </p>
    </figure>
  );
}
