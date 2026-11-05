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
  /** Makes the value a button, e.g. to open the order. */
  onSelect?: (() => void) | undefined;
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
          ? "grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5 text-xs"
          : "grid-cols-[auto_1fr]",
        className,
      )}
    >
      {facts.map(({ key, label, value, tone, onSelect }) => (
        <div key={key} className="contents">
          <dt className="whitespace-nowrap text-muted-foreground">{label}</dt>
          <dd
            className={cn(
              "min-w-0",
              !bare && "truncate",
              value === null && "text-muted-foreground",
              tone === "warning" && value !== null && "font-medium text-destructive",
            )}
          >
            {onSelect && value !== null ? (
              <button
                type="button"
                onClick={onSelect}
                className="text-left underline-offset-4 outline-none hover:underline focus-visible:underline"
              >
                {value}
              </button>
            ) : (
              (value ?? hidden)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
