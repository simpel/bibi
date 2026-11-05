import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type OrderViewFact = {
  key: string;
  /** Translated label, e.g. "Customer". */
  label: string;
  /** The formatted value; `null` shows the card's `hidden` text (no access to that feature). */
  value: ReactNode | null;
  /** Draws attention to the value, e.g. open issues or an unpaid balance. */
  tone?: "default" | "warning";
};

export type OrderViewFactsProps = {
  facts: readonly OrderViewFact[];
  hidden: string;
  bare?: boolean | undefined;
  className?: string;
};

export function OrderViewFacts({ facts, hidden, bare, className }: OrderViewFactsProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-4 gap-y-1 text-sm",
        bare
          ? "grid-cols-[3.75rem_1fr] items-baseline gap-x-3 gap-y-1.5 text-xs"
          : "grid-cols-[auto_1fr]",
        className,
      )}
    >
      {facts.map(({ key, label, value, tone }) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd
            className={cn(
              "min-w-0",
              !bare && "truncate",
              value === null && "text-muted-foreground",
              tone === "warning" && value !== null && "font-medium text-destructive",
            )}
          >
            {value ?? hidden}
          </dd>
        </div>
      ))}
    </dl>
  );
}
