"use client";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { NumberFlowGroup } from "../hero-number/hero-number";
import type { MoneyFlowSettings } from "../hero-number/money-number-flow";
import { MoneyTotalFigure, type MoneyTotalItem } from "./money-total-figure";
import { type MoneyTotalsSize, moneyTotalsVariants } from "./money-totals-variants";

export type MoneyTotalsProps = Omit<ComponentProps<"dl">, "children"> &
  VariantProps<typeof moneyTotalsVariants> & {
    items: readonly MoneyTotalItem[];
    flow: MoneyFlowSettings;
    /**
     * Names these totals in a `FlowMemory`, so after a remount (a filter in the URL changed)
     * each amount animates from its last value.
     */
    memoryKey?: string;
  };

/**
 * Sums of money as labelled, exact figures: the one way a total is shown, from a lane header
 * (`sm`) and a toolbar (`md`) to a page's headline tiles (`lg`). Amounts are never rounded and
 * their digits animate together on change.
 */
export function MoneyTotals(props: MoneyTotalsProps) {
  const { items, flow, size, memoryKey, className, ...rest } = props;
  if (items.length === 0) return null;
  const resolved: MoneyTotalsSize = size ?? "md";
  return (
    <NumberFlowGroup>
      <dl
        data-slot="money-totals"
        className={cn(moneyTotalsVariants({ size: resolved }), className)}
        {...rest}
      >
        {items.map((item, index) => (
          <MoneyTotalFigure
            key={item.key}
            item={item}
            flow={flow}
            size={resolved}
            divided={index > 0}
            memoryKey={memoryKey ? `${memoryKey}:${item.key}` : undefined}
          />
        ))}
      </dl>
    </NumberFlowGroup>
  );
}
