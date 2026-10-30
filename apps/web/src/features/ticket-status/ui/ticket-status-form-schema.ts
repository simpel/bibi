import type { StatusEvent, TicketStatusDto, TicketStatusUpdateInput } from "@bibi/core/schemas";
import { TicketStatusUpdateInputSchema } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the status edit form: name, color and the generic status flags (ADR 0043). */
export type TicketStatusFormValues = {
  name: string;
  color: string;
  entry: boolean;
  closes: boolean;
  requiresReason: boolean;
  requiresAssignee: boolean;
  requiresAcceptedQuote: boolean;
  invoiceable: boolean;
  /** The quote event that enters the status, or `NONE`. */
  event: StatusEvent | typeof NONE;
};

export type TicketStatusFormInput = { values: TicketStatusFormValues };

/** What the edit form saves: `ticketStatus.update` without the id. */
export type TicketStatusEdit = Omit<TicketStatusUpdateInput, "id">;

/** Form values → the shape core's `ticketStatus.update` input schema validates (without the id). */
export function ticketStatusFormToInput({ values }: TicketStatusFormInput) {
  const event = values.event === NONE ? null : values.event;
  return { ...values, event, name: values.name.trim() };
}

export const ticketStatusFormSchema = formSchema({
  schema: TicketStatusUpdateInputSchema.omit({ id: true }),
  toInput: ticketStatusFormToInput,
});

export type TicketStatusDefaultsInput = { ticketStatus: TicketStatusDto };

export function ticketStatusFormDefaults({
  ticketStatus,
}: TicketStatusDefaultsInput): TicketStatusFormValues {
  return {
    name: ticketStatus.name,
    color: ticketStatus.color,
    entry: ticketStatus.entry,
    closes: ticketStatus.closes,
    requiresReason: ticketStatus.requiresReason,
    requiresAssignee: ticketStatus.requiresAssignee,
    requiresAcceptedQuote: ticketStatus.requiresAcceptedQuote,
    invoiceable: ticketStatus.invoiceable,
    event: ticketStatus.event ?? NONE,
  };
}
