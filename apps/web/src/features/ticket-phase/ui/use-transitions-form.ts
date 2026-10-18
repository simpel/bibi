import { zodResolver } from "@hookform/resolvers/zod";
import type { TicketPhaseDto } from "@okazi/core/schemas";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type TransitionsFormOutput,
  type TransitionsFormValues,
  transitionsFormSchema,
} from "./transitions-form-schema";

export type UseTransitionsFormInput = { phase: TicketPhaseDto };

/** react-hook-form for the phases a ticket may move to from `phase`. */
export function useTransitionsForm({ phase }: UseTransitionsFormInput) {
  const schema = useMemo(() => transitionsFormSchema({ phase }), [phase]);
  return useForm<TransitionsFormValues, unknown, TransitionsFormOutput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { toPhaseIds: [...phase.transitionsTo] },
  });
}
