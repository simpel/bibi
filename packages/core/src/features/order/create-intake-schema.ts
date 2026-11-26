import { z } from "zod";
import { CreateDraftLineSchema } from "./draft-line-schema";

/** What `order.create` takes beyond the order's own details (ADR 0081 decisions 9 and 11). */
export const OrderIntakeShape = {
  templateId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "The package (orderTemplate.list) the lines came from, for provenance only: the first " +
        "status change is recorded with trigger TEMPLATE. Its fields and lines are not applied; " +
        "send the reviewed `lines`. Needs orderTemplate:read",
    ),
  lines: z
    .array(CreateDraftLineSchema)
    .max(100)
    .optional()
    .describe(
      "The order's lines, created with it in the entry status's states (ADR 0081): line.create " +
        "details plus `note`, `options`, `requirements` and `addOns` (ADR 0088, errors at " +
        "lines.<index>.addOns.<j>). Needs program:write, and item:read for items, options and " +
        "add-on items. A line whose hard start state would clash is refused (CONFLICT " +
        "at lines.<index>); a soft overlap is prebooked",
    ),
  inboundMessageId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "The inbox message the order is made from (inboundMessage.list, ADR 0085): it is " +
        "attached to the new order in the same step. Needs inbox:read; a message that already " +
        "has an order is refused with CONFLICT",
    ),
  taskIds: z
    .array(z.string().min(1))
    .max(20)
    .optional()
    .describe(
      "Tasks (task.list) to link to the new order in the same step (ADR 0117): each an open " +
        "or done task of the same customer with no order yet (VALIDATION at taskIds.<i>; " +
        "already linked is CONFLICT). Each room a task prebooks or books carries over (ADR " +
        "0120): it is released from the task and becomes a line for that item with the room's " +
        "window, in the item type's first soft-hold (prebook) or hard-hold (book) state, set " +
        "by hand so status moves keep it; a room one of `lines` already takes is not added " +
        "again. An item type without such a state is VALIDATION at taskIds.<i>. Needs " +
        "task:write, and program:write when rooms carry over",
    ),
  draftedFromMessage: z
    .boolean()
    .optional()
    .describe(
      "True when the values were read from a message by orderDraft.fromMessage (ADR 0084): " +
        "the order's audit records that it was drafted from a message, with inboundMessageId",
    ),
  intakeKey: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe(
      "A client key that makes the create idempotent: the same key again returns the order " +
        "the first call created and creates nothing",
    ),
};
