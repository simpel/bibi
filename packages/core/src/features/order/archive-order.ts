import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { archiveGroupsOfOrder } from "../alternative-group/archive-groups";
import { archiveLinesOfOrder } from "../line/release-for-order";
import { archiveRequirements } from "../requirement/archive-requirements";
import type { OrderDto } from "./schema";
import { ORDER_INCLUDE, toOrderDto } from "./to-order-dto";

export type ArchiveOrderInput = { context: OperationContext; order: OrderDto };

/**
 * The single place that archives an order (#145, #166): its lines and alternative groups are
 * archived, and the lines' holds go by trigger (ADR 0053), so no room stays blocked for an order
 * that is gone. Audited per row. An order archive operation and the customer cascade
 * (`customer.archive`) both go through here.
 */
export async function archiveOrder({
  context,
  order,
}: ArchiveOrderInput): Promise<Result<OrderDto>> {
  const program = await archiveLinesOfOrder({ context, orderId: order.id });
  if (!program.ok) return program;
  await archiveGroupsOfOrder({ context, orderId: order.id });
  await archiveRequirements({ context, orderId: order.id });
  const row = await context.db.order.update({
    where: { id: order.id },
    data: { status: "ARCHIVED" },
    include: ORDER_INCLUDE,
  });
  await archiveRecords({ context, ids: [order.id] });
  const after = toOrderDto({ row });
  context.recordChange({ entityType: "order", entityId: order.id, before: order, after });
  return ok({ value: after });
}
