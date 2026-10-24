import type { TicketStatusDto } from "@bibi/core/schemas";
import { TicketStatusSetTransitionsInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

export type TransitionsFormValues = { toStatusIds: string[] };
export type TransitionsFormOutput = z.infer<typeof TicketStatusSetTransitionsInputSchema>;

export type TransitionsFormSchemaInput = { ticketStatus: TicketStatusDto };

/** Core's `ticketStatus.setTransitions` schema for one status's checkbox list. */
export function transitionsFormSchema({ ticketStatus }: TransitionsFormSchemaInput) {
  return formSchema({
    schema: TicketStatusSetTransitionsInputSchema,
    toInput: ({ values }: { values: TransitionsFormValues }) => ({
      id: ticketStatus.id,
      toStatusIds: values.toStatusIds,
    }),
  });
}
