import type { TicketPhaseDto } from "@okazi/core/schemas";
import { TicketPhaseSetTransitionsInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

export type TransitionsFormValues = { toPhaseIds: string[] };
export type TransitionsFormOutput = z.infer<typeof TicketPhaseSetTransitionsInputSchema>;

export type TransitionsFormSchemaInput = { phase: TicketPhaseDto };

/** Core's `ticketPhase.setTransitions` schema for one phase's checkbox list. */
export function transitionsFormSchema({ phase }: TransitionsFormSchemaInput) {
  return formSchema({
    schema: TicketPhaseSetTransitionsInputSchema,
    toInput: ({ values }: { values: TransitionsFormValues }) => ({
      id: phase.id,
      toPhaseIds: values.toPhaseIds,
    }),
  });
}
