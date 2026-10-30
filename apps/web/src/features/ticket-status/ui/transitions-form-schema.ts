import type { TicketStatusDto, TransitionGate } from "@bibi/core/schemas";
import { TicketStatusSetTransitionsInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** The allowed targets, and the gates (ADR 0067 §5) of each target's transition. */
export type TransitionsFormValues = {
  toStatusIds: string[];
  gates: Record<string, TransitionGate[]>;
};
export type TransitionsFormOutput = z.infer<typeof TicketStatusSetTransitionsInputSchema>;

export type TransitionsFormSchemaInput = { ticketStatus: TicketStatusDto };

/** The form's values for a status: its targets and their current gates. */
export function transitionsFormDefaults({
  ticketStatus,
}: TransitionsFormSchemaInput): TransitionsFormValues {
  const gates = Object.fromEntries(
    ticketStatus.transitionGates.map(({ toStatusId, gates: keys }) => [toStatusId, [...keys]]),
  );
  return { toStatusIds: [...ticketStatus.transitionsTo], gates };
}

/** Core's `ticketStatus.setTransitions` schema: targets and their gates, replaced as a set. */
export function transitionsFormSchema({ ticketStatus }: TransitionsFormSchemaInput) {
  return formSchema({
    schema: TicketStatusSetTransitionsInputSchema,
    toInput: ({ values }: { values: TransitionsFormValues }) => ({
      id: ticketStatus.id,
      toStatusIds: values.toStatusIds,
      gates: values.toStatusIds.map((toStatusId) => ({
        toStatusId,
        gates: values.gates[toStatusId] ?? [],
      })),
    }),
  });
}
