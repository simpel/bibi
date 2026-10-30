import type { TicketStatusCreateInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  NEW_TICKET_STATUS_DEFAULTS,
  type NewTicketStatusFormValues,
  newTicketStatusFormSchema,
} from "./new-ticket-status-form-schema";

/** A new status's form (name and colour), wired to core's create schema. */
export function useNewTicketStatusForm() {
  return useForm<NewTicketStatusFormValues, unknown, TicketStatusCreateInput>({
    resolver: zodResolver(newTicketStatusFormSchema, useZodMessages()),
    defaultValues: NEW_TICKET_STATUS_DEFAULTS,
  });
}
