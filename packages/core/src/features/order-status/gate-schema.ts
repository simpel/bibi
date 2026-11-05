import { z } from "zod";

/**
 * The gates a move can carry (ADR 0067 §5): code-owned checks a move must pass. A status
 * carries no move rules of its own; gates read facts and never store them (ADR 0054).
 */
export const TRANSITION_GATES = ["REASON", "ASSIGNEE", "ACCEPTED_QUOTE"] as const;
export const TransitionGateSchema = z
  .enum(TRANSITION_GATES)
  .describe(
    "REASON: the move needs a reason. ASSIGNEE: the order needs its main assignee. " +
      "ACCEPTED_QUOTE: the order needs an accepted quote",
  );
export type TransitionGate = z.infer<typeof TransitionGateSchema>;

/**
 * The gates on moves into one status from one source (ADR 0076): a status id, or null for a move
 * from any status. The gates of a move are those from any status plus those of its source.
 */
export const StatusGatesSchema = z.object({
  fromStatusId: z.string().min(1).nullable().describe("Source status; null = from any status"),
  gates: z.array(TransitionGateSchema).min(1),
});
export type StatusGates = z.infer<typeof StatusGatesSchema>;

/** The gates of the move to `toStatusId` from the status that lists it (sources already merged). */
export const TransitionGatesSchema = z.object({
  toStatusId: z.string().min(1),
  gates: z.array(TransitionGateSchema),
});
export type TransitionGates = z.infer<typeof TransitionGatesSchema>;
