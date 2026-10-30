import { z } from "zod";

/**
 * The gates a transition can carry (ADR 0067 §5): code-owned checks a move must pass. A status
 * carries no move rules of its own; gates read facts and never store them (ADR 0054).
 */
export const TRANSITION_GATES = ["REASON", "ASSIGNEE", "ACCEPTED_QUOTE"] as const;
export const TransitionGateSchema = z
  .enum(TRANSITION_GATES)
  .describe(
    "REASON: the move needs a reason. ASSIGNEE: the ticket needs its main assignee. " +
      "ACCEPTED_QUOTE: the ticket needs an accepted quote",
  );
export type TransitionGate = z.infer<typeof TransitionGateSchema>;

/** The gates of one transition, from the status that lists it to `toStatusId`. */
export const TransitionGatesSchema = z.object({
  toStatusId: z.string().min(1),
  gates: z.array(TransitionGateSchema),
});
export type TransitionGates = z.infer<typeof TransitionGatesSchema>;
