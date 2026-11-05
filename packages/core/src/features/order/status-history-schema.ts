import { z } from "zod";

/** What made an order change status (ADR 0054). */
export const STATUS_CHANGE_TRIGGERS = ["MANUAL", "QUOTE_EVENT", "TEMPLATE", "SYSTEM"] as const;
export const StatusChangeTriggerSchema = z
  .enum(STATUS_CHANGE_TRIGGERS)
  .describe(
    "MANUAL (a person: order.create, order.changeStatus), QUOTE_EVENT (quote.send, " +
      "quote.accept), TEMPLATE (order.createFromTemplate) or SYSTEM (e.g. a status archived)",
  );

/** One entry of an order's status history (ADR 0054). */
export const OrderStatusChangeSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  /** Null for the first entry: the status the order was created in. */
  fromStatusId: z.string().nullable(),
  toStatusId: z.string(),
  reason: z.string().nullable(),
  trigger: StatusChangeTriggerSchema,
  changedAt: z.date(),
  /** User id of who made the change; null for the system. */
  changedBy: z.string().nullable(),
});

/** Facts that contradict the order's status (ADR 0054); derived on read, never resolved. */
export const STATUS_WARNINGS = ["QUOTE_ACCEPTED_IN_EARLIER_STATUS"] as const;
export const OrderStatusWarningSchema = z
  .enum(STATUS_WARNINGS)
  .describe(
    "QUOTE_ACCEPTED_IN_EARLIER_STATUS: the order has an accepted quote but is in a status " +
      "before the one acceptance leads to (only shown to callers who may read quotes)",
  );

export const OrderStatusHistoryInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order (order.list)"),
});

export const OrderStatusHistoryOutputSchema = z.object({
  /** Oldest first; the last entry is the current status. */
  items: z.array(OrderStatusChangeSchema),
  warnings: z.array(OrderStatusWarningSchema),
});

export type OrderStatusChangeDto = z.infer<typeof OrderStatusChangeSchema>;
export type OrderStatusWarning = z.infer<typeof OrderStatusWarningSchema>;
export type OrderStatusHistory = z.infer<typeof OrderStatusHistoryOutputSchema>;
