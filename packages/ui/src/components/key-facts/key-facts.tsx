import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type KeyFact = {
  label: string;
  /** A tiny line with the value, e.g. the weekday and date of a time: above it, under it at `sm`. */
  preheader?: string | undefined;
  value: ReactNode;
  /** Gives way first when the row is too wide: the value is cut short instead of wrapping. */
  truncate?: boolean;
  /** Makes the value a button, e.g. to open what it belongs to. */
  onSelect?: (() => void) | undefined;
  /** The full text of a truncated value. */
  title?: string | undefined;
};

export const keyFactsVariants = cva("flex", {
  variants: {
    size: {
      /** The page's primary facts under the title. */
      lg: "items-end gap-x-10",
      /** The same facts in a card or popover. */
      sm: "flex-wrap items-start gap-x-5 gap-y-1.5",
    },
  },
  defaultVariants: { size: "lg" },
});

const valueVariants = cva(
  "font-serif tracking-tight [&_a]:underline-offset-4 [&_a:hover]:underline",
  {
    variants: { size: { lg: "font-light text-2xl", sm: "font-light text-base leading-tight" } },
    defaultVariants: { size: "lg" },
  },
);

export type KeyFactsProps = VariantProps<typeof keyFactsVariants> & {
  facts: readonly KeyFact[];
  className?: string;
};

/**
 * The primary facts in one row, in the stat cards' type without their frame: each as wide as its
 * value, which may wrap; a truncating fact (the customer) gives way first. Links and names that
 * open a card underline on hover. On a page (`lg`) the label sits under its value; in a card
 * (`sm`) it sits on top, with the value's tiny line (the date) under the value. At `lg` the facts
 * align to the bottom, so the labels share one line however many lines a value takes.
 */
export function KeyFacts({ facts, size, className }: KeyFactsProps) {
  const small = size === "sm";
  return (
    <dl data-slot="key-facts" className={cn(keyFactsVariants({ size }), className)}>
      {facts.map(({ label, preheader, value, truncate, title, onSelect }) => (
        <div
          key={label}
          className={cn(
            "grid gap-1",
            small ? "content-start" : "content-end",
            truncate && "min-w-0 shrink-[999]",
          )}
        >
          <dt
            className={cn(
              "text-muted-foreground",
              small ? "font-medium text-[11px] leading-4" : "order-last text-xs",
            )}
          >
            {label}
          </dt>
          <dd title={title} className={cn(valueVariants({ size }), truncate && "truncate")}>
            {!small && preheader ? (
              <span className="block font-medium font-sans text-foreground/80 text-xs leading-4">
                {preheader}
              </span>
            ) : null}
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                className="max-w-full truncate text-left underline-offset-4 outline-none hover:underline focus-visible:underline"
              >
                {value}
              </button>
            ) : (
              value
            )}
            {small && preheader ? (
              <span className="mt-0.5 block font-medium font-sans text-[11px] text-muted-foreground leading-4 tracking-normal">
                {preheader}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
