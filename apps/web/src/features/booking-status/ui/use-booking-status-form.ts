import { zodResolver } from "@hookform/resolvers/zod";
import type { BookingStatusCreateInput, BookingStatusDto } from "@okazi/core/schemas";
import { useForm } from "react-hook-form";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type BookingStatusFormValues,
  bookingStatusFormDefaults,
  bookingStatusFormSchema,
} from "./booking-status-form-schema";

export type UseBookingStatusFormInput = { status?: BookingStatusDto | undefined };

/** react-hook-form wired to core's booking status schema with localized validation messages. */
export function useBookingStatusForm({ status }: UseBookingStatusFormInput) {
  return useForm<BookingStatusFormValues, unknown, BookingStatusCreateInput>({
    resolver: zodResolver(bookingStatusFormSchema, useZodMessages()),
    defaultValues: bookingStatusFormDefaults({ status }),
  });
}
