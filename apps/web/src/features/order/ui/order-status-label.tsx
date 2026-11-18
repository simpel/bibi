import type { OrderStatusDto } from "@bibi/core/schemas";
import { ColorSwatch, StatusBadge } from "@bibi/ui";

export type OrderStatusLabelProps = {
  statuses: readonly OrderStatusDto[];
  id: string;
  /** Standing alone (not inside a button): a status badge. Inside a button: the dot and name. */
  badge?: boolean;
};

/** The order's status name with its color ("–" for a status that is no longer listed). */
export function OrderStatusLabel({ statuses, id, badge = false }: OrderStatusLabelProps) {
  const orderStatus = statuses.find((candidate) => candidate.id === id);
  if (!orderStatus) return <>–</>;
  if (badge) {
    // As tall as the small buttons beside it on the title row (Follow).
    return (
      <StatusBadge
        label={orderStatus.name}
        color={orderStatus.color}
        className="h-8 px-3 text-sm"
      />
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <ColorSwatch color={orderStatus.color} />
      {orderStatus.name}
    </span>
  );
}
