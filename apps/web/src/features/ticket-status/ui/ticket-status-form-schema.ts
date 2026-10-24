import type { StatusEvent, TicketStatusDto } from "@bibi/core/schemas";
import { TicketStatusCreateInputSchema } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the status form: name, color and the generic status flags (ADR 0043). */
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

/** Form values → the shape core's `ticketStatus.create` input schema validates. */
export function ticketStatusFormToInput({ values }: TicketStatusFormInput) {
  const event = values.event === NONE ? null : values.event;
  return { ...values, event, name: values.name.trim() };
}

export const ticketStatusFormSchema = formSchema({
  schema: TicketStatusCreateInputSchema,
  toInput: ticketStatusFormToInput,
});

export type TicketStatusDefaultsInput = { ticketStatus?: TicketStatusDto | undefined };

export function ticketStatusFormDefaults({
  ticketStatus,
}: TicketStatusDefaultsInput): TicketStatusFormValues {
  return {
    name: ticketStatus?.name ?? "",
    color: ticketStatus?.color ?? "#64748b",
    entry: ticketStatus?.entry ?? false,
    closes: ticketStatus?.closes ?? false,
    requiresReason: ticketStatus?.requiresReason ?? false,
    requiresAssignee: ticketStatus?.requiresAssignee ?? false,
    requiresAcceptedQuote: ticketStatus?.requiresAcceptedQuote ?? false,
    invoiceable: ticketStatus?.invoiceable ?? false,
    event: ticketStatus?.event ?? NONE,
  };
}
