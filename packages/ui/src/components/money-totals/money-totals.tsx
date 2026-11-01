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
  };

/**
 * Sums of money as labelled, exact figures: the one way a total is shown, from a lane header
 * (`sm`) and a toolbar (`md`) to a page's headline tiles (`lg`). Amounts are never rounded and
 * their digits animate together on change.
 */
export function MoneyTotals({ items, flow, size, className, ...props }: MoneyTotalsProps) {
  if (items.length === 0) return null;
  const resolved: MoneyTotalsSize = size ?? "md";
  return (
    <NumberFlowGroup>
      <dl
        data-slot="money-totals"
        className={cn(moneyTotalsVariants({ size: resolved }), className)}
        {...props}
      >
        {items.map((item, index) => (
          <MoneyTotalFigure
            key={item.key}
            item={item}
            flow={flow}
            size={resolved}
            divided={index > 0}
          />
        ))}
      </dl>
    </NumberFlowGroup>
  );
}
