import { z } from "zod";

/** What made a ticket change phase (ADR 0054). */
export const PHASE_CHANGE_TRIGGERS = ["MANUAL", "QUOTE_EVENT", "TEMPLATE", "SYSTEM"] as const;
export const PhaseChangeTriggerSchema = z
  .enum(PHASE_CHANGE_TRIGGERS)
  .describe(
    "MANUAL (a person: ticket.create, ticket.changePhase), QUOTE_EVENT (quote.send, " +
      "quote.accept), TEMPLATE (ticket.createFromTemplate) or SYSTEM (e.g. a phase archived)",
  );

/** One entry of a ticket's phase history (ADR 0054). */
export const TicketPhaseChangeSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  /** Null for the first entry: the phase the ticket was created in. */
  fromPhaseId: z.string().nullable(),
  toPhaseId: z.string(),
  reason: z.string().nullable(),
  trigger: PhaseChangeTriggerSchema,
  changedAt: z.date(),
  /** User id of who made the change; null for the system. */
  changedBy: z.string().nullable(),
});

/** Facts that contradict the ticket's phase (ADR 0054); derived on read, never resolved. */
export const PHASE_WARNINGS = ["QUOTE_ACCEPTED_IN_EARLIER_PHASE"] as const;
export const TicketPhaseWarningSchema = z
  .enum(PHASE_WARNINGS)
  .describe(
    "QUOTE_ACCEPTED_IN_EARLIER_PHASE: the ticket has an accepted quote but is in a phase " +
      "before the one acceptance leads to (only shown to callers who may read quotes)",
  );

export const TicketPhaseHistoryInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list)"),
});

export const TicketPhaseHistoryOutputSchema = z.object({
  /** Oldest first; the last entry is the current phase. */
  items: z.array(TicketPhaseChangeSchema),
  warnings: z.array(TicketPhaseWarningSchema),
});

export type TicketPhaseChangeDto = z.infer<typeof TicketPhaseChangeSchema>;
export type TicketPhaseWarning = z.infer<typeof TicketPhaseWarningSchema>;
export type TicketPhaseHistory = z.infer<typeof TicketPhaseHistoryOutputSchema>;
