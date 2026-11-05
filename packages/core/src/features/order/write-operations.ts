import { ok } from "../../errors/result";
import { allFollowUps } from "../../operations/all-follow-ups";
import { defineOperation } from "../../operations/define-operation";
import type { LinkValue } from "../../records/record-links";
import { updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { notifyCreatedAssignee } from "../notification/follow-ups";
import { regenerateForOrder } from "../run-sheet/regenerate";
import { runOrderCreate } from "./create-order";
import { recordEstimate } from "./estimate-history";
import { OrderCreateInputSchema, OrderSchema, OrderUpdateInputSchema } from "./schema";
import { titleAfterCreate } from "./title/generate-title";
import { loadOrder, ORDER_INCLUDE, toOrderDto } from "./to-order-dto";
import { checkOrderDetails } from "./update-rules";

export const createOrder = defineOperation({
  name: "order.create",
  kind: "command",
  description:
    "Create an order of one of the organization's order types for a customer (ADR 0043), with " +
    "its lines in one step (ADR 0081): all of it is created, or nothing. It gets the next " +
    "reference number and starts in the organization's entry status, and each line in the " +
    "state the status grid gives its item type there. Nothing but the type, the customer and a " +
    "contact who works at the customer is required. `note` holds notes for the whole booking. " +
    "`assigneeId` (a member) becomes the main assignee. `fields` must match the type's own " +
    "fields. `lines` carry their chosen options and needs; a line whose hard start state would " +
    "clash is refused with CONFLICT at lines.<index> naming the blocking order, while a soft " +
    "overlap is prebooked. `templateId` records the package the lines came from, and " +
    "`inboundMessageId` attaches the inbox message the order is made from. Repeating a " +
    "call with the same `intakeKey` returns the first order and creates nothing. Without a " +
    "`title` one is generated from the order after it is created (null when none could be).",
  input: OrderCreateInputSchema,
  output: OrderSchema,
  permission: "order:write",
  followUp: allFollowUps({ steps: [regenerateForOrder, notifyCreatedAssignee] }),
  handler: async ({ input, context }) => runOrderCreate({ context, input }),
  external: titleAfterCreate,
  externalOptional: true,
});

export const updateOrder = defineOperation({
  name: "order.update",
  kind: "command",
  description:
    "Update an order's title, customer, contact, desired period, headcount, budget, estimated value " +
    "(each change is kept: order.estimateHistory), " +
    "holdsUntil (when its soft holds expire), the booking note or own " +
    "fields. The contact can be changed but never cleared. Omitted properties are unchanged; " +
    "`fields` is merged by key (null clears a value). " +
    "The type cannot be changed, the status changes only with order.changeStatus and the " +
    "assignee with assignment.assign.",
  input: OrderUpdateInputSchema,
  output: OrderSchema,
  permission: "order:write",
  followUp: regenerateForOrder,
  handler: async ({ input: { id, fields: patch, estimatedValueMinor, ...data }, context }) => {
    const before = await loadOrder({ context, id });
    if (!before) return notFound({ entity: "Order" });
    const details = await checkOrderDetails({ context, before, change: data });
    if (!details.ok) return details;
    let json: ReturnType<typeof toJson>;
    let links: LinkValue[] | undefined;
    if (patch) {
      const values = mergeFields({ before: before.fields, patch });
      const checked = await validateFields({ context, entityTypeId: before.entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value.fields });
      links = checked.value.links;
    }
    await updateRecord({ context, id, change: { fields: json, links } });
    const current = before.estimatedValueMinor;
    await recordEstimate({ context, orderId: id, current, valueMinor: estimatedValueMinor });
    const row = await context.db.order.update({
      where: { id },
      data: { ...data, ...(json ? { fields: json } : {}) },
      include: ORDER_INCLUDE,
    });
    const order = toOrderDto({ row });
    context.recordChange({ entityId: id, before, after: order });
    return ok({ value: order });
  },
});
