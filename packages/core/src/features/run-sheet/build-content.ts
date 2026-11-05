import type { Order } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { RunSheetDefinitionDto } from "../run-sheet-definition/schema";
import { itemRows } from "./item-rows";
import { requirementRows } from "./requirement-rows";
import type { RunSheetContent } from "./schema";

export type BuildRunSheetContentInput = {
  context: Pick<OperationContext, "db">;
  order: Order;
  definition: RunSheetDefinitionDto;
};

/**
 * The snapshot a run sheet version holds: the order, then what the definition includes (items of
 * its types with its fields, counts of its lists). Reads current data only; nothing is written.
 */
export async function buildRunSheetContent({
  context,
  order,
  definition,
}: BuildRunSheetContentInput): Promise<RunSheetContent> {
  const [items, requirements] = await Promise.all([
    itemRows({ context, orderId: order.id, definition }),
    requirementRows({ context, orderId: order.id, definition }),
  ]);
  const head = {
    kind: "ORDER",
    key: order.id,
    parentKey: null,
    // The title leads; the reference stays so the receiver can quote it back.
    label: order.title ? `${order.title} · #${order.reference}` : String(order.reference),
    itemName: null,
    quantity: order.guaranteedHeadcount ?? order.estimatedHeadcount,
    startsAt: order.desiredStartsAt?.toISOString() ?? null,
    endsAt: order.desiredEndsAt?.toISOString() ?? null,
    values: {},
  } as const;
  return { rows: [head, ...items, ...requirements] };
}
