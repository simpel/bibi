import type { OrderDto } from "@bibi/core";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";

export type OrderTitleCellProps = {
  order: OrderDto;
  /** The title, or the fallback label for an order without one. */
  title: string;
  /** Red and amber badges after the title. */
  issues?: ReactNode;
};

/** The title as a link to the order, then its badges. */
export function OrderTitleCell({ order, title, issues }: OrderTitleCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Link href={orderRoute({ id: order.id })} className="font-medium hover:underline">
        {title}
      </Link>
      {issues}
    </div>
  );
}
