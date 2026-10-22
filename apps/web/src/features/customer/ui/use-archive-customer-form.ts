import { CustomerArchiveInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useZodMessages } from "@/lib/use-zod-messages";

export type ArchiveCustomerValues = { archiveTickets: boolean };
export type ArchiveCustomerInput = z.infer<typeof CustomerArchiveInputSchema>;

/** `ticketCount` is the count the dialog shows; it is sent as `expectedTicketCount` (#144). */
export type UseArchiveCustomerFormInput = { id: string; ticketCount: number };

/**
 * react-hook-form wired to core's `customer.archive` schema; the cascade box starts unticked.
 * With the box ticked the count the user saw is bound to the input, so core refuses with
 * CONFLICT instead of archiving tickets added after the dialog opened.
 */
export function useArchiveCustomerForm({ id, ticketCount }: UseArchiveCustomerFormInput) {
  const messages = useZodMessages();
  const schema = useMemo(
    () =>
      formSchema({
        schema: CustomerArchiveInputSchema,
        toInput: ({ values }: { values: ArchiveCustomerValues }) => ({
          id,
          archiveTickets: values.archiveTickets,
          ...(values.archiveTickets ? { expectedTicketCount: ticketCount } : {}),
        }),
      }),
    [id, ticketCount],
  );
  return useForm<ArchiveCustomerValues, unknown, ArchiveCustomerInput>({
    resolver: zodResolver(schema, messages),
    defaultValues: { archiveTickets: false },
  });
}
