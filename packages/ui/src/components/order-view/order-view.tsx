import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../card/card";
import { StatusBadge } from "../data-table/data-table-column-helpers";

export type OrderViewFact = {
  key: string;
  /** Translated label, e.g. "Customer". */
  label: string;
  /** The formatted value; `null` shows the card's `hidden` text (no access to that feature). */
  value: ReactNode | null;
  /** Draws attention to the value, e.g. open issues or an unpaid balance. */
  tone?: "default" | "warning";
};

export type OrderViewProps = {
  /** The order's name, usually a link to its page. */
  title: ReactNode;
  /** The order's status; `null` hides the badge (no pipeline access). */
  status: { name: string; color: string } | null;
  facts: readonly OrderViewFact[];
  /** Shown for a fact whose value is `null`, e.g. "–". */
  hidden: string;
  footer?: ReactNode;
  className?: string;
};

/** One order at a glance (`order.view`): status, party, people, program totals and balance. */
export function OrderView({ title, status, facts, hidden, footer, className }: OrderViewProps) {
  return (
    <Card data-slot="order-view" className={cn("shadow-none", className)}>
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {status ? <StatusBadge label={status.name} color={status.color} /> : null}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {facts.map(({ key, label, value, tone }) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd
                className={cn(
                  "min-w-0 truncate",
                  value === null && "text-muted-foreground",
                  tone === "warning" && value !== null && "font-medium text-destructive",
                )}
              >
                {value ?? hidden}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
      {footer ? <CardFooter className="p-4 pt-0 text-sm">{footer}</CardFooter> : null}
    </Card>
  );
}
