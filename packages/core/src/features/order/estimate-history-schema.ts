import { z } from "zod";

/** An order's estimated value excl. VAT, in minor units (ADR 0074). */
export const EstimatedValueSchema = z
  .number()
  .int()
  .min(0)
  .describe(
    "Estimated value excl. VAT in minor units (1/100 of the currency); each change is kept " +
      "in the estimate history (order.estimateHistory). null clears it",
  );

/** One entry of an order's estimate history (ADR 0074). */
export const OrderEstimateSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  /** Null when the estimate was cleared. */
  valueMinor: z.number().int().nullable(),
  changedAt: z.date(),
  /** User id of who made the change; null for the system. */
  changedBy: z.string().nullable(),
});

export const OrderEstimateHistoryInputSchema = z.object({
  orderId: z.string().min(1).describe("Id of the order (order.list)"),
});

export const OrderEstimateHistoryOutputSchema = z.object({
  /** Oldest first; the first entry is the first estimate, the last the current one. */
  items: z.array(OrderEstimateSchema),
});

export type OrderEstimateDto = z.infer<typeof OrderEstimateSchema>;
export type OrderEstimateHistory = z.infer<typeof OrderEstimateHistoryOutputSchema>;
