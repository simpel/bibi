"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { NumberFlowGroup } from "../hero-number/hero-number";
import { type MoneyFlowSettings, MoneyNumberFlow } from "../hero-number/money-number-flow";

export type MoneyTotalItem = {
  key: string;
  /** Short name of the figure, e.g. "Agreed". Shown over the amount at `md`, read aloud at `sm`. */
  label: string;
  /** A longer explanation for the tooltip; defaults to the label. */
  description?: string;
  /** The exact amount in minor units; never rounded. */
  minor: number;
  /** An estimate: muted and written `≈`. */
  estimate?: boolean;
};

export const moneyTotalsVariants = cva("flex flex-wrap items-end", {
  variants: { size: { sm: "gap-x-3", md: "gap-x-4 gap-y-1" } },
  defaultVariants: { size: "md" },
});

export const moneyTotalVariants = cva("flex min-w-0 flex-col", {
  variants: {
    size: { sm: "", md: "gap-0.5" },
    divided: { true: "border-l", false: "" },
  },
  compoundVariants: [
    { size: "sm", divided: true, className: "pl-3" },
    { size: "md", divided: true, className: "pl-4" },
  ],
  defaultVariants: { size: "md", divided: false },
});

export const moneyTotalAmountVariants = cva("whitespace-nowrap font-sans tabular-nums", {
  variants: {
    size: { sm: "text-xs", md: "text-sm font-medium" },
    estimate: { true: "text-muted-foreground", false: "text-foreground" },
  },
  defaultVariants: { size: "md", estimate: false },
});

type Size = NonNullable<VariantProps<typeof moneyTotalsVariants>["size"]>;

export type MoneyTotalsProps = Omit<ComponentProps<"dl">, "children"> &
  VariantProps<typeof moneyTotalsVariants> & {
    items: readonly MoneyTotalItem[];
    flow: MoneyFlowSettings;
  };

type FigureProps = { item: MoneyTotalItem; flow: MoneyFlowSettings; size: Size; divided: boolean };

function MoneyTotalFigure({ item, flow, size, divided }: FigureProps) {
  const estimate = item.estimate === true;
  return (
    <div
      data-slot="money-total"
      title={item.description ?? item.label}
      className={moneyTotalVariants({ size, divided })}
    >
      <dt className={size === "md" ? "text-xs text-muted-foreground" : "sr-only"}>{item.label}</dt>
      <dd className={moneyTotalAmountVariants({ size, estimate })}>
        <MoneyNumberFlow value={item.minor / 100} flow={flow} lead={estimate ? "≈ " : ""} />
      </dd>
    </div>
  );
}

/**
 * Sums of money as labelled, exact figures (agreed, estimated …): the one way a total is shown
 * beside a heading, in a toolbar or in a lane header. The digits animate together on change.
 * `md` shows each label over its amount; `sm` keeps the label for tooltips and screen readers.
 */
export function MoneyTotals({ items, flow, size, className, ...props }: MoneyTotalsProps) {
  if (items.length === 0) return null;
  const resolved: Size = size ?? "md";
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
