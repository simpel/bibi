import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerArchiveInputSchema } from "@okazi/core/schemas";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useZodMessages } from "@/lib/use-zod-messages";

export type ArchiveCustomerValues = { archiveBookings: boolean; archiveInquiries: boolean };
export type ArchiveCustomerInput = z.infer<typeof CustomerArchiveInputSchema>;

/** `bookingCount` is the count the dialog shows; it is sent as `expectedBookingCount` (#144). */
export type UseArchiveCustomerFormInput = { id: string; bookingCount: number };

/**
 * react-hook-form wired to core's `customer.archive` schema; the cascade box starts unticked.
 * With the box ticked the count the user saw is bound to the input, so core refuses with
 * CONFLICT instead of archiving bookings added after the dialog opened.
 */
export function useArchiveCustomerForm({ id, bookingCount }: UseArchiveCustomerFormInput) {
  const messages = useZodMessages();
  const schema = useMemo(
    () =>
      formSchema({
        schema: CustomerArchiveInputSchema,
        toInput: ({ values }: { values: ArchiveCustomerValues }) => ({
          id,
          archiveBookings: values.archiveBookings,
          archiveInquiries: values.archiveInquiries,
          ...(values.archiveBookings ? { expectedBookingCount: bookingCount } : {}),
        }),
      }),
    [id, bookingCount],
  );
  return useForm<ArchiveCustomerValues, unknown, ArchiveCustomerInput>({
    resolver: zodResolver(schema, messages),
    defaultValues: { archiveBookings: false, archiveInquiries: false },
  });
}
