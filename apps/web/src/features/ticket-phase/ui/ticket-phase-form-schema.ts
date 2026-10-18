import type { TicketPhaseDto } from "@okazi/core/schemas";
import { TicketPhaseCreateInputSchema } from "@okazi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the phase form: name, color and the generic phase flags (ADR 0043). */
export type TicketPhaseFormValues = {
  name: string;
  color: string;
  entry: boolean;
  terminal: boolean;
  requiresReason: boolean;
  requiresAssignee: boolean;
  invoiceable: boolean;
};

export type TicketPhaseFormInput = { values: TicketPhaseFormValues };

/** Form values → the shape core's `ticketPhase.create` input schema validates. */
export function ticketPhaseFormToInput({ values }: TicketPhaseFormInput) {
  return { ...values, name: values.name.trim() };
}

export const ticketPhaseFormSchema = formSchema({
  schema: TicketPhaseCreateInputSchema,
  toInput: ticketPhaseFormToInput,
});

export type TicketPhaseDefaultsInput = { phase?: TicketPhaseDto | undefined };

export function ticketPhaseFormDefaults({
  phase,
}: TicketPhaseDefaultsInput): TicketPhaseFormValues {
  return {
    name: phase?.name ?? "",
    color: phase?.color ?? "#64748b",
    entry: phase?.entry ?? false,
    terminal: phase?.terminal ?? false,
    requiresReason: phase?.requiresReason ?? false,
    requiresAssignee: phase?.requiresAssignee ?? false,
    invoiceable: phase?.invoiceable ?? false,
  };
}
