import type { TicketStatusDto } from "@bibi/core/schemas";
import { TicketStatusSetTransitionsInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Allowed next (ADR 0076): any status, or only the chosen targets. */
export type FlowMovesValues = {
  onlyThese: boolean;
  toStatusIds: string[];
};
export type FlowMovesOutput = z.infer<typeof TicketStatusSetTransitionsInputSchema>;

export type FlowMovesSchemaInput = { ticketStatus: TicketStatusDto };

/** The form's values for a status: free movement, or its chosen targets. */
export function flowMovesDefaults({ ticketStatus }: FlowMovesSchemaInput): FlowMovesValues {
  return {
    onlyThese: ticketStatus.restrictsNext,
    toStatusIds: ticketStatus.restrictsNext ? [...ticketStatus.transitionsTo] : [],
  };
}

/** Core's `ticketStatus.setTransitions` schema over the form's two fields. */
export function flowMovesSchema({ ticketStatus }: FlowMovesSchemaInput) {
  return formSchema({
    schema: TicketStatusSetTransitionsInputSchema,
    toInput: ({ values }: { values: FlowMovesValues }) => ({
      id: ticketStatus.id,
      allowedNext: values.onlyThese ? "ONLY_THESE" : "ANY",
      toStatusIds: values.onlyThese ? values.toStatusIds : [],
    }),
  });
}
