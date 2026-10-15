import type { BookingStatusDto } from "@okazi/core/schemas";
import { BookingStatusSetTransitionsInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

export type TransitionsFormValues = { toStatusIds: string[] };
export type TransitionsFormOutput = z.infer<typeof BookingStatusSetTransitionsInputSchema>;

export type TransitionsFormSchemaInput = { status: BookingStatusDto };

/** Core's `bookingStatus.setTransitions` schema for one status's checkbox list. */
export function transitionsFormSchema({ status }: TransitionsFormSchemaInput) {
  return formSchema({
    schema: BookingStatusSetTransitionsInputSchema,
    toInput: ({ values }: { values: TransitionsFormValues }) => ({
      id: status.id,
      toStatusIds: values.toStatusIds,
    }),
  });
}
