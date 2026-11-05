import type { OrderStatusDto } from "@bibi/core/schemas";
import { OrderStatusSetTransitionsInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Allowed next (ADR 0076): any status, or only the chosen targets. */
export type FlowMovesValues = {
  onlyThese: boolean;
  toStatusIds: string[];
};
export type FlowMovesOutput = z.infer<typeof OrderStatusSetTransitionsInputSchema>;

export type FlowMovesSchemaInput = { orderStatus: OrderStatusDto };

/** The form's values for a status: free movement, or its chosen targets. */
export function flowMovesDefaults({ orderStatus }: FlowMovesSchemaInput): FlowMovesValues {
  return {
    onlyThese: orderStatus.restrictsNext,
    toStatusIds: orderStatus.restrictsNext ? [...orderStatus.transitionsTo] : [],
  };
}

/** Core's `orderStatus.setTransitions` schema over the form's two fields. */
export function flowMovesSchema({ orderStatus }: FlowMovesSchemaInput) {
  return formSchema({
    schema: OrderStatusSetTransitionsInputSchema,
    toInput: ({ values }: { values: FlowMovesValues }) => ({
      id: orderStatus.id,
      allowedNext: values.onlyThese ? "ONLY_THESE" : "ANY",
      toStatusIds: values.onlyThese ? values.toStatusIds : [],
    }),
  });
}
