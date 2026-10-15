import type { BookingPhase, BookingStatusDto } from "@okazi/core/schemas";
import { BookingStatusCreateInputSchema } from "@okazi/core/schemas";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the status form; `phase` only matters when creating. */
export type BookingStatusFormValues = { name: string; color: string; phase: BookingPhase };

export type BookingStatusFormInput = { values: BookingStatusFormValues };

/** Form values → the shape core's `bookingStatus.create` input schema validates. */
export function bookingStatusFormToInput({ values }: BookingStatusFormInput) {
  return { name: values.name.trim(), color: values.color, phase: values.phase };
}

export const bookingStatusFormSchema = formSchema({
  schema: BookingStatusCreateInputSchema,
  toInput: bookingStatusFormToInput,
});

export type BookingStatusDefaultsInput = { status?: BookingStatusDto | undefined };

export function bookingStatusFormDefaults({
  status,
}: BookingStatusDefaultsInput): BookingStatusFormValues {
  return {
    name: status?.name ?? "",
    color: status?.color ?? "#64748b",
    phase: status?.phase ?? "TENTATIVE",
  };
}
