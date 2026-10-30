import type { TicketStatusDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type TransitionsFormOutput,
  type TransitionsFormValues,
  transitionsFormDefaults,
  transitionsFormSchema,
} from "./transitions-form-schema";

export type UseTransitionsFormInput = { ticketStatus: TicketStatusDto };

/** react-hook-form for the statuses a ticket may move to from `status`, with their gates. */
export function useTransitionsForm({ ticketStatus }: UseTransitionsFormInput) {
  const schema = useMemo(() => transitionsFormSchema({ ticketStatus }), [ticketStatus]);
  return useForm<TransitionsFormValues, unknown, TransitionsFormOutput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: transitionsFormDefaults({ ticketStatus }),
  });
}
