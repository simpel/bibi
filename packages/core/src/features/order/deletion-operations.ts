import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { archiveOrder } from "./archive-order";
import { orderKind } from "./deletion-kind";
import { getOrder } from "./operations";
import { OrderIdInputSchema, OrderSchema } from "./schema";
import { loadOrder } from "./to-order-dto";

export const archiveOrderOperation = defineOperation({
  name: "order.archive",
  kind: "command",
  description:
    "Archive an order: it leaves lists, boards and the calendar, and its lines, alternative " +
    "groups and requirements are archived with it, so it holds nothing. Restore it with " +
    "order.restore; archived orders are deleted after the organization's retention period " +
    "unless they have money or sent quotes.",
  input: OrderIdInputSchema,
  output: OrderSchema,
  permission: "order:delete",
  handler: async ({ input: { id }, context }) => {
    const order = await loadOrder({ context, id });
    if (!order) return notFound({ entity: "Order" });
    const archived = await archiveOrder({ context, order });
    return archived.ok ? ok({ value: archived.value }) : archived;
  },
});

export const restoreOrder = defineRestoreOperation({
  name: "order.restore",
  description:
    "Restore an archived order with the lines, alternative groups and requirements archived " +
    "with it; each line gets the state the grid gives a new line and holds its item again. " +
    "CONFLICT when it is not archived, its customer, contact, type or status is archived, or a " +
    "line's item was taken meanwhile.",
  permission: "order:delete",
  kind: orderKind,
  input: OrderIdInputSchema,
  get: getOrder,
});

export const deleteOrder = defineDeleteOperation({
  name: "order.delete",
  description:
    "Delete an archived order permanently (ADR 0118), with its lines, requirements, comments, " +
    "run sheets, draft quotes and versions. An active order is CONFLICT: archive it first. " +
    "CONFLICT, and kept, when it has a payment, deposit, invoice, a sent or accepted quote, or " +
    "a linked task.",
  permission: "order:delete",
  kind: orderKind,
  input: OrderIdInputSchema,
});
