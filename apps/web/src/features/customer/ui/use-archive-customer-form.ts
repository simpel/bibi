import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerArchiveInputSchema } from "@okazi/core/schemas";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useZodMessages } from "@/lib/use-zod-messages";

export type ArchiveCustomerValues = { archiveBookings: boolean };
export type ArchiveCustomerInput = z.infer<typeof CustomerArchiveInputSchema>;

export type UseArchiveCustomerFormInput = { id: string };

/** react-hook-form wired to core's `customer.archive` schema; the cascade box starts unticked. */
export function useArchiveCustomerForm({ id }: UseArchiveCustomerFormInput) {
  const messages = useZodMessages();
  const schema = useMemo(
    () =>
      formSchema({
        schema: CustomerArchiveInputSchema,
        toInput: ({ values }: { values: ArchiveCustomerValues }) => ({
          id,
          archiveBookings: values.archiveBookings,
        }),
      }),
    [id],
  );
  return useForm<ArchiveCustomerValues, unknown, ArchiveCustomerInput>({
    resolver: zodResolver(schema, messages),
    defaultValues: { archiveBookings: false },
  });
}
