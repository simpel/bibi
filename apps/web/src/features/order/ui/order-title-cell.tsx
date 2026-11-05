import type { OrderDto } from "@bibi/core";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";

export type OrderTitleCellProps = {
  order: OrderDto;
  /** The title, or the fallback label for an order without one. */
  title: string;
};

/** The title as a link to the order. */
export function OrderTitleCell({ order, title }: OrderTitleCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Link href={orderRoute({ id: order.id })} className="font-medium hover:underline">
        {title}
      </Link>
    </div>
  );
}
