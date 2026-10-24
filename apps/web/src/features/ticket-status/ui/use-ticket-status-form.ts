import type { TicketStatusCreateInput, TicketStatusDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type TicketStatusFormValues,
  ticketStatusFormDefaults,
  ticketStatusFormSchema,
} from "./ticket-status-form-schema";

export type UseTicketStatusFormInput = { ticketStatus?: TicketStatusDto | undefined };

/** react-hook-form wired to core's ticket status schema with localized validation messages. */
export function useTicketStatusForm({ ticketStatus }: UseTicketStatusFormInput) {
  return useForm<TicketStatusFormValues, unknown, TicketStatusCreateInput>({
    resolver: zodResolver(ticketStatusFormSchema, useZodMessages()),
    defaultValues: ticketStatusFormDefaults({ ticketStatus }),
  });
}
