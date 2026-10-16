import { BookingAssignInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the owners form: user ids, or `NONE` for no one. */
export type AssignFormValues = { salesOwnerId: string; coordinatorId: string };

export type AssignFormOutput = z.infer<typeof BookingAssignInputSchema>;

const owner = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

export type AssignDefaultsInput = { salesOwnerId: string | null; coordinatorId: string | null };

export const assignFormDefaults = ({
  salesOwnerId,
  coordinatorId,
}: AssignDefaultsInput): AssignFormValues => ({
  salesOwnerId: salesOwnerId ?? NONE,
  coordinatorId: coordinatorId ?? NONE,
});

/** Core's `booking.assign` schema; both owners are always sent (null = no one). */
export const assignFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: BookingAssignInputSchema,
    toInput: ({ values }: { values: AssignFormValues }) => ({
      id,
      salesOwnerId: owner({ value: values.salesOwnerId }),
      coordinatorId: owner({ value: values.coordinatorId }),
    }),
  });
