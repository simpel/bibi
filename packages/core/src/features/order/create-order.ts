import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { attachMessage } from "../inbound-message/attach-message";
import { handOverTaskRooms } from "../task/hand-over-rooms";
import { linkTasks } from "../task/link-order";
import { createWithLines } from "./create-with-lines";
import { checkIntakeAccess, checkTemplate, findIntake } from "./intake-checks";
import { checkCreateLines } from "./intake-refs";
import type { OrderCreateInput, OrderDto } from "./schema";
import { taskRoomLines } from "./task-room-lines";
import { applyTaskRoomStates } from "./task-room-states";
import { loadOrder } from "./to-order-dto";

export type CreateOrderInput = { context: OperationContext; input: OrderCreateInput };

/** The order an earlier create with the input's `intakeKey` made, or null to create one. */
async function earlier({ context, input }: CreateOrderInput): Promise<Result<OrderDto | null>> {
  const { intakeKey, customerId } = input;
  if (!intakeKey) return ok({ value: null });
  const found = await findIntake({ context, customerId, intakeKey });
  if (!found.ok) return found;
  if (found.value === null) return ok({ value: null });
  const order = await loadOrder({ context, id: found.value });
  return order ? ok({ value: order }) : notFound({ entity: "Order" });
}

type DraftedInput = CreateOrderInput & { orderId: string };

/** The audit says the order was drafted from a message, and which one (ADR 0084 decision 8). */
function recordDrafted({ context, input, orderId }: DraftedInput) {
  const after = { draftedFromMessage: true, inboundMessageId: input.inboundMessageId ?? null };
  context.recordChange({ entityType: "order", entityId: orderId, after });
}

/**
 * `order.create` (ADR 0081 decisions 9 and 11): the permissions of the parts given, then the
 * order an earlier call with the same `intakeKey` made (returned as is, nothing recorded), the
 * template and every id the lines reference, and the order with its lines in the entry status,
 * then the tasks given are linked (ADR 0117; their prebooked and booked rooms become lines in the
 * same hold, ADR 0120) and the inbox message it is made from is attached to
 * it (ADR 0085), all in one transaction.
 * A template makes the first status change `TEMPLATE`; its own lines and fields are not applied.
 */
export async function runOrderCreate({
  context,
  input,
}: CreateOrderInput): Promise<Result<OrderDto>> {
  const access = checkIntakeAccess({ context, input });
  if (!access.ok) return access;
  const found = await earlier({ context, input });
  if (!found.ok) return found;
  if (found.value) return ok({ value: found.value });
  const taskIds = input.taskIds ?? [];
  const takenItemIds = (input.lines ?? []).flatMap((line) => line.itemId ?? []);
  const fromTasks = await taskRoomLines({ context, taskIds, takenItemIds });
  if (!fromTasks.ok) return fromTasks;
  const lines = [...(input.lines ?? []), ...fromTasks.value.lines];
  for (const check of [
    await checkTemplate({ context, templateId: input.templateId }),
    await checkCreateLines({ context, lines, customerId: input.customerId }),
  ]) {
    if (!check.ok) return check;
  }
  const handed = await handOverTaskRooms({ context, taskIds });
  if (!handed.ok) return handed;
  const trigger = input.templateId ? "TEMPLATE" : "MANUAL";
  const made = await createWithLines({ context, input, lines, trigger, subject: "the order" });
  if (made.ok) {
    const { rooms } = fromTasks.value;
    const held = await applyTaskRoomStates({ context, orderId: made.value.id, rooms });
    if (!held.ok) return held;
  }
  if (made.ok && input.draftedFromMessage)
    recordDrafted({ context, input, orderId: made.value.id });
  if (made.ok && input.taskIds?.length) {
    const linked = await linkTasks({
      ...{ context, orderId: made.value.id, customerId: input.customerId },
      ...{ taskIds: input.taskIds, pathOf: (index: number) => `taskIds.${index}` },
    });
    if (!linked.ok) return linked;
  }
  if (!made.ok || !input.inboundMessageId) return made;
  const orderId = made.value.id;
  const id = input.inboundMessageId;
  const attached = await attachMessage({ context, id, orderId, path: "inboundMessageId" });
  return attached.ok ? made : attached;
}
