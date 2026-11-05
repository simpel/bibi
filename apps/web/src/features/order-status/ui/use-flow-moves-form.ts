import type { OrderStatusDto } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type FlowMovesOutput,
  type FlowMovesValues,
  flowMovesDefaults,
  flowMovesSchema,
} from "./flow-moves-form-schema";

export type UseFlowMovesFormInput = { orderStatus: OrderStatusDto };

/** react-hook-form for where orders in one status may move (Allowed next). */
export function useFlowMovesForm({ orderStatus }: UseFlowMovesFormInput) {
  const schema = useMemo(() => flowMovesSchema({ orderStatus }), [orderStatus]);
  return useForm<FlowMovesValues, unknown, FlowMovesOutput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: flowMovesDefaults({ orderStatus }),
  });
}
