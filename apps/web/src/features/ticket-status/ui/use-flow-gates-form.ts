import type { TicketStatusDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type FlowGatesOutput,
  type FlowGatesValues,
  flowGatesDefaults,
  flowGatesSchema,
} from "./flow-gates-form-schema";

export type UseFlowGatesFormInput = { ticketStatus: TicketStatusDto };

/** react-hook-form for what moves into one status require. */
export function useFlowGatesForm({ ticketStatus }: UseFlowGatesFormInput) {
  const schema = useMemo(() => flowGatesSchema({ ticketStatus }), [ticketStatus]);
  return useForm<FlowGatesValues, unknown, FlowGatesOutput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: flowGatesDefaults({ ticketStatus }),
  });
}
