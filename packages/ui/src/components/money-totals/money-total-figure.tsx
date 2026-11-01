"use client";

import { Card } from "../card/card";
import { type MoneyFlowSettings, MoneyNumberFlow } from "../hero-number/money-number-flow";
import {
  type MoneyTotalsSize,
  moneyTotalAmountVariants,
  moneyTotalDotVariants,
  moneyTotalLabelVariants,
  moneyTotalVariants,
} from "./money-totals-variants";

export type MoneyTotalItem = {
  key: string;
  /** Short name of the figure, e.g. "Agreed" or "Estimated"; always shown with the amount. */
  label: string;
  /** A longer explanation for the tooltip; defaults to the label. */
  description?: string;
  /** The exact amount in minor units, never rounded; `null` shows `fallback` (e.g. "No access"). */
  minor: number | null;
  fallback?: string;
  /** A short line under the amount at `lg`, e.g. "Excl. VAT". */
  hint?: string;
  /**
   * What kind of money, shown as a coloured dot and amount: `positive` secured (agreed,
   * received), `pending` not yet certain (estimated, outstanding), `negative` a problem (overdue).
   */
  tone?: "neutral" | "positive" | "pending" | "negative";
};

export type MoneyTotalFigureProps = {
  item: MoneyTotalItem;
  flow: MoneyFlowSettings;
  size: MoneyTotalsSize;
  divided: boolean;
};

/** One labelled figure of `MoneyTotals`; at `lg` it is a tile. */
export function MoneyTotalFigure({ item, flow, size, divided }: MoneyTotalFigureProps) {
  const tone = item.tone ?? "neutral";
  const Root = size === "lg" ? Card : "div";
  return (
    <Root
      data-slot="money-total"
      title={item.description ?? item.label}
      className={moneyTotalVariants({ size, divided })}
    >
      <dt className={moneyTotalLabelVariants({ size })}>
        <span aria-hidden className={moneyTotalDotVariants({ tone })} />
        <span className="truncate">{item.label}</span>
      </dt>
      <dd className={moneyTotalAmountVariants({ size, tone })}>
        {item.minor === null ? (
          item.fallback
        ) : (
          <MoneyNumberFlow value={item.minor / 100} flow={flow} />
        )}
      </dd>
      {item.hint && size === "lg" ? (
        <dd className="text-xs text-muted-foreground">{item.hint}</dd>
      ) : null}
    </Root>
  );
}
