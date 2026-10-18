import { zodResolver } from "@hookform/resolvers/zod";
import type { TicketPhaseCreateInput, TicketPhaseDto } from "@okazi/core/schemas";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type TicketPhaseFormValues,
  ticketPhaseFormDefaults,
  ticketPhaseFormSchema,
} from "./ticket-phase-form-schema";

export type UseTicketPhaseFormInput = { phase?: TicketPhaseDto | undefined };

/** react-hook-form wired to core's ticket phase schema with localized validation messages. */
export function useTicketPhaseForm({ phase }: UseTicketPhaseFormInput) {
  return useForm<TicketPhaseFormValues, unknown, TicketPhaseCreateInput>({
    resolver: zodResolver(ticketPhaseFormSchema, useZodMessages()),
    defaultValues: ticketPhaseFormDefaults({ phase }),
  });
}
