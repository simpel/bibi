import type { OrderStatusDto } from "@bibi/core/schemas";
import { ColorSwatch } from "@bibi/ui";

export type OrderStatusLabelProps = { statuses: readonly OrderStatusDto[]; id: string };

/** The order's status name with its color ("–" for a status that is no longer listed). */
export function OrderStatusLabel({ statuses, id }: OrderStatusLabelProps) {
  const orderStatus = statuses.find((candidate) => candidate.id === id);
  if (!orderStatus) return <>–</>;
  return (
    <span className="inline-flex items-center gap-2">
      <ColorSwatch color={orderStatus.color} />
      {orderStatus.name}
    </span>
  );
}
