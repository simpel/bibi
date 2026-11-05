import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { type PlaceNewStatusInput, placeNewStatus } from "../board/status-placement";
import { checkFlagCombination, handOverEntry, handOverEvent } from "./flag-rules";
import { loadOrderStatus } from "./load-order-status";
import type {
  StatusEvent,
  OrderStatusCreateInput,
  OrderStatusDto,
  OrderStatusFlags,
} from "./schema";

/** A create's fields plus the flags and event a template import sets in the same step. */
export type InsertOrderStatusInput = { context: OperationContext } & OrderStatusCreateInput &
  Partial<OrderStatusFlags> & { event?: StatusEvent | null } & Pick<
    PlaceNewStatusInput,
    "ownPhase"
  >;

export type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

/** True when another active status already has this name. */
export async function orderStatusNameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.orderStatus.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

export const nameTaken = ({ name }: { name: string }) =>
  conflict({ message: `An order status named "${name}" exists` });

/** The position after the last active status. */
async function lastPosition({ context }: { context: Pick<OperationContext, "db"> }) {
  const last = await context.db.orderStatus.findFirst({ orderBy: { position: "desc" } });
  return last ? last.position + 1 : 0;
}

/** Shared by `orderStatus.create` and `.importTemplate`: unique name, flags, insert, record. */
export async function insertOrderStatus({
  context,
  phaseId,
  ownPhase,
  ...input
}: InsertOrderStatusInput): Promise<Result<OrderStatusDto>> {
  if (await orderStatusNameTaken({ context, name: input.name })) {
    return nameTaken({ name: input.name });
  }
  const flags = checkFlagCombination({ flags: input });
  if (!flags.ok) return flags;
  const position = await lastPosition({ context });
  // The current entry status gives up its flag first: one active entry status is a unique index.
  if (input.entry) await handOverEntry({ context, id: null });
  if (input.event) await handOverEvent({ context, event: input.event, id: null });
  const row = await context.db.orderStatus.create({
    data: { ...input, position, organizationId: context.organizationId },
  });
  const placed = await placeNewStatus({ context, status: row, phaseId, ownPhase });
  if (!placed.ok) return placed;
  const orderStatus = await loadOrderStatus({ context, id: row.id });
  if (!orderStatus) return conflict({ message: "The new order status could not be read back" });
  context.recordChange({ entityId: row.id, after: orderStatus });
  return ok({ value: orderStatus });
}
