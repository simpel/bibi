import type { TicketStatusDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type TicketStatusEdit,
  type TicketStatusFormValues,
  ticketStatusFormDefaults,
  ticketStatusFormSchema,
} from "./ticket-status-form-schema";

export type UseTicketStatusFormInput = { ticketStatus: TicketStatusDto };

/** The status edit form, wired to core's update schema with localized validation messages. */
export function useTicketStatusForm({ ticketStatus }: UseTicketStatusFormInput) {
  return useForm<TicketStatusFormValues, unknown, TicketStatusEdit>({
    resolver: zodResolver(ticketStatusFormSchema, useZodMessages()),
    defaultValues: ticketStatusFormDefaults({ ticketStatus }),
  });
}
