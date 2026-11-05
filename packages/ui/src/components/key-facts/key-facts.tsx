import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type KeyFact = {
  label: string;
  value: ReactNode;
  /** Gives way first when the row is too wide: the value is cut short instead of wrapping. */
  truncate?: boolean;
  /** The full text of a truncated value. */
  title?: string | undefined;
};

export const keyFactsVariants = cva("flex", {
  variants: {
    size: {
      /** The page's primary facts under the title. */
      lg: "gap-x-10",
      /** The same facts in a card or popover. */
      sm: "flex-wrap gap-x-5 gap-y-1.5",
    },
  },
  defaultVariants: { size: "lg" },
});

const valueVariants = cva(
  "font-serif font-light tracking-tight [&_a]:underline-offset-4 [&_a:hover]:underline",
  {
    variants: { size: { lg: "text-2xl", sm: "text-base leading-tight" } },
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
 * open a card underline on hover.
 */
export function KeyFacts({ facts, size, className }: KeyFactsProps) {
  return (
    <dl data-slot="key-facts" className={cn(keyFactsVariants({ size }), className)}>
      {facts.map(({ label, value, truncate, title }) => (
        <div key={label} className={cn("grid gap-1", truncate && "min-w-0 shrink-[999]")}>
          <dt className={cn("text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs")}>
            {label}
          </dt>
          <dd title={title} className={cn(valueVariants({ size }), truncate && "truncate")}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
