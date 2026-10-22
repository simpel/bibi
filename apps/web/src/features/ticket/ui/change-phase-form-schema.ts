import { TicketChangePhaseInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the change-phase form; an empty reason is not sent. */
export type ChangePhaseFormValues = { phaseId: string; reason: string };

export type ChangePhaseFormOutput = z.infer<typeof TicketChangePhaseInputSchema>;

/** Core's `ticket.changePhase` schema for one ticket. */
export const changePhaseFormSchema = ({ ticketId }: { ticketId: string }) =>
  formSchema({
    schema: TicketChangePhaseInputSchema,
    toInput: ({ values }: { values: ChangePhaseFormValues }) => ({
      ticketId,
      phaseId: values.phaseId,
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });
