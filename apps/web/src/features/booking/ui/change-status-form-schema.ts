import { BookingChangeStatusInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the change-status form; an empty reason is not sent. */
export type ChangeStatusFormValues = { statusId: string; reason: string };

export type ChangeStatusFormOutput = z.infer<typeof BookingChangeStatusInputSchema>;

/** Core's `booking.changeStatus` schema for one booking. */
export const changeStatusFormSchema = ({ bookingId }: { bookingId: string }) =>
  formSchema({
    schema: BookingChangeStatusInputSchema,
    toInput: ({ values }: { values: ChangeStatusFormValues }) => ({
      bookingId,
      statusId: values.statusId,
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });
