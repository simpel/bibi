import { z } from "zod";

/** What made a ticket change status (ADR 0054). */
export const STATUS_CHANGE_TRIGGERS = ["MANUAL", "QUOTE_EVENT", "TEMPLATE", "SYSTEM"] as const;
export const StatusChangeTriggerSchema = z
  .enum(STATUS_CHANGE_TRIGGERS)
  .describe(
    "MANUAL (a person: ticket.create, ticket.changeStatus), QUOTE_EVENT (quote.send, " +
      "quote.accept), TEMPLATE (ticket.createFromTemplate) or SYSTEM (e.g. a status archived)",
  );

/** One entry of a ticket's status history (ADR 0054). */
export const TicketStatusChangeSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  /** Null for the first entry: the status the ticket was created in. */
  fromStatusId: z.string().nullable(),
  toStatusId: z.string(),
  reason: z.string().nullable(),
  trigger: StatusChangeTriggerSchema,
  changedAt: z.date(),
  /** User id of who made the change; null for the system. */
  changedBy: z.string().nullable(),
});

/** Facts that contradict the ticket's status (ADR 0054); derived on read, never resolved. */
export const STATUS_WARNINGS = ["QUOTE_ACCEPTED_IN_EARLIER_STATUS"] as const;
export const TicketStatusWarningSchema = z
  .enum(STATUS_WARNINGS)
  .describe(
    "QUOTE_ACCEPTED_IN_EARLIER_STATUS: the ticket has an accepted quote but is in a status " +
      "before the one acceptance leads to (only shown to callers who may read quotes)",
  );

export const TicketStatusHistoryInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list)"),
});

export const TicketStatusHistoryOutputSchema = z.object({
  /** Oldest first; the last entry is the current status. */
  items: z.array(TicketStatusChangeSchema),
  warnings: z.array(TicketStatusWarningSchema),
});

export type TicketStatusChangeDto = z.infer<typeof TicketStatusChangeSchema>;
export type TicketStatusWarning = z.infer<typeof TicketStatusWarningSchema>;
export type TicketStatusHistory = z.infer<typeof TicketStatusHistoryOutputSchema>;
