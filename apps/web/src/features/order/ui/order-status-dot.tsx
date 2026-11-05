import type { OrderStatusDto } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";

export type OrderStatusDotProps = { statuses: readonly OrderStatusDto[]; id: string };

/** The order's status as a unified status badge with its color dot and name. */
export function OrderStatusDot({ statuses, id }: OrderStatusDotProps) {
  const orderStatus = statuses.find((candidate) => candidate.id === id);
  if (!orderStatus) return <>–</>;
  return <StatusBadge label={orderStatus.name} color={orderStatus.color} />;
}
