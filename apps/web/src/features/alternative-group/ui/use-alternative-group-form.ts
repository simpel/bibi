import { zodResolver } from "@hookform/resolvers/zod";
import type { AlternativeGroupCreateInput } from "@okazi/core/schemas";
import { AlternativeGroupCreateInputSchema } from "@okazi/core/schemas";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { formSchema } from "@/lib/form-schema";
import { useZodMessages } from "@/lib/use-zod-messages";

/** Raw values of the create form: a name and the picked lines. */
export type AlternativeGroupFormValues = { name: string; lineIds: string[] };

export type UseAlternativeGroupFormInput = { ticketId: string };

/** react-hook-form wired to core's `alternativeGroup.create` schema, for one ticket. */
export function useAlternativeGroupForm({ ticketId }: UseAlternativeGroupFormInput) {
  const schema = useMemo(
    () =>
      formSchema({
        schema: AlternativeGroupCreateInputSchema,
        toInput: ({ values }: { values: AlternativeGroupFormValues }) => ({
          ticketId,
          name: values.name.trim(),
          lineIds: values.lineIds,
        }),
      }),
    [ticketId],
  );
  return useForm<AlternativeGroupFormValues, unknown, AlternativeGroupCreateInput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { name: "", lineIds: [] },
  });
}
