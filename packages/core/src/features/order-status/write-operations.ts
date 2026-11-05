import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import {
  checkFlagCombination,
  checkMinimumConfiguration,
  handOverEntry,
  handOverEvent,
  serializeStatusChanges,
} from "./flag-rules";
import { insertOrderStatus, nameTaken, orderStatusNameTaken } from "./insert-order-status";
import { loadAllOrderStatuses, loadOrderStatus } from "./load-order-status";
import {
  STATUS_FLAGS,
  type StatusEvent,
  OrderStatusCreateInputSchema,
  type OrderStatusDto,
  type OrderStatusFlags,
  OrderStatusSchema,
  type OrderStatusUpdateInput,
  OrderStatusUpdateInputSchema,
} from "./schema";

export const createOrderStatus = defineOperation({
  name: "orderStatus.create",
  kind: "command",
  description:
    "Create an order status: a name and a hex color. Every flag starts false and the quote " +
    "event empty; set them with orderStatus.update. It is placed last. It shows in `phaseId` " +
    "when given, otherwise on no board until moved onto one (boardPhase.moveStatus). Orders " +
    "move to and from it freely; restrict that with orderStatus.setTransitions and guard moves " +
    "into it with orderStatus.setGates.",
  input: OrderStatusCreateInputSchema,
  output: OrderStatusSchema,
  permission: "pipeline:write",
  handler: ({ input, context }) => insertOrderStatus({ context, ...input, ownPhase: false }),
});

type FlagsAfterInput = { before: OrderStatusDto; data: Omit<OrderStatusUpdateInput, "id"> };

const flagsAfter = ({ before, data }: FlagsAfterInput): OrderStatusFlags =>
  Object.fromEntries(
    STATUS_FLAGS.map((flag) => [flag, data[flag] ?? before[flag]]),
  ) as OrderStatusFlags;

type ApplyInput = {
  context: OperationContext;
  before: OrderStatusDto;
  flags: OrderStatusFlags;
  event: StatusEvent | null | undefined;
};

/**
 * Side effects of new flags: the entry flag and a quote event move here, a closing status loses
 * its exits.
 */
async function applyFlagEffects({ context, before, flags, event }: ApplyInput) {
  if (event && event !== before.event) await handOverEvent({ context, event, id: before.id });
  if (flags.entry && !before.entry) await handOverEntry({ context, id: before.id });
  if (flags.closes && !before.closes) {
    await context.db.orderStatusTransition.deleteMany({ where: { fromStatusId: before.id } });
    await context.db.orderStatus.update({
      where: { id: before.id },
      data: { restrictsNext: false },
    });
  }
}

export const updateOrderStatus = defineOperation({
  name: "orderStatus.update",
  kind: "command",
  description:
    "Rename or recolor an order status, or change its flags. Renaming and recoloring change no " +
    "behavior. Making a status the entry status takes the flag from the current one; making it " +
    "closing removes its transitions out; setting an `event` takes it from the status that had it " +
    "(null clears it). A change that leaves the organization without an " +
    "entry or a closing status is a CONFLICT.",
  input: OrderStatusUpdateInputSchema,
  output: OrderStatusSchema,
  permission: "pipeline:write",
  handler: async ({ input: { id, ...data }, context }) => {
    await serializeStatusChanges({ context });
    const before = await loadOrderStatus({ context, id });
    if (!before) return notFound({ entity: "Order status" });
    const { name } = data;
    if (name !== undefined && name !== before.name) {
      if (await orderStatusNameTaken({ context, name, id })) return nameTaken({ name });
    }
    const flags = flagsAfter({ before, data });
    for (const check of [
      checkFlagCombination({ flags }),
      checkMinimumConfiguration({
        statuses: await loadAllOrderStatuses({ context }),
        id,
        after: flags,
      }),
    ]) {
      if (!check.ok) return check;
    }
    await applyFlagEffects({ context, before, flags, event: data.event });
    await context.db.orderStatus.update({ where: { id }, data });
    const after = await loadOrderStatus({ context, id });
    if (!after) return notFound({ entity: "Order status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
