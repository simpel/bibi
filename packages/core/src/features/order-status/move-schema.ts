import { z } from "zod";
import { StatusGatesSchema } from "./gate-schema";

export const OrderStatusSetTransitionsInputSchema = z.object({
  id: z.string().min(1).describe("The status the moves start from"),
  allowedNext: z
    .enum(["ANY", "ONLY_THESE"])
    .describe("ANY: an order may move to any status. ONLY_THESE: only to `toStatusIds`"),
  toStatusIds: z
    .array(z.string().min(1))
    .default([])
    .describe("With ONLY_THESE: every status an order may move to; replaces the current set"),
});

export const OrderStatusSetGatesInputSchema = z.object({
  id: z.string().min(1).describe("The status the gates guard moves into"),
  gates: z
    .array(StatusGatesSchema)
    .describe(
      "Every gate on moves into this status, by source (a status id, or null for any); " +
        "replaces the current set",
    ),
});

export type OrderStatusSetTransitionsInput = z.infer<typeof OrderStatusSetTransitionsInputSchema>;
export type OrderStatusSetGatesInput = z.infer<typeof OrderStatusSetGatesInputSchema>;
