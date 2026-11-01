import { z } from "zod";

/** A ticket's estimated value excl. VAT, in minor units (ADR 0074). */
export const EstimatedValueSchema = z
  .number()
  .int()
  .min(0)
  .describe(
    "Estimated value excl. VAT in minor units (1/100 of the currency); each change is kept " +
      "in the estimate history (ticket.estimateHistory). null clears it",
  );

/** One entry of a ticket's estimate history (ADR 0074). */
export const TicketEstimateSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  /** Null when the estimate was cleared. */
  valueMinor: z.number().int().nullable(),
  changedAt: z.date(),
  /** User id of who made the change; null for the system. */
  changedBy: z.string().nullable(),
});

export const TicketEstimateHistoryInputSchema = z.object({
  ticketId: z.string().min(1).describe("Id of the ticket (ticket.list)"),
});

export const TicketEstimateHistoryOutputSchema = z.object({
  /** Oldest first; the first entry is the first estimate, the last the current one. */
  items: z.array(TicketEstimateSchema),
});

export type TicketEstimateDto = z.infer<typeof TicketEstimateSchema>;
export type TicketEstimateHistory = z.infer<typeof TicketEstimateHistoryOutputSchema>;
