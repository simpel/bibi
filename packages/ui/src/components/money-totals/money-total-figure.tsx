"use client";

import { Card } from "../card/card";
import { type MoneyFlowSettings, MoneyNumberFlow } from "../hero-number/money-number-flow";
import {
  type MoneyTotalsSize,
  moneyTotalAmountVariants,
  moneyTotalLabelVariants,
  moneyTotalVariants,
} from "./money-totals-variants";

export type MoneyTotalItem = {
  key: string;
  /** Short name of the figure, e.g. "Agreed". Visible at `md` and `lg`, read aloud at `sm`. */
  label: string;
  /** A longer explanation for the tooltip; defaults to the label. */
  description?: string;
  /** The exact amount in minor units, never rounded; `null` shows `fallback` (e.g. "No access"). */
  minor: number | null;
  fallback?: string;
  /** A short line under the amount at `lg`, e.g. "Excl. VAT". */
  hint?: string;
  /** `estimate` is muted and written `≈`; `destructive` warns (overdue money). */
  tone?: "default" | "estimate" | "destructive";
};

export type MoneyTotalFigureProps = {
  item: MoneyTotalItem;
  flow: MoneyFlowSettings;
  size: MoneyTotalsSize;
  divided: boolean;
};

/** One labelled figure of `MoneyTotals`; at `lg` it is a tile. */
export function MoneyTotalFigure({ item, flow, size, divided }: MoneyTotalFigureProps) {
  const tone = item.tone ?? "default";
  const Root = size === "lg" ? Card : "div";
  return (
    <Root
      data-slot="money-total"
      title={item.description ?? item.label}
      className={moneyTotalVariants({ size, divided })}
    >
      <dt className={moneyTotalLabelVariants({ size })}>{item.label}</dt>
      <dd className={moneyTotalAmountVariants({ size, tone })}>
        {item.minor === null ? (
          item.fallback
        ) : (
          <MoneyNumberFlow
            value={item.minor / 100}
            flow={flow}
            lead={tone === "estimate" ? "≈ " : ""}
          />
        )}
      </dd>
      {item.hint && size === "lg" ? (
        <dd className="text-xs text-muted-foreground">{item.hint}</dd>
      ) : null}
    </Root>
  );
}
