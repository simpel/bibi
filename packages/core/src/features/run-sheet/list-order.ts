import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { Feature } from "../../permissions/features";
import { canView } from "../../shared/can-view";
import type { RunSheetListInput, RunSheetListSort } from "./list-schema";

type Order = Prisma.RunSheetOrderByWithRelationInput;
type Direction = Prisma.SortOrder;

const ORDERS: Record<RunSheetListSort, (sort: Direction) => Order> = {
  created: (sort) => ({ createdAt: sort }),
  when: (sort) => ({ order: { desiredStartsAt: { sort, nulls: "last" } } }),
  order: (sort) => ({ order: { reference: sort } }),
  definition: (sort) => ({ runSheetDefinition: { name: sort } }),
  responsibility: (sort) => ({ responsibility: { name: sort } }),
  version: (sort) => ({ version: sort }),
  published: (sort) => ({ publishedAt: { sort, nulls: "last" } }),
  sent: (sort) => ({ publishedAt: { sort, nulls: "last" } }),
};

/** Sorting by another feature's column would reveal it, so it needs that feature's `read`. */
const SORT_FEATURE: Partial<Record<RunSheetListSort, Feature>> = {
  when: "order",
  order: "order",
  definition: "template",
  responsibility: "responsibility",
};

export type RunSheetListOrderInput = {
  input: Pick<RunSheetListInput, "sort" | "direction">;
  context: Pick<OperationContext, "permissions">;
};

/**
 * `runSheet.list` order: the chosen column (creation time when the caller may not view the
 * column's feature), then the newest and the id, so pages are stable under offset and cursor.
 */
export function runSheetListOrder({ input, context }: RunSheetListOrderInput): Order[] {
  const { direction } = input;
  const feature = SORT_FEATURE[input.sort];
  const sort = feature && !canView({ context, feature }) ? "created" : input.sort;
  if (sort === "created") return [{ createdAt: direction }, { id: direction }];
  return [ORDERS[sort](direction), { createdAt: "desc" }, { id: "desc" }];
}
