import { TicketStatusCreateInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of a new status: only its name and colour; flags are set when editing it. */
export type NewTicketStatusFormValues = { name: string; color: string };

export const NEW_TICKET_STATUS_DEFAULTS: NewTicketStatusFormValues = {
  name: "",
  color: "#64748b",
};

/** Form values → the shape core's `ticketStatus.create` input schema validates. */
export const newTicketStatusFormSchema = formSchema({
  schema: TicketStatusCreateInputSchema,
  toInput: ({ values }: { values: NewTicketStatusFormValues }) => ({
    ...values,
    name: values.name.trim(),
  }),
});
