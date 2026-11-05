import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "../data-table/data-table-column-helpers";
import type { OrderViewStatus } from "./order-view";

export type OrderViewMetaRow = {
  key: string;
  icon: LucideIcon;
  text: ReactNode;
};

export type OrderViewMetaProps = {
  rows: readonly OrderViewMetaRow[];
  /** Shown at the right end of the first row. */
  status: OrderViewStatus | null;
};

export function OrderViewMeta({ rows, status }: OrderViewMetaProps) {
  return (
    <div className="grid gap-2 text-muted-foreground text-xs">
      {rows.map(({ key, icon: Icon, text }, index) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Icon aria-hidden className="size-3.5 shrink-0 opacity-70" />
            <span className="tabular-nums">{text}</span>
          </div>
          {index === 0 && status ? <StatusBadge label={status.name} color={status.color} /> : null}
        </div>
      ))}
    </div>
  );
}
