import { TicketChangeStatusInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the change-status form; an empty reason is not sent. */
export type ChangeStatusFormValues = { statusId: string; reason: string };

export type ChangeStatusFormOutput = z.infer<typeof TicketChangeStatusInputSchema>;

/** Core's `ticket.changeStatus` schema for one ticket. */
export const changeStatusFormSchema = ({ ticketId }: { ticketId: string }) =>
  formSchema({
    schema: TicketChangeStatusInputSchema,
    toInput: ({ values }: { values: ChangeStatusFormValues }) => ({
      ticketId,
      statusId: values.statusId,
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });
