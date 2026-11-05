import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { Feature } from "../../permissions/features";
import { canView } from "../../shared/can-view";
import type { OrderListInput, OrderListSort } from "./list-schema";

type Order = Prisma.OrderOrderByWithRelationInput;
type Direction = Prisma.SortOrder;

const ORDERS: Record<OrderListSort, (sort: Direction) => Order> = {
  reference: (sort) => ({ reference: sort }),
  title: (sort) => ({ title: { sort, nulls: "last" } }),
  customer: (sort) => ({ customer: { name: sort } }),
  type: (sort) => ({ entityType: { name: sort } }),
  status: (sort) => ({ orderStatus: { name: sort } }),
  when: (sort) => ({ desiredStartsAt: { sort, nulls: "last" } }),
  quantity: (sort) => ({ estimatedHeadcount: { sort, nulls: "last" } }),
};

/** Sorting by another feature's name would reveal it, so it needs that feature's `read`. */
const SORT_FEATURE: Partial<Record<OrderListSort, Feature>> = {
  customer: "customer",
  type: "configuration",
  status: "pipeline",
};

export type OrderListOrderInput = {
  input: Pick<OrderListInput, "sort" | "direction">;
  context: Pick<OperationContext, "permissions">;
};

/**
 * `order.list` order: the chosen column (the reference when the caller may not view the column's
 * feature), then the newest reference and the id, so pages are stable under offset and cursor.
 */
export function orderListOrder({ input, context }: OrderListOrderInput): Order[] {
  const { direction } = input;
  const feature = SORT_FEATURE[input.sort];
  const sort = feature && !canView({ context, feature }) ? "reference" : input.sort;
  if (sort === "reference") return [{ reference: direction }, { id: direction }];
  return [ORDERS[sort](direction), { reference: "desc" }, { id: "desc" }];
}
