import type { PhaseEvent, TicketPhaseDto } from "@okazi/core/schemas";
import { TicketPhaseCreateInputSchema } from "@okazi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the phase form: name, color and the generic phase flags (ADR 0043). */
export type TicketPhaseFormValues = {
  name: string;
  color: string;
  entry: boolean;
  terminal: boolean;
  requiresReason: boolean;
  requiresAssignee: boolean;
  requiresAcceptedQuote: boolean;
  invoiceable: boolean;
  /** The quote event that enters the phase, or `NONE`. */
  event: PhaseEvent | typeof NONE;
};

export type TicketPhaseFormInput = { values: TicketPhaseFormValues };

/** Form values → the shape core's `ticketPhase.create` input schema validates. */
export function ticketPhaseFormToInput({ values }: TicketPhaseFormInput) {
  const event = values.event === NONE ? null : values.event;
  return { ...values, event, name: values.name.trim() };
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
    requiresAcceptedQuote: phase?.requiresAcceptedQuote ?? false,
    invoiceable: phase?.invoiceable ?? false,
    event: phase?.event ?? NONE,
  };
}
